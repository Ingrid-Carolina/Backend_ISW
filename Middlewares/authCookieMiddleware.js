
/**
 * Auth middlewares (requireAuth / requireRole)
 *
 * Middlewares de autenticación y autorización basados en Firebase y PostgreSQL.
 *
 * - requireAuth:
 *   * Lee el token desde la cookie `token`.
 *   * Verifica el ID token con Firebase Admin.
 *   * Pone en `req` los datos de usuario (uid, email) para uso posterior.
 *
 * - requireRole(...rolesPermitidos):
 *   * Requiere autenticación previa (email poblado por requireAuth).
 *   * Consulta el `rol` en la tabla `Usuarios` y valida contra la lista permitida.
 *   * Responde 403 si el rol no está autorizado.
 *
 * Notas:
 * - Devuelve 401 si falta token o es inválido/expirado.
 * - Manejo de errores verboso en consola y respuestas JSON coherentes.
 */
import admin from '../config/firebase-admin.js';
import { sql } from '../config/postgre.js';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ mensaje: 'No autenticado: falta cookie' });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    // POBLAR TODO: uid + email (para que los controladores puedan usarlo)
    req.uid = decoded.uid;
    req.authEmail = decoded.email || null;
    req.user = { uid: decoded.uid, email: decoded.email || null };

    return next();
  } catch (err) {
    console.error('requireAuth error:', err);
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

export const requireRole = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!req.authEmail) {
        return res.status(401).json({ mensaje: 'No autenticado' });
      }
      const rows = await sql`SELECT rol FROM Usuarios WHERE email = ${req.authEmail}`;
      if (!rows.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

      const rol = rows[0].rol;
      if (!rolesPermitidos.includes(rol)) {
        return res.status(403).json({ mensaje: 'No autorizado' });
      }
      return next();
    } catch (e) {
      console.error('requireRole error:', e);
      return res.status(500).json({ mensaje: 'Error de autorización' });
    }
  };
};

//-
