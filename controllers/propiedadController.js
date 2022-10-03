import { validationResult } from 'express-validator';
import { Precio, Categoria, Propiedad } from '../models/index.js';

const admin = ( req, res ) => {
    res.render( 'propiedades/admin', {
        pagina: 'Mis propiedades',       
    });
}

// Formulario para crear una nueva propiedad
const crear = async ( req, res ) => {

    // Consultar modelo de precio y categorias    
    const [ categorias, precios ] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll(),
    ]);

    res.render( 'propiedades/crear', {
        pagina: 'Crear propiedad',        
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    });
}


const guardar = async ( req, res ) => {

    // Validación
    let resultado = validationResult( req );
    if ( !resultado.isEmpty() ) {

        const [ categorias, precios ] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll(),
        ]);
    
        res.render( 'propiedades/crear', {
            pagina: 'Crear propiedad',            
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        });        
    }

    // Crear la propiedad

    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body;

    const { id: usuarioId } = req.usuario;

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId,
            usuarioId,
            imagen: '',
        });

        const { id } = propiedadGuardada;
        res.redirect(`/propiedades/agregar-imagen/${ id }`);
        
    } catch (error) {
        console.log(error);        
    }


}

const agregarImagen = async ( req, res ) => {
    
    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk( id ); 

    if ( !propiedad ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Validar que la propiedad no esté publicada
    if ( propiedad.publicado ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Validar que la propiedad pertenece a quien visita esta página
    if( req.usuario.id.toString() !== propiedad.usuarioId.toString() ) {
        return res.redirect( '/mis-propiedades' ); 
    };
    
    res.render( 'propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${ propiedad.titulo }`,
        csrfToken: req.csrfToken(),
        propiedad,
    });

}


const almacenarImagen = async ( req, res, next ) => {    

    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk( id ); 

    if ( !propiedad ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Validar que la propiedad no esté publicada
    if ( propiedad.publicado ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Validar que la propiedad pertenece a quien visita esta página
    if( req.usuario.id.toString() !== propiedad.usuarioId.toString() ) {
        return res.redirect( '/mis-propiedades' ); 
    };

    try {
        // Almacenar la imagen y publicar la propiedad    
        propiedad.imagen = req.file.filename;
        propiedad.publicado = 1;
        await propiedad.save();
        next();

    } catch (error) {
        console.log( error );        
    }
}


export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen
}