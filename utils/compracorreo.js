import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/** ---------- Template de la compra (HTML con productos) ---------- */
async function renderCompraTemplate(data) {
  const templatePath = path.join(__dirname, "../templates/correo-orden.html");
  let html = await readFile(templatePath, "utf-8");

  const safe = (v, fallback = "-") => (v ?? "").toString().trim() || fallback;

  // Construir la tabla de productos
  let productosHtml = "";
  if (Array.isArray(data.cartItems) && data.cartItems.length > 0) {
    productosHtml = `
      <table role="presentation" cellspacing="0" cellpadding="6" border="1" width="100%" 
        style="border-collapse: collapse; border: 1px solid #ddd; font-size:14px;">
        <thead style="background:#f4f6ff; color:#0c005a;">
          <tr>
            <th align="left">Producto</th>
            <th align="center">Cantidad</th>
            <th align="right">Precio Unitario</th>
            <th align="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${data.cartItems
            .map(
              (item) => `
              <tr>
                <td>${safe(item.nombre_producto)}</td>
                <td align="center">${safe(item.cantidad)}</td>
                <td align="right">L. ${Number(item.precio_unitario).toFixed(2)}</td>
                <td align="right">L. ${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } else {
    productosHtml = "<em>(No se encontraron productos en la orden)</em>";
  }

  // reemplazos
  html = html
  .replace(/{{nombre}}/g, safe(data.nombre, "amigo/a"))
    .replace(/{{dia}}/g, safe(data.dia))
    .replace(/{{horario}}/g, safe(data.horario))
    .replace(/{{descripcion}}/g, safe(data.descripcion, "(sin detalle)"))
    .replace(/{{year}}/g, String(new Date().getFullYear()))
    .replace(/{{productos}}/g, productosHtml) 

  return html;
}

/**
 * Esta funcion solo envía el correo al administrador
 */
export default async function enviarCorreoCompra(datos) {
  const transporter = createTransporter();

  const from = `"Pilotos FAH" <${process.env.EMAIL_USER}>`;
  const adminRecipients = (process.env.EMAIL_TO || '')
  .split(/[;,]/)        // admite comas o punto y coma
  .map(s => s.trim())
  .filter(Boolean);

  const htmlAdmin = await renderCompraTemplate(datos);

  await transporter.sendMail({
    from,
    to: adminRecipients,
  subject: `Nueva compra #${datos.idorden || "-"}`,
    html: htmlAdmin,
    text: `Nueva compra #${datos.idorden || "-"} con ${
      datos.cartItems?.length || 0
    } productos.`,
  });
}
