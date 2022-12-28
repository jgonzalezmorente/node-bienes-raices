import { validationResult } from 'express-validator';
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from '../models/index.js';
import { esVendedor, formatearFecha } from '../helpers/index.js';


const admin = async ( req, res ) => {

    // Leer QueryString

    const { pagina: paginaActual } = req.query;

    const expresion = /^[1-9]+$/;

    if ( !expresion.test( paginaActual ) ) {
        return res.redirect( 'mis-propiedades?pagina=1' );
    }
    
    try {
        
        const { id: usuarioId } = req.usuario;

        // Límites y Offset para el paginador
        const limit = 10;
        const offset = limit * ( paginaActual - 1 );
    
        const [ propiedades, total ] = await Promise.all([
           
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioId
                },
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes' },
                ]
            }),

            Propiedad.count({
                where: {
                    usuarioId
                }
            })
        ]);
    
        res.render( 'propiedades/admin', {
            pagina: 'Mis propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil( total / limit ),
            paginaActual: Number( paginaActual ),
            total,
            offset,
            limit
        });
    } catch (error) {
        console.log(error);
        
    }
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
    
        return res.render( 'propiedades/crear', {
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

const editar = async ( req, res ) => {

    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk( id );

    if ( !propiedad ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Revisar que quien visita la URL, es quien creó la propidad
    if ( propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Consultar modelo de precio y categorias    
    const [ categorias, precios ] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll(),
    ]);

    res.render( 'propiedades/editar', {
        pagina: `Editar propiedad: ${ propiedad.titulo }`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    });

}

const guardarCambios = async ( req, res ) => {

    // Verificar la validación
    let resultado = validationResult( req );
    if ( !resultado.isEmpty() ) {

        const [ categorias, precios ] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll(),
        ]);

        return res.render( 'propiedades/editar', {
            pagina: 'Editar propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        });
    
    }

    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk( id );

    if ( !propiedad ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Revisar que quien visita la URL, es quien creó la propidad
    if ( propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect( '/mis-propiedades' );
    }    

    // Reescribir el objeto y actualizarlo
    try {

        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body;
        propiedad.set({
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
        });

        await propiedad.save();
        res.redirect( '/mis-propiedades' );
        
    } catch (error) {
        console.log(error);        
    }
    
}

const eliminar = async ( req, res ) => {

    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk( id );

    if ( !propiedad ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Revisar que quien visita la URL, es quien creó la propidad
    if ( propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Eliminar la imagen
    await unlink( `public/uploads/${ propiedad.imagen }` );
    
    console.log( `Se eliminó la imagen ${ propiedad.imagen }` );

    // Eliminar la propiedad
    await propiedad.destroy();
    res.redirect( '/mis-propiedades' );

}


// Muestra una propiedad
const mostrarPropiedad = async ( req, res ) => {

    const { id } = req.params;

    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk( id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
        ]
    });    

    if ( !propiedad ) {
        return res.redirect( '/404' );
    }


    res.render( 'propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor( req.usuario?.id, propiedad.usuarioId )
    });

}


const enviarMensaje = async ( req, res ) => {
    const { id } = req.params;

    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk( id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
        ]
    });    

    if ( !propiedad ) {
        return res.redirect( '/404' );
    }

    // Renderizar errores    
    let resultado = validationResult( req );
    if ( !resultado.isEmpty() ) {
        console.log( resultado.array() )
        return res.render( 'propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor( req.usuario?.id, propiedad.usuarioId ),
            errores: resultado.array()
        });
    }

    // Almacenar el mensaje
    const { mensaje } = req.body;
    const { id: propiedadId } = req.params;
    const { id: usuarioId } = req.usuario;
    
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId,
    });

    res.render( 'propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor( req.usuario?.id, propiedad.usuarioId ),
        enviado: true
    });

}

// leer mensajes recibidos

const verMensajes = async ( req, res ) => {

    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk( id, {
        include: [
            {
                model: Mensaje,
                as: 'mensajes', 
                include: [
                    {
                        model: Usuario.scope('eliminarPassword'),
                        as: 'usuario'
                    }
                ]
            },
        ]
    });

    if ( !propiedad ) {
        return res.redirect( '/mis-propiedades' );
    }

    // Revisar que quien visita la URL, es quien creó la propidad
    if ( propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect( '/mis-propiedades' );
    }


    res.render( 'propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
    });
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes,
}