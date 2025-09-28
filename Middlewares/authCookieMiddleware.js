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
