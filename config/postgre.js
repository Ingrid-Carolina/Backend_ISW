// Importa el paquete dotenv para cargar las variables de entorno desde un archivo .env.
import dotenv from "dotenv";
dotenv.config();

// Importa el cliente de PostgreSQL desde el paquete postgres.
import postgres from "postgres";

// Obtiene la URL de la base de datos PostgreSQL desde las variables de entorno.
const db_url = process.env.POSTGRESQL_URL;

// Crea una instancia del cliente de PostgreSQL utilizando la URL de conexión.
const sql = postgres(db_url); // Define la conexión una vez

// Función para conectar a la base de datos y verificar la conexión.
const dbConnect = async () => {
  try {
    // Ejecuta una consulta para obtener la versión de la base de datos.
    const version = await sql`SELECT version()`;
    console.log(version); // Muestra la versión de la base de datos en la consola.
    console.log("La Base de datos se ha conectado correctamente"); // Mensaje de éxito.
  } catch (err) {
    // Captura y muestra cualquier error que ocurra durante la conexión.
    console.log("Error en la base de datos:", err);
  }
};

// Exporta la función de conexión y el cliente SQL para su uso en otras partes de la aplicación.
export { dbConnect, sql };
