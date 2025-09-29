/**
 * Servidor principal (Express API)
 *
 * Punto de entrada de la aplicación backend. Configura middlewares globales,
 * conexión a base de datos y arranque del servidor HTTP.
 *
 * Dependencias principales:
 * - dotenv        : carga variables de entorno desde `.env`.
 * - express       : framework HTTP.
 * - cors          : habilita solicitudes cross-origin con credenciales.
 * - cookie-parser : permite leer cookies (usadas para tokens HttpOnly).
 * - body-parser   : parsea requests en JSON o urlencoded.
 * - dbConnect     : inicializa conexión a PostgreSQL.
 * - router        : agrupa todas las rutas bajo `/auth`.
 *
 * Endpoints globales:
 * - GET `/health` → responde `{ ok: true }` (para monitoreo).
 * - GET `/`       → responde "API alive" (texto plano).
 * - Usa `/auth/*` → todas las rutas de negocio definidas en `routes/router.js`.
 *
 * Configuración:
 * - CORS limitado a orígenes confiables (`localhost:5173`, Netlify, dominio oficial).
 * - Cookies HttpOnly con soporte `credentials: true`.
 * - PORT configurable vía `process.env.PORT` (default: 3000).
 *
 * Notas:
 * - El servidor escucha en `0.0.0.0` para permitir despliegue en contenedores/VM.
 * - La base de datos debe estar disponible antes de iniciar.
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { dbConnect } from './config/postgre.js'; 
import router from './routes/router.js';
import bodyParser from 'body-parser';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://pilotosbaseball.netlify.app', 'https://pilotosfah.com'],
  credentials: true,
}));

// Cookies HttpOnly
app.use(cookieParser());

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// DB
dbConnect(); 


// Rutas

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.type('text/plain').send('API alive'));

app.use('/auth', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on :${PORT}`);
});
