// Importa las dependencias necesarias para la validación de datos.
import { check, param } from 'express-validator';
import validateResult from '../utils/handleValidator.js';
import { sql } from '../config/postgre.js';
import admin from '../config/firebase-admin.js';

/**
 * Validador para la creación de usuarios.
 * Verifica que los campos obligatorios estén presentes y cumplan con los requisitos.
 */
export const CreateUserValidator = [
    check("nombre").notEmpty().withMessage('El nombre no debe estar en blanco.'),
    check("email").isEmail().exists().notEmpty().withMessage('Email es requerido y debe de ser un email real.'),
    check("password").exists().notEmpty().withMessage('Password es requerido.'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
];

/**
 * Validador para el inicio de sesión.
 * Verifica que el email y la contraseña sean proporcionados.
 */
export const SignInValidator = [
    check("email").exists().notEmpty().withMessage('Email es requerido.'),
    check("password").exists().notEmpty().withMessage('Password es requerido.'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
];

/**
 * Validador para el registro de formularios.
 * Verifica que los campos obligatorios estén presentes.
 */
export const RegistrarFormularioValidator = [
    check("email").exists().notEmpty().withMessage('Email es requerido.'),
    check("password").exists().notEmpty().withMessage('Password es requerido.'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
];

/**
 * Validador para el formulario de contacto.
 * Verifica que los campos cumplan con los requisitos de formato y contenido.
 */
export const ContactFormValidator = [
	check('nombre')
		.trim()
        .escape()
		.notEmpty().withMessage('El nombre es obligatorio.')
		.isLength({ min: 2 }).withMessage('Mínimo 2 caracteres.')
		.matches(/^[A-Za-zÀ-ÿ\s]+$/).withMessage('Solo letras permitidas.'),

	check('apellido')
		.trim()
        .escape()
		.notEmpty().withMessage('El apellido es obligatorio.')
		.isLength({ min: 2 }).withMessage('Mínimo 2 caracteres.')
		.matches(/^[A-Za-zÀ-ÿ\s]+$/).withMessage('Solo letras permitidas.'),

	check('email')
		.trim()
        .escape()
		.notEmpty().withMessage('El correo es obligatorio.')
		.isEmail().withMessage('Correo inválido.')
		.matches(/@(gmail\.com|outlook\.com|hotmail\.com)$/i)
		.withMessage('Solo se permiten correos de Gmail, Outlook o Hotmail.'),

	check('telefono')
		.notEmpty().withMessage('El teléfono es obligatorio.')
		.isNumeric().withMessage('Solo números.')
		.isLength({ min: 8, max: 15 }).withMessage('Entre 8 y 15 dígitos.'),

	check('direccion')
		.trim()
        .escape()
		.notEmpty().withMessage('La dirección es obligatoria.')
		.isLength({ min: 5 }).withMessage('Mínimo 5 caracteres.'),

	check('mensaje')
		.trim()
        .escape()
		.notEmpty().withMessage('El mensaje es obligatorio.')
		.isLength({ min: 10, max: 500 }).withMessage('Entre 10 y 500 caracteres.'),

	check('proposito')
  .isArray({ min: 1 }).withMessage('Debes seleccionar al menos una opción')
  .custom(arr => {
    const opcionesValidas = [
      'Donación',
      'Donación de Indumentaria/Equipo',
      'Patrocinio',
      'Asociación',
      'Voluntariado',
      'Otros',
    ];
    return arr.every(item => opcionesValidas.includes(item));
  }).withMessage('Contiene una opción no válida'),

   (req, res, next) => {
        validateResult(req, res, next);
    }
];

/**
 * Validador para la edición del perfil de usuario.
 * Verifica que los campos cumplan con los requisitos de formato y contenido.
 */
export const EditProfileValidator = [
  check('nombre')
    .notEmpty().withMessage('El nombre es obligatorio.')
    .trim()
    .escape()
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres.')
    .matches(/^[A-Za-zÀ-ÿ\s]+$/).withMessage('El nombre solo puede contener letras.'),
  (req, res, next) => {
    validateResult(req, res, next);
  }
];

/**
 * Middleware para verificar el token de autenticación en las cookies.
 * Valida el token proporcionado y lo decodifica para obtener el UID del usuario.
 */
const verificarToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado en la cookie' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export default verificarToken;

/**
 * Validador para el formulario de donaciones.
 * Verifica que los campos cumplan con los requisitos de formato y contenido.
 */
export const DonacionesFormValidator = [
	check('nombre')
		.trim()
        .escape()
		.notEmpty().withMessage('El nombre es obligatorio.')
		.isLength({ min: 3 }).withMessage('El nombre debe tener 3 caracteres minimo.')
		.matches(/^[A-Za-zÀ-ÿ\s]+$/).withMessage('Solo letras permitidas.'),

	check('correo')
		.trim()
    .escape()
		.notEmpty().withMessage('El correo es obligatorio.')
		.isEmail().withMessage('Correo inválido.')
		.matches(/@(gmail\.com|outlook\.com|hotmail\.com)$/i)
		.withMessage('Solo se permiten correos de Gmail, Outlook o Hotmail.'),

	check('telefono')
		.notEmpty().withMessage('El teléfono es obligatorio.'),

    check('dia')
  .trim()
  .escape()
  .notEmpty().withMessage('El día de entrega es obligatorio')
  .matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/)
  .withMessage('El día debe estar en el formato correcto: YYYY-MM-DD')
  .custom((value) => {
    const year = parseInt(value.split('-')[0], 10); // extraemos el año desde el formato YYYY-MM-DD
    return year >= 2025;
  })
  .withMessage('El año debe ser 2025 o posterior'),

  check('horario')
  .trim()
  .escape()
  .notEmpty().withMessage('La hora es obligatoria')
  .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  .withMessage('La hora debe estar en el formato correcto HH:MM'),


	check('descripcion')
		.trim()
        .escape()
		.notEmpty().withMessage('El mensaje es obligatorio.')
		.isLength({ min: 10}).withMessage('La descripcion debe tener minimo 10 caracteres'),



   (req, res, next) => {
        validateResult(req, res, next);
    }
];
