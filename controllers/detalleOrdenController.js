// Importa el cliente SQL desde la configuración de PostgreSQL.
import { sql } from "../config/postgre.js";

// Controlador para manejar las operaciones relacionadas con los detalles de las órdenes.
class DetalleOrdenController {
  // Método para obtener todos los detalles de las órdenes.
  static async getDetalles(req, res) {
    try {
      // Consulta SQL para obtener todos los detalles de las órdenes.
      const detalles = await sql`
        SELECT * FROM detalleorden ORDER BY iddetalle
      `;
      res.status(200).json({ detalles }); // Devuelve los detalles en formato JSON con el código de estado 200.
    } catch (e) {
      console.error(`Error al obtener detalles: ${e}`); // Manejo de errores en caso de fallo en la consulta SQL.
      res.status(500).json({ error: `Error al obtener detalles: ${e}` });
    }
  }

  // Método para obtener un detalle específico por su ID.
  static async getDetalleById(req, res) {
    try {
      const { id } = req.params; // Obtiene el ID de los parámetros de la solicitud.
      const [detalle] = await sql`
        SELECT * FROM detalleorden WHERE iddetalle = ${id}
      `; // Consulta SQL para obtener el detalle por ID.
      if (!detalle) return res.status(404).json({ error: "Detalle no encontrado" }); // Manejo de caso donde no se encuentra el detalle.
      res.status(200).json(detalle); // Devuelve el detalle encontrado.
    } catch (e) {
      console.error(`Error al obtener detalle: ${e}`); // Manejo de errores en caso de fallo en la consulta SQL.
      res.status(500).json({ error: `Error al obtener detalle: ${e}` });
    }
  }

  // Método para agregar un nuevo detalle a la base de datos.
  static async addDetalle(req, res) {
    const { orden_id, producto_id, cantidad, precio_unitario } = req.body; // Obtiene los datos del cuerpo de la solicitud.
    try {
      if (!orden_id || !producto_id || !cantidad || !precio_unitario) {
        // Verifica que se proporcionen todos los datos requeridos.
        return res.status(400).json({ mensaje: "Orden, producto, cantidad y precio son obligatorios!" });
      }

      const result = await sql`
        INSERT INTO detalleorden (orden_id, producto_id, cantidad, precio_unitario)
        VALUES (${orden_id}, ${producto_id}, ${cantidad}, ${precio_unitario})
        RETURNING *
      `; // Consulta SQL para insertar un nuevo detalle.

      res.status(201).json({
        mensaje: "Detalle agregado correctamente",
        detalle: result[0]
      }); // Devuelve el detalle agregado con un código de estado 201.
    } catch (e) {
      console.error(`Error al agregar detalle: ${e}`); // Manejo de errores en caso de fallo en la consulta SQL.
      res.status(500).json({ error: `Error al agregar detalle: ${e}` });
    }
  }

  // Método para actualizar un detalle existente.
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
      `; // Consulta SQL para actualizar un detalle existente.

      if (result.length === 0) return res.status(404).json({ mensaje: "Detalle no encontrado" }); // Manejo de caso donde no se encuentra el detalle a actualizar.

      res.status(200).json({
        mensaje: "Detalle actualizado correctamente",
        detalle: result[0]
      }); // Devuelve el detalle actualizado.
    } catch (e) {
      console.error(`Error al actualizar detalle: ${e}`); // Manejo de errores en caso de fallo en la consulta SQL.
      res.status(500).json({ error: `Error al actualizar detalle: ${e}` });
    }
  }

  // Método para eliminar un detalle por su ID.
  static async eliminarDetalle(req, res) {
    const { id } = req.params;
    try {
      await sql`DELETE FROM detalleorden WHERE iddetalle = ${id}`; // Consulta SQL para eliminar un detalle por ID.
      res.status(200).json({ mensaje: "Detalle eliminado correctamente!" });
    } catch (e) {
      console.error(`Error al eliminar detalle: ${e}`); // Manejo de errores en caso de fallo en la consulta SQL.
      res.status(500).json({ mensaje: "Error al eliminar detalle", error: e.message });
    }
  }
}

export default DetalleOrdenController;
