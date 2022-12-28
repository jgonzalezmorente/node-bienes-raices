import express from 'express';
import { body } from 'express-validator';

import { 
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
} from '../controllers/propiedadController.js';

import protegerRuta from '../middlewares/protegerRuta.js';
import upload from '../middlewares/subirImagen.js';
import identificarUsuario from '../middlewares/identificarUsuario.js';


const router = express.Router();

router.get( '/mis-propiedades', protegerRuta, admin );

router.get( '/propiedades/crear', protegerRuta, crear );

router.post( '/propiedades/crear',
    protegerRuta,
    
    body( 'titulo' ).notEmpty().withMessage( 'El título del anuncio es obligatorio' ),

    body( 'descripcion' )
        .notEmpty().withMessage( 'La descripción no puede ir vacía' )
        .isLength({ max: 200 }).withMessage( 'La descripción es muy larga' ),
        
    body( 'categoria' ).isNumeric().withMessage( 'Selecciona una categoría' ),
    
    body( 'precio' ).isNumeric().withMessage( 'Selecciona un rango de precios' ),

    body( 'habitaciones' ).isNumeric().withMessage( 'Selecciona la cantidad de habitaciones' ),

    body( 'estacionamiento' ).isNumeric().withMessage( 'Selecciona la cantidad de estacionamientos' ),

    body( 'wc' ).isNumeric().withMessage( 'Selecciona la cantidad de baños' ),

    body( 'lat' ).notEmpty().withMessage( 'Ubica la propiead en el mapa' ),

    guardar 
);

router.get( '/propiedades/agregar-imagen/:id',
    protegerRuta,
    agregarImagen
);

router.post( '/propiedades/agregar-imagen/:id',
    protegerRuta,
    upload.single( 'imagen' ),
    almacenarImagen
);

router.get( '/propiedades/editar/:id',
    protegerRuta,
    editar
);

router.post( '/propiedades/editar/:id',
    protegerRuta,
    
    body( 'titulo' ).notEmpty().withMessage( 'El título del anuncio es obligatorio' ),
    
    body( 'descripcion' )
        .notEmpty().withMessage( 'La descripción no puede ir vacía' )
        .isLength({ max: 200 }).withMessage( 'La descripción es muy larga' ),
        
    body( 'categoria' ).isNumeric().withMessage( 'Selecciona una categoría' ),
    
    body( 'precio' ).isNumeric().withMessage( 'Selecciona un rango de precios' ),

    body( 'habitaciones' ).isNumeric().withMessage( 'Selecciona la cantidad de habitaciones' ),

    body( 'estacionamiento' ).isNumeric().withMessage( 'Selecciona la cantidad de estacionamientos' ),

    body( 'wc' ).isNumeric().withMessage( 'Selecciona la cantidad de baños' ),

    body( 'lat' ).notEmpty().withMessage( 'Ubica la propiead en el mapa' ),

    guardarCambios 
);

router.post( '/propiedades/eliminar/:id',
    protegerRuta,
    eliminar
);

// Área pública
router.get( '/propiedad/:id',
    identificarUsuario,
    mostrarPropiedad
);

// Almacenar los mensajes
router.post( '/propiedad/:id',
    identificarUsuario,
    body( 'mensaje' ).isLength( { min: 10 } ).withMessage( 'El Mensaje no puede ir vacío o es muy corto' ),
    enviarMensaje
);

router.get( '/mensajes/:id', 
    protegerRuta,
    verMensajes
);

export default router;