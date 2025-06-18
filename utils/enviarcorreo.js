import nodemailer from 'nodemailer';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function enviarCorreoConfirmacion(datos) {
	const templatePath = path.join(__dirname, '../templates/correo-confirmacion.html');
	let html = await readFile(templatePath, 'utf-8');

	html = html
		.replace(/{{nombre}}/g, datos.nombre)
		.replace(/{{apellido}}/g, datos.apellido)
		.replace(/{{correo}}/g, datos.email)
		.replace(/{{telefono}}/g, datos.telefono)
		.replace(/{{direccion}}/g, datos.direccion)
		.replace(/{{proposito}}/g, datos.proposito.join(', '))
		.replace(/{{mensaje}}/g, datos.mensaje)
		.replace(/{{home_link}}/g, 'https://pilotos-baseball.com')
		.replace(/{{enlace_email}}/g, 'mailto:pilotoshn@outlook.com')
		.replace(/{{enlace_telefono}}/g, 'tel:+504 9918-2456')
		.replace(/{{enlace_sitio}}/g, 'https://pilotos-baseball.com');

	const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
		service: process.env.EMAIL_SERVICE,
        secure: false,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	const mailOptions = {
		from: `"Pilotos FAH" <${process.env.EMAIL_USER}>`,
		to: datos.email,
		subject: 'Confirmación de envío de formulario - Pilotos FAH',
		html: html,
	};

	await transporter.sendMail(mailOptions);
	console.log('Correo de confirmación enviado a:', datos.email);
}

export default enviarCorreoConfirmacion;

