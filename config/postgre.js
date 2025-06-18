import dotenv from "dotenv";
dotenv.config();
import postgres from "postgres";

const db_url = process.env.POSTGRESQL_URL;
console.log(db_url);

const sql = postgres(db_url); // Define the connection once

const dbConnect = async () => {
  try {
    const version = await sql`SELECT version()`;
    console.log(version);
    console.log("La Base de datos se ha conectado correctamente");

    /* await sql`
             CREATE TABLE IF NOT EXISTS Usuarios (
                 id VARCHAR(100) PRIMARY KEY,
                 nombre VARCHAR(100) NOT NULL,
                 email VARCHAR(100) UNIQUE NOT NULL,
                 password VARCHAR(100) NOT NULL,
                 fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 rol VARCHAR(50) NOT NULL DEFAULT 'cliente'
             )
         `;
 
        
         const userdata = {
             id: 'jaja',
             nombre: 'Nahim',
             email: 'nahimandres1945@example.com',
             password: 'hola'
         };
 
         const inserted = await sql`
             INSERT INTO Usuarios ${sql(userdata)}
             RETURNING *
         `;
         console.log('Usuario insertado:', inserted);*/
  } catch (err) {
    console.log("Error en la base de datos:", err);
  }
};

export { dbConnect, sql };
