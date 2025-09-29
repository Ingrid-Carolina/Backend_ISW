import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Nombre del bucket de almacenamiento en Supabase
export const BUCKET = 'Archivos';

// URL del proyecto Supabase, tomada de las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;

// Clave de servicio de Supabase (tiene permisos elevados, debe manejarse con cuidado)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Cliente de Supabase ya configurado con la URL y la clave de servicio
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
