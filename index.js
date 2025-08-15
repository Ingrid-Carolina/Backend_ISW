import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { dbConnect } from './config/postgre.js';
import router from './routes/router.js';

const app = express();

// Recomendado en Railway para cookies secure detrás de proxy
app.set('trust proxy', 1);

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://pilotosbaseball.netlify.app', // tu frontend en producción
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Preflight
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// DB
dbConnect();

// Rutas (tu router está montado en /auth)
app.use('/auth', router);

// Puerto (Railway usa PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
