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
  origin: ['http://localhost:5173', 'https://pilotosbaseball.netlify.app'],
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
app.use('/auth', router);

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
