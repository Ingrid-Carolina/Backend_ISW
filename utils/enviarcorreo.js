// Importa las dependencias necesarias para manejar la configuración y el envío de correos electrónicos.
import { Resend } from "resend";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// Configuración para obtener la ruta del archivo actual y su directorio.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializa el cliente de Resend con la clave API configurada.
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un correo de confirmación al usuario que completó un formulario.
 * Utiliza una plantilla HTML para personalizar el contenido del correo.
 * @param {Object} datos - Datos del formulario enviados por el usuario.
 */
async function enviarCorreoConfirmacion(datos) {
  const templatePath = path.join(__dirname, "../templates/correo-confirmacion.html");
  let html = await readFile(templatePath, "utf-8");

  // Reemplazos dinámicos en la plantilla HTML.
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

  // Enviar el correo utilizando Resend.
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
