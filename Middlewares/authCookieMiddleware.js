import admin from '../config/firebase-admin.js';
import { sql } from '../config/postgre.js';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ mensaje: 'No autenticado' });

    // Verifica el token de Firebase
    const decoded = await admin.auth().verifyIdToken(token);
    req.authEmail = decoded.email;
    return next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

export const requireRole = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!req.authEmail) return res.status(401).json({ mensaje: 'No autenticado' });
      const rows = await sql`SELECT rol FROM Usuarios WHERE email = ${req.authEmail}`;
      if (!rows.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

      const rol = rows[0].rol;
      if (!rolesPermitidos.includes(rol)) {
        return res.status(403).json({ mensaje: 'No autorizado' });
      }
      return next();
    } catch (e) {
      return res.status(500).json({ mensaje: 'Error de autorización' });
    }
  };
};
