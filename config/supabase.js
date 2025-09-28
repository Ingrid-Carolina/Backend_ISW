// Importa la función `createClient` del paquete `@supabase/supabase-js` para interactuar con la API de Supabase.
import { createClient } from "@supabase/supabase-js";

// Importa el paquete `dotenv` para cargar variables de entorno desde un archivo `.env`.
import dotenv from "dotenv";

// Carga las variables de entorno definidas en el archivo `.env` en `process.env`.
dotenv.config();

// Define el nombre del bucket que se utilizará en Supabase para almacenar archivos.
export const BUCKET = 'Archivos';

// Obtiene la URL de Supabase desde las variables de entorno.
const supabaseUrl = process.env.SUPABASE_URL;

// Obtiene la clave de servicio de Supabase desde las variables de entorno.
// Esta clave permite realizar operaciones administrativas en Supabase.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Crea una instancia del cliente de Supabase utilizando la URL y la clave de servicio.
// Este cliente se usará para interactuar con la base de datos y el almacenamiento de Supabase.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);