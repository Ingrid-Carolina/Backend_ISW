// controllers/_uploadHelpers.js
// Importa el cliente de Supabase y el nombre del bucket desde la configuración.
import { supabase, BUCKET } from "../config/supabase.js";

// Función para sanitizar nombres de archivos eliminando caracteres especiales y limitando su longitud.
export function sanitizeName(name) {
  return (name || "image")
    .normalize("NFD") // Normaliza el texto para separar caracteres con tilde.
    .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes y diacríticos.
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Reemplaza caracteres no permitidos por guiones bajos.
    .slice(0, 100); // Limita el nombre a 100 caracteres.
}

// Función para subir archivos al almacenamiento de Supabase.
export async function uploadToSupabase({ file, uid }) {
  // Define los tipos de archivo permitidos.
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowed.includes(file.mimetype)) {
    // Lanza un error si el tipo de archivo no está permitido.
    const err = new Error("Tipo de archivo no permitido");
    err.status = 415;
    throw err;
  }

  // Sanitiza el nombre del archivo y genera un path único para el almacenamiento.
  const safeName = sanitizeName(file.originalname);
  const path = `users/${uid}/${Date.now()}-${safeName}`;

  // Intenta subir el archivo al bucket de Supabase.
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype, // Especifica el tipo de contenido del archivo.
      upsert: false, // Evita sobrescribir archivos existentes.
    });

  if (uploadErr) {
    // Lanza un error si ocurre un problema durante la subida.
    const err = new Error(uploadErr.message);
    err.status = 500;
    throw err;
  }

  // Obtiene la URL pública del archivo subido.
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl }; // Retorna el path y la URL pública.
}

// Función para derivar el path interno desde una URL pública.
export function pathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null; // Retorna null si no se proporciona una URL pública.
  // Busca el segmento después de `/object/public/${BUCKET}/`
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export async function deleteFromSupabaseByUrl(publicUrl) {
  const path = pathFromPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
