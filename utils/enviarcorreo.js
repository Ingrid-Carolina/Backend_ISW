/**
 * enviarcorreo.js — Confirmación de envío de formulario de contacto (Resend)
 *
 * Envía al usuario un correo de confirmación utilizando la plantilla
 * `correo-confirmacion.html`, reemplazando los marcadores con los datos del formulario.
 *
 * Reemplazos dinámicos:
 * - nombre, apellido, correo, teléfono, dirección, propósito (array), mensaje.
 * - enlaces de contacto (home, email, teléfono, sitio).
 *
 * Variables de entorno:
 * - RESEND_API_KEY : API key de Resend.
 * - EMAIL_FROM     : Remitente (correo).
 *
 * Notas:
 * - Si el usuario incluye una lista de propósitos, se une por coma.
 * - Incluye texto alternativo simple (subject y text).
 * - Registra en consola el destinatario al finalizar.
 */
import { Resend } from "resend";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

async function enviarCorreoConfirmacion(datos) {
  const templatePath = path.join(__dirname, "../templates/correo-confirmacion.html");
  let html = await readFile(templatePath, "utf-8");

  // Reemplazos dinámicos
  html = html
    .replace(/{{nombre}}/g, datos.nombre || "-")
    .replace(/{{apellido}}/g, datos.apellido || "-")
    .replace(/{{correo}}/g, datos.email || "-")
    .replace(/{{telefono}}/g, datos.telefono || "-")
    .replace(/{{direccion}}/g, datos.direccion || "-")
    .replace(/{{proposito}}/g, Array.isArray(datos.proposito) ? datos.proposito.join(", ") : "-")
    .replace(/{{mensaje}}/g, datos.mensaje || "-")
    .replace(/{{home_link}}/g, "https://pilotos-baseball.com")
    .replace(/{{enlace_email}}/g, "mailto:pilotoshn@outlook.com")
    .replace(/{{enlace_telefono}}/g, "tel:+50499182456")
    .replace(/{{enlace_sitio}}/g, "https://pilotos-baseball.com");

  const from = `"Pilotos FAH" <${process.env.EMAIL_FROM}>`;

  await resend.emails.send({
    from,
    to: datos.email,
    subject: "Confirmación de envío de formulario - Pilotos FAH",
    html,
    text: `Hola ${datos.nombre || ""}, confirmamos la recepción de tu formulario. Gracias por contactarnos.`,
  });

  console.log("Correo de confirmación enviado a:", datos.email);
}

export default enviarCorreoConfirmacion;
