import express from 'express';
import { body } from 'express-validator';
import { admin, crear, guardar, agregarImagen } from '../controllers/propiedadController.js';
import protegerRuta from '../middlewares/protegerRuta.js';

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

router.get( '/propiedades/agregar-imagen/:id', agregarImagen );


export default router;