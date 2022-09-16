import { check, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { emailOlvidePassword, emailRegistro } from '../helpers/emails.js';
import { generarJWT, generarId } from '../helpers/tokens.js';

import Usuario from '../models/Usuario.js';


const formularioLogin = ( req, res ) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    });
}

const autenticar = async ( req, res ) => {

    // Validación
    await check( 'email' ).isEmail().withMessage( 'El email es obligatorio' ).run( req );
    await check( 'password' ).notEmpty().withMessage( 'El password debe ser de al menos 6 caracteres' ).run( req );

    let resultado = validationResult( req );

    // Verificar que el resultado es vacío
    if ( !resultado.isEmpty() ) {
        return res.render( 'auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    const { email, password } = req.body;

    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne( { where: { email } } );
    if ( !usuario ) {
        return res.render( 'auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no existe'}]
        });
    }

    // Comprobar si el usuario está confirmado
    if ( !usuario.confirmado ) {
        return res.render( 'auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'Tu cuenta no ha sido confirmada'}]
        });
    }

    // Revisar el password
    if( !usuario.verificarPassword( password ) ) {
        return res.render( 'auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El password es incorrecto' }]
        });
    }

    // Autenticar al usuario
    const token = generarJWT( { id: usuario.id, nombre: usuario.nombre } );    

    return res.cookie('_token', token, {
        httpOnly: true,
        // secure: true,
        // sameSite: true
    }).redirect( '/mis-propiedades' );
}


const formularioRegistro = ( req, res ) => {    

    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken()
    });
}

const registrar = async ( req, res ) => {

    // Validación
    await check( 'nombre' ).notEmpty().withMessage( 'El nombre no puede ir vacío' ).run( req );
    await check( 'email' ).isEmail().withMessage( 'Eso no parece un email' ).run( req );
    await check( 'password' ).isLength( { min: 6 } ).withMessage( 'El password debe ser de al menos 6 caracteres' ).run( req );
    await check( 'repetir_password' ).equals( req.body.password ).withMessage( 'Los passwords no son iguales' ).run( req );
    
    let resultado = validationResult( req );

    // Extraer los datos
    const { nombre, email, password } = req.body;

    // Verificar que el resultado es vacío
    if ( !resultado.isEmpty() ) {
        // Errores
        return res.render( 'auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre,
                email,
            },
        });
    }

    // Verificar que el usuario no esté duplicado
    const existeUsuario = await Usuario.findOne({ where: { email } });
    if ( existeUsuario ) {
        return res.render( 'auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [ { msg: 'El usuario ya está registrado' }],
            usuario: {
                nombre,
                email,
            },
        });        
    }    

    // Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId(),
    });

    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token,
    });

    // Mostrar mensaje de confirmación
    res.render( 'templates/mensaje', {
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos enviado un email de confirmación, presiona en el enlace'
    });

}

// Función que comprueba una cuenta
const confirmar = async ( req, res ) => {
    const { token } = req.params;
    
    // Verificar si el token es válido
    const usuario = await Usuario.findOne({ where: { token, confirmado: null } });    
    if ( !usuario ) {
        return res.render( 'auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        });
    }

    // Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render( 'auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmó correctamente'        
    });

}

const formularioOlvidePassword = ( req, res ) => {

    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a Bienes Raíces',
        csrfToken: req.csrfToken(),
    });
}

const resetPassword = async ( req, res ) => {

    // Validación
    await check( 'email' ).isEmail().withMessage( 'Eso no parece un email' ).run( req );
    
    let resultado = validationResult( req );

    // Verificar que el resultado es vacío
    if ( !resultado.isEmpty() ) {
        // Errores
        return res.render( 'auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raíces',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    // Buscar el usuario
    const { email } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    
    if ( !usuario ) {
        return res.render( 'auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raíces',
            csrfToken: req.csrfToken(),
            errores: [ { msg: 'El email no pertence a ningún usuario' } ]
        });        
    }

    usuario.token = generarId();
    await usuario.save();

    // Enviar email
    
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    });

    res.render( 'templates/mensaje', {
        pagina: 'Reestablece tu password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    });


}

const comprobarToken = async ( req, res ) => {

    const { token } = req.params;

    const usuario = await Usuario.findOne( { where: { token } } );
    if (!usuario) {
        return res.render( 'auth/confirmar-cuenta', {
            pagina: 'Restablece tu Password',
            mensaje: 'Hubo un error al validar tu información, intenta de nuevo',
            error: true
        });        
    }


    // Mostrar formulario para modificar el password

    return res.render( 'auth/reset-password', {
        pagina: 'Restablece tu password',
        csrfToken: req.csrfToken()
    });
} 

const nuevoPassword = async ( req, res ) => {
    
    // Validar el password
    await check( 'password' ).isLength( { min: 6 } ).withMessage( 'El password debe ser de al menos 6 caracteres' ).run( req );

    let resultado = validationResult( req );

    if ( !resultado.isEmpty() ) {
        return res.render( 'auth/reset-password', {
            pagina: 'Restablece tu password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: { token }});    
    
    // Hasheasr el nuevo password
    const salt = await bcrypt.genSalt( 10 );
    usuario.password = await bcrypt.hash( password, salt );
    usuario.token = null;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password reestablecido',
        mensaje: 'El password se guardó correctamente'
    });


}

export {
    formularioLogin,
    autenticar,
    formularioRegistro,
    formularioOlvidePassword,
    registrar,
    confirmar,
    resetPassword,
    comprobarToken,
    nuevoPassword,
}