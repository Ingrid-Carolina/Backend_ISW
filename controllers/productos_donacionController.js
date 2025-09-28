// Importa las dependencias necesarias para manejar los productos de donación.
import { sql } from "../config/postgre.js";
import enviarCorreoDonacion from "../utils/donacioncorreo.js";

// Controlador para manejar las operaciones relacionadas con los productos de donación.
class ProductosDonacionController {
  /**
   * Método para obtener la lista de productos de donación.
   */
  static async getProductos(req, res) {
    try {
      // Consulta SQL para obtener todos los productos de donación.
      const productos = await sql`
                SELECT * FROM productos_donacion 
                ORDER BY id
            `;
      // Devuelve los productos en formato JSON.
      res.status(200).json({ productos });
    } catch (e) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error(`Error al obtener productos: ${e}`);
      res.status(500).json({ error: `Error al obtener productos: ${e}` });
    }
  }

  /**
   * Método para agregar un nuevo producto de donación.
   */
  static async addProducto(req, res) {
    const { nombre, descripcion, imagen, estado = true } = req.body;
    try {
      // Inserta un nuevo producto en la base de datos.
      const [nuevoProducto] = await sql`
                INSERT INTO productos_donacion (nombre, descripcion, imagen, estado)
                VALUES (${nombre}, ${descripcion}, ${imagen}, ${estado})
                RETURNING *
            `;
      // Devuelve el producto creado en formato JSON.
      res.status(201).json({ producto: nuevoProducto });
    } catch (e) {
      // Manejo de errores en caso de fallo al agregar el producto.
      console.error(`Error al agregar producto: ${e}`);
      res.status(500).json({ error: `Error al agregar producto: ${e}` });
    }
  }

  /**
   * Método para modificar un producto existente.
   */
  static async updateProducto(req, res) {
    const { id } = req.params;
    const { nombre, descripcion, imagen, estado } = req.body;
    try {
      // Actualiza los datos del producto en la base de datos.
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
        // Devuelve un error si el producto no fue encontrado.
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      // Devuelve el producto actualizado en formato JSON.
      res.status(200).json({ producto: productoActualizado });
    } catch (e) {
      // Manejo de errores en caso de fallo al modificar el producto.
      console.error(`Error al modificar producto: ${e}`);
      res.status(500).json({ error: `Error al modificar producto: ${e}` });
    }
  }

  /**
   * Método para eliminar un producto existente.
   */
  static async deleteProducto(req, res) {
    const { id } = req.params;
    try {
      // Elimina el producto de la base de datos.
      const [productoEliminado] = await sql`
                DELETE FROM productos_donacion
                WHERE id = ${id}
                RETURNING *
            `;
      if (!productoEliminado) {
        // Devuelve un error si el producto no fue encontrado.
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      // Devuelve el producto eliminado en formato JSON.
      res.status(200).json({ producto: productoEliminado });
    } catch (e) {
      // Manejo de errores en caso de fallo al eliminar el producto.
      console.error(`Error al eliminar producto: ${e}`);
      res.status(500).json({ error: `Error al eliminar producto: ${e}` });
    }
  }

  /**
   * Método para registrar una nueva donación.
   */
  static async registrardonacion(req, res) {
    const { nombre, telefono, correo, dia, horario, descripcion } = req.body;

    try {
      // Datos de la donación a registrar.
      const donaciondata = {
        nombre,
        telefono,
        correo,
        dia,
        horario,
        descripcion,
      };

      // Guarda los datos de la donación en la base de datos.
      await sql`INSERT INTO donaciones ${sql(donaciondata)}`;

      // Envío de correos de confirmación.
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

      // Devuelve una respuesta indicando que la donación fue registrada exitosamente.
      return res
        .status(201)
        .send({ mensaje: "¡Donación ingresada correctamente!" });
    } catch (e) {
      // Manejo de errores en caso de fallo al registrar la donación.
      console.error("Error al agregar donación:", e);
      return res.status(500).send({ error: `Error al agregar donación: ${e}` });
    }
  }

  /**
   * Método para obtener la lista de donaciones registradas.
   */
  static async getDonaciones(req, res) {
    try {
      // Consulta SQL para obtener todas las donaciones registradas.
      const donaciones = await sql`
        SELECT id_donacion, nombre, telefono, correo, dia, horario, descripcion
        FROM donaciones
        ORDER BY id_donacion DESC
      `;
      // Devuelve las donaciones en formato JSON.
      res.status(200).json({ donaciones });
    } catch (e) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error("Error al obtener donaciones:", e);
      res.status(500).json({ error: `Error al obtener donaciones: ${e}` });
    }
  }
}

// Exporta el controlador para su uso en otras partes de la aplicación.
export default ProductosDonacionController;
