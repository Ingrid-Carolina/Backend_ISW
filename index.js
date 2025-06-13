import dotenv from 'dotenv'
dotenv.config();

import express from 'express'
import router from './routes/router.js';
import cors from 'cors';
import { dbConnect } from './config/postgre.js';
//import router2 from './auth.js'; //importe mis http promises como router 2
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(cors());
dbConnect();

app.use('/auth', router);

const PORT = 3000;

app.listen(PORT,'0.0.0.0', () => {
    console.log(`Listening on http://localhost:${PORT}`);
});