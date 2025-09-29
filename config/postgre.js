import dotenv from "dotenv";
dotenv.config();
import postgres from "postgres";

// URL de conexión a la base de datos PostgreSQL desde el archivo .env
const db_url = process.env.POSTGRESQL_URL;

// Se crea una instancia de conexión reutilizable a la base de datos
const sql = postgres(db_url); // Define la conexión una vez

// Función para probar la conexión y mostrar la versión de PostgreSQL
const dbConnect = async () => {
  try {
    // Ejecuta una consulta SQL simple para verificar la conexión
    const version = await sql`SELECT version()`;
    console.log(version);
    console.log("La Base de datos se ha conectado correctamente");
  } catch (err) {
    // Muestra el error si no logra conectar
    console.log("Error en la base de datos:", err);
  }
};

// Se exporta la función de conexión y el cliente SQL
export { dbConnect, sql };
