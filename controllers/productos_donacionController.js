/**
 * ProductosDonacionController.js
 *
 * Controlador para la sección de productos de donación y registro de donaciones.
 * Permite administrar los ítems disponibles para donación y recibir solicitudes
 * de donación enviando notificaciones por correo.
 *
 * Funcionalidades principales:
 * - getProductos: Lista de productos de donación.
 * - addProducto / updateProducto / deleteProducto: CRUD sobre productos de donación.
 * - registrardonacion: Registra una donación en BD y envía correo de confirmación.
 * - getDonaciones: Consulta las donaciones registradas.
 *
 * Notas:
 * - Integra PostgreSQL para persistencia y módulo de correo para notificaciones.
 * - Valida entradas mínimas y maneja errores de forma controlada.
 */

import { sql } from "../config/postgre.js";
import enviarCorreoDonacion from "../utils/donacioncorreo.js";

class ProductosDonacionController {
  /**
   * Obtener lista de productos de donación
   */
  static async getProductos(req, res) {
    try {
      const productos = await sql`
                SELECT * FROM productos_donacion 
                ORDER BY id
            `;
      res.status(200).json({ productos });
    } catch (e) {
      console.error(`Error al obtener productos: ${e}`);
      res.status(500).json({ error: `Error al obtener productos: ${e}` });
    }
  }

  /**
   * Agregar un nuevo producto
   */
  static async addProducto(req, res) {
    const { nombre, descripcion, imagen, estado = true } = req.body;
    try {
      const [nuevoProducto] = await sql`
                INSERT INTO productos_donacion (nombre, descripcion, imagen, estado)
                VALUES (${nombre}, ${descripcion}, ${imagen}, ${estado})
                RETURNING *
            `;
      res.status(201).json({ producto: nuevoProducto });
    } catch (e) {
      console.error(`Error al agregar producto: ${e}`);
      res.status(500).json({ error: `Error al agregar producto: ${e}` });
    }
  }

  /**
   * Modificar un producto existente
   */
  static async updateProducto(req, res) {
    const { id } = req.params;
    const { nombre, descripcion, imagen, estado } = req.body;
    try {
      const [productoActualizado] = await sql`
                UPDATE productos_donacion
                SET nombre = ${nombre},
                    descripcion = ${descripcion},
                    imagen = ${imagen},
                    estado = ${estado}
                WHERE id = ${id}
                RETURNING *
            `;
      if (!productoActualizado) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.status(200).json({ producto: productoActualizado });
    } catch (e) {
      console.error(`Error al modificar producto: ${e}`);
      res.status(500).json({ error: `Error al modificar producto: ${e}` });
    }
  }

  /**
   * Eliminar un producto
   */
  static async deleteProducto(req, res) {
    const { id } = req.params;
    try {
      const [productoEliminado] = await sql`
                DELETE FROM productos_donacion
                WHERE id = ${id}
                RETURNING *
            `;
      if (!productoEliminado) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.status(200).json({ producto: productoEliminado });
    } catch (e) {
      console.error(`Error al eliminar producto: ${e}`);
      res.status(500).json({ error: `Error al eliminar producto: ${e}` });
    }
  }

  static async registrardonacion(req, res) {
    const { nombre, telefono, correo, dia, horario, descripcion } = req.body;

    try {
      const donaciondata = {
        nombre,
        telefono,
        correo,
        dia,
        horario,
        descripcion,
      };

      // Guarda en BD
      await sql`INSERT INTO donaciones ${sql(donaciondata)}`;

      // Envío de correos 
      (async () => {
        try {
          await enviarCorreoDonacion(donaciondata);
        } catch (mailErr) {
          console.error(
            "Error enviando correos de donación:",
            mailErr?.message || mailErr
          );
        }
      })();

      return res
        .status(201)
        .send({ mensaje: "¡Donación ingresada correctamente!" });
    } catch (e) {
      console.error("Error al agregar donación:", e);
      return res.status(500).send({ error: `Error al agregar donación: ${e}` });
    }
  }

  static async getDonaciones(req, res) {
  try {
    const donaciones = await sql`
      SELECT id_donacion, nombre, telefono, correo, dia, horario, descripcion,estado
      FROM donaciones
      ORDER BY id_donacion DESC
    `;
    res.status(200).json({ donaciones });
  } catch (e) {
    console.error("Error al obtener donaciones:", e);
    res.status(500).json({ error: `Error al obtener donaciones: ${e}` });
  }
}

 static async setestado(req, res) {
    const { id_donacion } = req.params;
    const { estado } = req.body;

    try {
      const result = await sql`
      UPDATE DONACIONES SET estado = ${estado} WHERE id_donacion = ${id_donacion}
    `;

      res.status(203).send({ mensaje: "Estado actualizado correctamente!" });
    } catch (err) {
      res
        .status(500)
        .send({ mensaje: "Error al setear el estado", error: err.message });
    }
  }
}

export default ProductosDonacionController;
