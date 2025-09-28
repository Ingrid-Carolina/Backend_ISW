// Importa las dependencias necesarias para manejar la configuración y el envío de correos electrónicos.
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Configuración para obtener la ruta del archivo actual y su directorio.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializa el cliente de Resend si la clave API está configurada.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Divide una cadena de destinatarios en una lista, separando por comas o puntos y comas.
 * @param {string} envVarValue - Valor de la variable de entorno con los destinatarios.
 * @returns {string[]} Lista de destinatarios.
 */
function splitRecipients(envVarValue) {
  return (envVarValue || '')
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/* --- templates --- */
/**
 * Genera el contenido HTML del correo para los administradores.
 * Incluye un resumen de los productos comprados y detalles de la orden.
 * @param {Object} data - Datos de la orden.
 * @returns {Promise<string>} Contenido HTML del correo.
 */
async function renderAdminTemplate(data) {
  const templatePath = path.join(__dirname, '../templates/correo-orden.html');
  let html = await readFile(templatePath, 'utf-8');
  const safe = (v, fb = '-') => (v ?? '').toString().trim() || fb;

  let productosHtml = '<em>(No se encontraron productos en la orden)</em>';
  if (Array.isArray(data.cartItems) && data.cartItems.length) {
    productosHtml = `
      <table role="presentation" cellspacing="0" cellpadding="6" border="1" width="100%" 
        style="border-collapse:collapse;border:1px solid #ddd;font-size:14px;">
        <thead style="background:#f4f6ff;color:#0c005a;">
          <tr><th align="left">Producto</th><th align="center">Cant.</th>
              <th align="right">P. Unitario</th><th align="right">Subtotal</th></tr>
        </thead>
        <tbody>
          ${data.cartItems.map(it => `
            <tr>
              <td>${safe(it.nombre_producto)}</td>
              <td align="center">${safe(it.cantidad)}</td>
              <td align="right">L. ${Number(it.precio_unitario).toFixed(2)}</td>
              <td align="right">L. ${(Number(it.precio_unitario)*Number(it.cantidad)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }

  html = html
    .replace(/{{nombre}}/g, safe(data.nombre, 'amigo/a'))
    .replace(/{{dia}}/g, safe(data.dia))
    .replace(/{{horario}}/g, safe(data.horario))
    .replace(/{{descripcion}}/g, safe(data.descripcion, '(sin detalle)'))
    .replace(/{{year}}/g, String(new Date().getFullYear()))
    .replace(/{{productos}}/g, productosHtml);

  return html;
}

/**
 * Genera el contenido HTML del correo para los clientes.
 * Incluye un resumen de los productos comprados, el subtotal, el impuesto y el total.
 * @param {Object} data - Datos de la orden.
 * @returns {Promise<string>} Contenido HTML del correo.
 */
async function renderClienteTemplate(data) {
  const templatePath = path.join(__dirname, '../templates/correo-compra-cliente.html');
  let html = await readFile(templatePath, 'utf-8');

  const total = Array.isArray(data.cartItems)
    ? data.cartItems.reduce((acc, it) => acc + Number(it.precio_unitario) * Number(it.cantidad), 0)
    : 0;
  const impuesto = total * 0.15;
  const subtotal = total - impuesto;

  const productosHtml = Array.isArray(data.cartItems) && data.cartItems.length
    ? `
      <table role="presentation" cellspacing="0" cellpadding="6" border="1" width="100%" 
        style="border-collapse:collapse;border:1px solid #ddd;font-size:14px;">
        <thead style="background:#f4f6ff;color:#0c005a;">
          <tr><th align="left">Producto</th><th align="center">Cant.</th>
              <th align="right">P. Unitario</th><th align="right">Subtotal</th></tr>
        </thead>
        <tbody>
          ${data.cartItems.map(it => `
            <tr>
              <td>${it.nombre_producto}</td>
              <td align="center">${it.cantidad}</td>
              <td align="right">L. ${Number(it.precio_unitario).toFixed(2)}</td>
              <td align="right">L. ${(Number(it.precio_unitario)*Number(it.cantidad)).toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`
    : '<em>(No se encontraron productos en la orden)</em>';

  html = html
    .replace(/{{nombre}}/g, String(data.nombre || 'amigo/a'))
    .replace(/{{idorden}}/g, String(data.idorden || '-'))
    .replace(/{{year}}/g, String(new Date().getFullYear()))
    .replace(/{{productos}}/g, productosHtml)
    .replace(/{{subtotal}}/g, subtotal.toFixed(2))
    .replace(/{{impuesto}}/g, impuesto.toFixed(2))
    .replace(/{{total}}/g, total.toFixed(2));

  return html;
}

/* --- envío del correo--- */
/**
 * Envía correos electrónicos tanto al cliente como a los administradores.
 * Utiliza las plantillas HTML generadas para cada tipo de destinatario.
 * @param {Object} datos - Datos de la orden y del cliente.
 */
export default async function enviarCorreoCompra(datos) {
  if (!resend) {
    console.error('RESEND_API_KEY no configurada. Evitando intento SMTP.');
    return;
  }

  const from = `${process.env.EMAIL_FROM_NAME || 'Pilotos FAH'} <${process.env.EMAIL_FROM}>`;
  const replyTo = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;

  // --- Admin ---
  const admins = splitRecipients(process.env.EMAIL_TO);
  if (admins.length) {
    const htmlAdmin = await renderAdminTemplate(datos);
    await resend.emails.send({
      from,
      to: admins,
      subject: `Nueva compra #${datos.idorden || '-'}`,
      html: htmlAdmin,
      reply_to: replyTo,
    });
  }

  // --- Cliente ---
  if (datos?.email) {
    const htmlCliente = await renderClienteTemplate(datos);
    await resend.emails.send({
      from,
      to: datos.email,
      subject: `Confirmación de compra #${datos.idorden || '-'}`,
      html: htmlCliente,
      reply_to: replyTo,
    });
  }
}
