import dotenv from "dotenv";
dotenv.config();
import postgres from "postgres";

const db_url = process.env.POSTGRESQL_URL;

const sql = postgres(db_url); // Define the connection once

const dbConnect = async () => {
  try {
    const version = await sql`SELECT version()`;
    console.log(version);
    console.log("La Base de datos se ha conectado correctamente");
  } catch (err) {
    console.log("Error en la base de datos:", err);
  }
};

const getEventById = async (id) => {
  try {
    const result = await sql`SELECT * FROM eventos WHERE id = ${id}`;
    return result[0] || null;
  } catch (error) {
    console.error("Error al obtener el evento por ID:", error);
    return null;
  }
};

//function to parse month and year to Date range
const parseMonthYearToDateRange = (month, year) => {
  if (typeof month !== "number" || typeof year !== "number") {
    throw new Error("Mes y año deben ser números");
  }
  if (month < 1 || month > 12) {
    throw new Error("Mes inválido");
  }
  if (year < 1970) {
    throw new Error("Año inválido");
  }
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return { startDate, endDate };
};

const getAllEventsByMonthYear = async (month, year) => {
  try {
    const { startDate, endDate } = parseMonthYearToDateRange(month, year);
    const result =
      await sql`SELECT * FROM eventos WHERE fecha_inicio BETWEEN ${startDate} AND ${endDate}`;
    return result;
  } catch (error) {
    console.error("Error al obtener todos los eventos:", error);
    return [];
  }
};

// Function to create a new event in the database
const createEvent = async (event) => {
  try {
    const { nombre, fecha_inicio, fecha_fin, descripcion, ishabilitado } =
      event;
    const result = await sql`
      INSERT INTO eventos (nombre, fecha_inicio, fecha_fin, descripcion, ishabilitado)
      VALUES (${nombre}, ${fecha_inicio}, ${fecha_fin}, ${descripcion}, ${ishabilitado})
      RETURNING id
    `;
    return result[0].id; // Return the ID of the newly created event
  } catch (error) {
    console.error("Error al crear el evento:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
};

const updateEvent = async (id, event) => {
  try {
    const { nombre, fecha_inicio, fecha_fin, descripcion, ishabilitado } =
      event;
    const result = await sql`
      UPDATE eventos
      SET nombre = ${nombre}, fecha_inicio = ${fecha_inicio}, fecha_fin = ${fecha_fin}, descripcion = ${descripcion}, ishabilitado = ${ishabilitado}
      WHERE id = ${id}
      RETURNING id
    `;
    return result[0].id; // Return the ID of the updated event
  } catch (error) {
    console.error("Error al actualizar el evento:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
};

const deleteEventdisabled = async (id) => {
  try {
    const result = await sql`
      UPDATE eventos
      SET ishabilitado = false
      WHERE id = ${id}
      RETURNING id
    `;
    return result[0].id; // Return the ID of the updated event
  } catch (error) {
    console.error("Error al deshabilitar el evento:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
};

export {
  dbConnect,
  sql,
  createEvent,
  updateEvent,
  getEventById,
  getAllEventsByMonthYear,
  parseMonthYearToDateRange,
  deleteEventdisabled,
};
