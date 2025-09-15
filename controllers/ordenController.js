// controllers/ordenController.js
import { sql } from "../config/postgre.js";

class OrdenController {
  // Obtener todas las órdenes (con total calculado)
  static async getOrdenes(req, res) {
    try {
      const ordenes = await sql`
        SELECT o.idorden, o.usuario_id, o.fecha, o.estado,
               COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS total
        FROM ordenes o
        LEFT JOIN detalleorden d ON o.idorden = d.idorden
        GROUP BY o.idorden
        ORDER BY o.idorden DESC
      `;
      res.status(200).json({ ordenes });
    } catch (e) {
      console.error(`Error al obtener órdenes: ${e}`);
      res.status(500).json({ error: `Error al obtener órdenes: ${e}` });
    }
  }

  // Obtener una orden por ID (con total calculado)
  static async getOrdenById(req, res) {
    try {
      const { id } = req.params;
      const [orden] = await sql`
        SELECT o.idorden, o.usuario_id, o.fecha, o.estado,
               COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS total
        FROM ordenes o
        LEFT JOIN detalleorden d ON o.idorden = d.orden_id
        WHERE o.idorden = ${id}
        GROUP BY o.idorden
      `;

      if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

      res.status(200).json(orden);
    } catch (e) {
      console.error(`Error al obtener orden: ${e}`);
      res.status(500).json({ error: `Error al obtener orden: ${e}` });
    }
  }

  // Crear orden (solo guarda usuario, fecha y estado inicial)
  static async addOrden(req, res) {
    const { usuario_id, fecha, estado } = req.body;
    try {
      if (!usuario_id) {
        return res.status(400).json({ mensaje: "Usuario es obligatorio!" });
      }

      const result = await sql`
        INSERT INTO ordenes (usuario_id, fecha, estado)
        VALUES (${usuario_id}, ${fecha || new Date()}, ${estado || "Pendiente"})
        RETURNING *
      `;

      res.status(201).json({
        mensaje: "Orden creada correctamente",
        orden: result[0]
      });
    } catch (e) {
      console.error(`Error al crear orden: ${e}`);
      res.status(500).json({ error: `Error al crear orden: ${e}` });
    }
  }

  // Actualizar estado de la orden
  static async actualizarOrden(req, res) {
    const { id } = req.params;
    const { estado } = req.body;

    try {
      const result = await sql`
        UPDATE ordenes
        SET estado = ${estado}
        WHERE idorden = ${id}
        RETURNING *
      `;

      if (result.length === 0) return res.status(404).json({ mensaje: "Orden no encontrada" });

      res.status(200).json({
        mensaje: "Orden actualizada correctamente",
        orden: result[0]
      });
    } catch (e) {
      console.error(`Error al actualizar orden: ${e}`);
      res.status(500).json({ error: `Error al actualizar orden: ${e}` });
    }
  }

  // Eliminar orden
  static async eliminarOrden(req, res) {
    const { id } = req.params;
    try {
      await sql`DELETE FROM ordenes WHERE idorden = ${id}`;
      res.status(200).json({ mensaje: "Orden eliminada correctamente!" });
    } catch (e) {
      console.error(`Error al eliminar orden: ${e}`);
      res.status(500).json({ mensaje: "Error al eliminar orden", error: e.message });
    }
  }
}

export default OrdenController;
