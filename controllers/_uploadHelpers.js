/**
 * Controlador de utilidades para carga de archivos en Supabase Storage.
 *
 * Este módulo centraliza funciones auxiliares relacionadas con la gestión de
 * imágenes y archivos en el bucket de Supabase configurado en `config/supabase.js`.
 *
 * Funciones:
 * - `sanitizeName(name)`  
 *   Normaliza y limpia nombres de archivo eliminando acentos, caracteres no permitidos 
 *   y limitando la longitud a 100 caracteres.
 *
 * - `uploadToSupabase({ file, uid })`  
 *   Valida el tipo MIME (solo imágenes comunes), sube el archivo al bucket bajo la ruta
 *   `/users/:uid/:timestamp-nombre` y devuelve la ruta interna y la URL pública generada.
 *
 * - `pathFromPublicUrl(publicUrl)`  
 *   Deriva el path interno en Supabase Storage a partir de una URL pública.
 *
 * - `deleteFromSupabaseByUrl(publicUrl)`  
 *   Elimina un objeto del bucket de Supabase a partir de su URL pública, si se logra
 *   derivar el path interno correctamente.
 *
 * Notas:
 * - Solo se aceptan imágenes JPEG, PNG, WebP y AVIF.  
 * - Se maneja el control de errores propagando excepciones con `err.status`.  
 * - El bucket configurado debe permitir acceso público si se requiere URL accesible.  
 */
// controllers/_uploadHelpers.js
import { supabase, BUCKET } from "../config/supabase.js";

// Sanea nombres de archivo: quita acentos, caracteres no permitidos y limita longitud
export function sanitizeName(name) {
  return (name || "image")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // elimina diacríticos
    .replace(/[^a-zA-Z0-9._-]/g, "_") // reemplaza cualquier caracter no permitido por "_"
    .slice(0, 100); // evita nombres excesivamente largos
}

// Sube un archivo (buffer) a Supabase Storage bajo /users/:uid/timestamp-nombre
export async function uploadToSupabase({ file, uid }) {
  // Tipos MIME permitidos (imágenes comunes)
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowed.includes(file.mimetype)) {
    const err = new Error("Tipo de archivo no permitido");
    err.status = 415; // Unsupported Media Type
    throw err;
  }

  // Normaliza y asegura un nombre de archivo seguro
  const safeName = sanitizeName(file.originalname);
  const path = `users/${uid}/${Date.now()}-${safeName}`;

  // Intenta subir al bucket configurado (sin upsert para no sobrescribir)
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  // Propaga error de Supabase en formato estándar del backend
  if (uploadErr) {
    const err = new Error(uploadErr.message);
    err.status = 500;
    throw err;
  }

  // Obtiene URL pública para el path subido (si el bucket es público)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

// Intenta derivar el path interno desde una public URL
export function pathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null;
  // Busca el segmento después de `/object/public/${BUCKET}/`
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length); // devuelve solo el path relativo dentro del bucket
}

// Elimina un objeto del bucket a partir de su URL pública
export async function deleteFromSupabaseByUrl(publicUrl) {
  const path = pathFromPublicUrl(publicUrl);
  if (!path) return; // si no se puede derivar, simplemente no hace nada
  await supabase.storage.from(BUCKET).remove([path]); // remove acepta array de paths
}
