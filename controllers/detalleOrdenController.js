/**
 * detalleOrdenController.js
 *
 * Controlador para la gestión de los detalles de órdenes.
 * Se conecta a la base de datos PostgreSQL y permite realizar operaciones CRUD
 * sobre la tabla `detalleorden`.
 *
 * Funcionalidades principales:
 * - Obtener todos los detalles de las órdenes.
 * - Obtener un detalle específico por su ID.
 * - Agregar un nuevo detalle a una orden (incluye cantidad y precio unitario).
 * - Actualizar un detalle existente.
 * - Eliminar un detalle por ID.
 *
 * Este controlador asegura la gestión completa de los ítems que conforman
 * cada orden en el sistema.
 */

import { sql } from "../config/postgre.js";

class DetalleOrdenController {
  // Obtener todos los detalles
  static async getDetalles(req, res) {
    try {
      const detalles = await sql`
        SELECT * FROM detalleorden ORDER BY iddetalle
      `;
      res.status(200).json({ detalles });
    } catch (e) {
      console.error(`Error al obtener detalles: ${e}`);
      res.status(500).json({ error: `Error al obtener detalles: ${e}` });
    }
  }

  // Obtener detalle por ID
  static async getDetalleById(req, res) {
    try {
      const { id } = req.params;
      const [detalle] = await sql`
        SELECT * FROM detalleorden WHERE iddetalle = ${id}
      `;
      if (!detalle) return res.status(404).json({ error: "Detalle no encontrado" });
      res.status(200).json(detalle);
    } catch (e) {
      console.error(`Error al obtener detalle: ${e}`);
      res.status(500).json({ error: `Error al obtener detalle: ${e}` });
    }
  }

  // Agregar detalle
  static async addDetalle(req, res) {
    const { orden_id, producto_id, cantidad, precio_unitario } = req.body;
    try {
      if (!orden_id || !producto_id || !cantidad || !precio_unitario) {
        return res.status(400).json({ mensaje: "Orden, producto, cantidad y precio son obligatorios!" });
      }

      const result = await sql`
        INSERT INTO detalleorden (orden_id, producto_id, cantidad, precio_unitario)
        VALUES (${orden_id}, ${producto_id}, ${cantidad}, ${precio_unitario})
        RETURNING *
      `;

      res.status(201).json({
        mensaje: "Detalle agregado correctamente",
        detalle: result[0]
      });
    } catch (e) {
      console.error(`Error al agregar detalle: ${e}`);
      res.status(500).json({ error: `Error al agregar detalle: ${e}` });
    }
  }

  // Actualizar detalle
  static async actualizarDetalle(req, res) {
    const { id } = req.params;
    const { orden_id, producto_id, cantidad, precio_unitario } = req.body;

    try {
      const result = await sql`
        UPDATE detalleorden
        SET orden_id = ${orden_id},
            producto_id = ${producto_id},
            cantidad = ${cantidad},
            precio_unitario = ${precio_unitario}
        WHERE iddetalle = ${id}
        RETURNING *
      `;

      if (result.length === 0) return res.status(404).json({ mensaje: "Detalle no encontrado" });

      res.status(200).json({
        mensaje: "Detalle actualizado correctamente",
        detalle: result[0]
      });
    } catch (e) {
      console.error(`Error al actualizar detalle: ${e}`);
      res.status(500).json({ error: `Error al actualizar detalle: ${e}` });
    }
  }

  // Eliminar detalle
  static async eliminarDetalle(req, res) {
    const { id } = req.params;
    try {
      await sql`DELETE FROM detalleorden WHERE iddetalle = ${id}`;
      res.status(200).json({ mensaje: "Detalle eliminado correctamente!" });
    } catch (e) {
      console.error(`Error al eliminar detalle: ${e}`);
      res.status(500).json({ mensaje: "Error al eliminar detalle", error: e.message });
    }
  }
}

export default DetalleOrdenController;
