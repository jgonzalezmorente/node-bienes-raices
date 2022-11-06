import express from 'express';
import csrf from 'csurf';
import usuarioRoutes from './routes/usuarioRoutes.js';
import propiedadRoutes from './routes/propiedadesRoutes.js';
import appRoutes from './routes/appRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import db from './config/db.js';
import cookieParser from 'cookie-parser';


// Crear la app
const app = express();

// Habilitar lectura de formularios
app.use( express.urlencoded( { extended: true } ) );

// Hablitar Cooke Parser
app.use( cookieParser() );

// Habilitar CSRF
app.use( csrf( { cookie: true } ) );

// Conexión a la base de datos
try {
    await db.authenticate();
    db.sync();
    console.log('Conexión Correcta a la Base de Datos');

} catch (error) {
    console.log(error);
}

// Habilitar Pug
app.set( 'view engine', 'pug' );
app.set( 'views', './views');

// Carpeta Pública
app.use( express.static( 'public') );

// Routing
app.use( '/', appRoutes );
app.use( '/auth', usuarioRoutes );
app.use( '/', propiedadRoutes );
app.use( '/api', apiRoutes );

// Definir un puerto y arrancar el proyecto
const port = process.env.PORT || 3000;
app.listen( port, () => {
    console.log(`El servidor está funcionando en el puerto ${ port }`);
});