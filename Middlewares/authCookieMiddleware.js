// Importa las dependencias necesarias para la autenticación y autorización.
import admin from '../config/firebase-admin.js';
import { sql } from '../config/postgre.js';

/**
 * Middleware para verificar la autenticación del usuario mediante cookies.
 * Este middleware valida el token de autenticación proporcionado en las cookies.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token; // Obtiene el token de las cookies.
    if (!token) {
      // Devuelve un error si no se encuentra el token.
      return res.status(401).json({ mensaje: 'No autenticado: falta cookie' });
    }

    // Verifica y decodifica el token utilizando Firebase Admin SDK.
    const decoded = await admin.auth().verifyIdToken(token);

    // Población de datos del usuario autenticado en el objeto de la solicitud.
    req.uid = decoded.uid;
    req.authEmail = decoded.email || null;
    req.user = { uid: decoded.uid, email: decoded.email || null };

    return next(); // Continúa con el siguiente middleware o controlador.
  } catch (err) {
    // Manejo de errores en caso de token inválido o expirado.
    console.error('requireAuth error:', err);
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

/**
 * Middleware para verificar si el usuario tiene un rol permitido.
 * Este middleware requiere que el usuario esté autenticado previamente.
 * @param {...string} rolesPermitidos - Lista de roles permitidos para acceder al recurso.
 */
export const requireRole = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!req.authEmail) {
        // Devuelve un error si el usuario no está autenticado.
        return res.status(401).json({ mensaje: 'No autenticado' });
      }

      // Consulta SQL para obtener el rol del usuario autenticado.
      const rows = await sql`SELECT rol FROM Usuarios WHERE email = ${req.authEmail}`;
      if (!rows.length) {
        // Devuelve un error si el usuario no se encuentra en la base de datos.
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      const rol = rows[0].rol; // Obtiene el rol del usuario.
      if (!rolesPermitidos.includes(rol)) {
        // Devuelve un error si el rol del usuario no está permitido.
        return res.status(403).json({ mensaje: 'No autorizado' });
      }

      return next(); // Continúa con el siguiente middleware o controlador.
    } catch (e) {
      // Manejo de errores en caso de fallo en la autorización.
      console.error('requireRole error:', e);
      return res.status(500).json({ mensaje: 'Error de autorización' });
    }
  };
};
