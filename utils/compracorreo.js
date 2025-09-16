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

function splitRecipients(envVarValue) {
  return (envVarValue || "")
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** ---------- HTML Admin ---------- */
async function renderAdminTemplate(data) {
  const templatePath = path.join(__dirname, "../templates/correo-orden.html");
  let html = await readFile(templatePath, "utf-8");
  const safe = (v, fallback = "-") => (v ?? "").toString().trim() || fallback;

  // Construir tabla de productos
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
          ${data.cartItems.map((item) => `
            <tr>
              <td>${safe(item.nombre_producto)}</td>
              <td align="center">${safe(item.cantidad)}</td>
              <td align="right">L. ${Number(item.precio_unitario).toFixed(2)}</td>
              <td align="right">L. ${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
  } else {
    productosHtml = "<em>(No se encontraron productos en la orden)</em>";
  }

  html = html
    .replace(/{{nombre}}/g, safe(data.nombre, "amigo/a"))
    .replace(/{{dia}}/g, safe(data.dia))
    .replace(/{{horario}}/g, safe(data.horario))
    .replace(/{{descripcion}}/g, safe(data.descripcion, "(sin detalle)"))
    .replace(/{{year}}/g, String(new Date().getFullYear()))
    .replace(/{{productos}}/g, productosHtml);

  return html;
}

/** ---------- HTML Cliente---------- */
async function renderClienteTemplate(data) {
  const templatePath = path.join(__dirname, "../templates/correo-compra-cliente.html");
  let html = await readFile(templatePath, "utf-8");

  const total = Array.isArray(data.cartItems)
    ? data.cartItems.reduce((acc, it) => acc + Number(it.precio_unitario) * Number(it.cantidad), 0)
    : 0;
  const impuesto = total * 0.15;
  const subtotal = total - impuesto;

  // Tabla productos
  const productosHtml = Array.isArray(data.cartItems) && data.cartItems.length > 0
    ? `
      <table role="presentation" cellspacing="0" cellpadding="6" border="1" width="100%" 
        style="border-collapse:collapse;border:1px solid #ddd;font-size:14px;">
        <thead style="background:#f4f6ff;color:#0c005a;">
          <tr>
            <th align="left">Producto</th>
            <th align="center">Cant.</th>
            <th align="right">P. Unitario</th>
            <th align="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${data.cartItems.map((it) => `
            <tr>
              <td>${it.nombre_producto}</td>
              <td align="center">${it.cantidad}</td>
              <td align="right">L. ${Number(it.precio_unitario).toFixed(2)}</td>
              <td align="right">L. ${(Number(it.precio_unitario) * Number(it.cantidad)).toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `
    : "<em>(No se encontraron productos en la orden)</em>";

  html = html
    .replace(/{{nombre}}/g, String(data.nombre || "amigo/a"))
    .replace(/{{idorden}}/g, String(data.idorden || "-"))
    .replace(/{{year}}/g, String(new Date().getFullYear()))
    .replace(/{{productos}}/g, productosHtml)
    .replace(/{{subtotal}}/g, subtotal.toFixed(2))
    .replace(/{{impuesto}}/g, impuesto.toFixed(2))
    .replace(/{{total}}/g, total.toFixed(2));

  return html;
}

export default async function enviarCorreoCompra(datos) {
  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || "Pilotos FAH";
  const from = `"${fromName}" <${process.env.EMAIL_USER}>`;
  const replyTo = process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER;

  /* ---- Admin ---- */
  const adminRecipients = splitRecipients(process.env.EMAIL_TO);
  if (adminRecipients.length) {
    const htmlAdmin = await renderAdminTemplate(datos);
    await transporter.sendMail({
      from,
      to: adminRecipients,
      subject: `Nueva compra #${datos.idorden || "-"}`,
      html: htmlAdmin,
      text: `Nueva compra #${datos.idorden || "-"} con ${datos.cartItems?.length || 0} productos.`,
      replyTo,
    });
  }

  /* ---- Cliente ---- */
  if (datos?.email) {
    const htmlCliente = await renderClienteTemplate(datos);
    await transporter.sendMail({
      from,
      to: datos.email,
      subject: `Confirmación de compra #${datos.idorden || "-"}`,
      html: htmlCliente,
      text: `Hola ${datos.nombre || ""}, confirmamos tu compra #${datos.idorden || "-"}.`,
      replyTo,
    });
  }
}
