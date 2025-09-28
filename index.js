// Importa las dependencias necesarias para configurar y ejecutar el servidor.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { dbConnect } from './config/postgre.js'; 
import router from './routes/router.js';
import bodyParser from 'body-parser';

const app = express();

// Configuración de CORS para permitir solicitudes desde orígenes específicos.
app.use(cors({
  origin: ['http://localhost:5173', 'https://pilotosbaseball.netlify.app', 'https://pilotosfah.com'],
  credentials: true,
}));

// Middleware para manejar cookies con la opción HttpOnly.
app.use(cookieParser());

// Middleware para analizar el cuerpo de las solicitudes en formato JSON y URL-encoded.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Conexión a la base de datos PostgreSQL.
dbConnect(); 

// Rutas de prueba para verificar el estado del servidor.
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.type('text/plain').send('API alive'));

// Rutas principales de la aplicación.
app.use('/auth', router);

// Configuración del puerto y arranque del servidor.
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on :${PORT}`);
});
