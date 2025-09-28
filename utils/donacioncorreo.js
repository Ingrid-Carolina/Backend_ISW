// Importa las dependencias necesarias para manejar la configuración y el envío de correos electrónicos.
import { Resend } from "resend";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Configuración para obtener la ruta del archivo actual y su directorio.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializa el cliente de Resend con la clave API configurada.
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Genera el contenido HTML del correo para el administrador.
 * Incluye los detalles de la solicitud de donación.
 * @param {Object} d - Datos de la donación.
 * @returns {string} Contenido HTML del correo.
 */
function adminHtml(d) {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;line-height:1.5">
    <h2>Nueva solicitud de donación</h2>
    <p><b>Nombre:</b> ${d.nombre || "-"}<br/>
       <b>Correo:</b> ${d.correo || "-"}<br/>
       <b>Teléfono:</b> ${d.telefono || "-"}<br/>
       <b>Día:</b> ${d.dia || "-"}<br/>
       <b>Horario:</b> ${d.horario || "-"}<br/>
       <b>Descripción:</b> ${d.descripcion || "-"}
    </p>
    <hr/>
    <p style="color:#666;font-size:12px">Fecha: ${new Date().toLocaleString()}</p>
  </div>`;
}

/**
 * Genera el contenido de texto plano del correo para el administrador.
 * Incluye los detalles de la solicitud de donación.
 * @param {Object} d - Datos de la donación.
 * @returns {string} Contenido de texto plano del correo.
 */
function adminText(d) {
  return `Nueva donación:
Nombre: ${d.nombre || "-"}
Correo: ${d.correo || "-"}
Teléfono: ${d.telefono || "-"}
Día: ${d.dia || "-"}
Horario: ${d.horario || "-"}
Descripción: ${d.descripcion || "-"}
Fecha: ${new Date().toLocaleString()}`;
}

/**
 * Genera el contenido HTML del correo para el donante.
 * Incluye un mensaje de agradecimiento y los detalles de la donación.
 * @param {Object} data - Datos de la donación.
 * @returns {Promise<string>} Contenido HTML del correo.
 */
async function renderDonorTemplate(data) {
  const templatePath = path.join(__dirname, "../templates/correo-donacion.html");
  let html = await readFile(templatePath, "utf-8");

  const safe = (v, fallback = "-") => (v ?? "").toString().trim() || fallback;

  html = html
    .replace(/{{nombre}}/g, safe(data.nombre, "amigo/a"))
    .replace(/{{dia}}/g, safe(data.dia))
    .replace(/{{horario}}/g, safe(data.horario))
    .replace(/{{descripcion}}/g, safe(data.descripcion, "(sin detalle)"))
    .replace(/{{year}}/g, String(new Date().getFullYear()));

  return html;
}

/**
 * Genera el contenido de texto plano del correo para el donante.
 * Incluye un mensaje de agradecimiento y los detalles de la donación.
 * @param {Object} d - Datos de la donación.
 * @returns {string} Contenido de texto plano del correo.
 */
function donorText(d) {
  return `¡Gracias por tu aporte a Pilotos FAH!
Día: ${d.dia || "-"}
Horario: ${d.horario || "-"}
Detalle: ${d.descripcion || "(sin detalle)"}
Pronto te contactaremos para coordinar la entrega.`;
}

/**
 * Envía dos correos electrónicos:
 *  1) Al administrador con los detalles de la donación.
 *  2) Al donante con un mensaje de agradecimiento.
 * @param {Object} datos - Datos de la donación y del donante.
 */
export default async function enviarCorreoDonacion(datos) {
  const from = `"Pilotos FAH" <${process.env.EMAIL_FROM}>`;
  const adminTo = process.env.EMAIL_TO || process.env.EMAIL_FROM;

  // 1) Enviar correo al administrador.
  await resend.emails.send({
    from,
    to: adminTo,
    subject: `Nueva donación: ${datos.nombre || "Anónimo"}`,
    html: adminHtml(datos),
    text: adminText(datos),
  });

  // 2) Enviar correo al donante (si proporcionó correo).
  if (datos.correo) {
    const htmlDonor = await renderDonorTemplate(datos);

    await resend.emails.send({
      from,
      to: datos.correo,
      subject: "Gracias por tu donación — Pilotos FAH",
      html: htmlDonor,
      text: donorText(datos),
    });
  }
}
