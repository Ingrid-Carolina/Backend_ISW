import express from 'express'
import router from './routes/router.js';
import dotenv from 'dotenv'

const app = express();
dotenv.config();

app.use(express.json());

app.use('/api', router);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});