// Importa las dependencias necesarias para manejar los productos.
import { sql } from "../config/postgre.js";
import { uploadToSupabase, deleteFromSupabaseByUrl } from "./_uploadHelpers.js";

// Helpers para normalizar valores y evitar "undefined".
const toNullable = (v) =>
  v === undefined || v === null || v === "" || v === "undefined" ? null : v;

const toNumberOrNull = (v) => {
  if (v === undefined || v === null || v === "" || v === "undefined") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

// Controlador para manejar las operaciones relacionadas con los productos.
export default class ProductoController {
  // Método para listar todos los productos.
  static async getProductos(req, res) {
    try {
      // Consulta SQL para obtener todos los productos.
      const productos = await sql`
        SELECT idproducto, nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url
        FROM productos
        ORDER BY idproducto
      `;
      // Devuelve los productos en formato JSON.
      res.status(200).json({ productos });
    } catch (e) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error(`Error al obtener productos:`, e);
      res.status(500).json({ error: `Error al obtener productos: ${e.message}` });
    }
  }

  // Método para obtener un producto específico por su ID.
  static async getProductoById(req, res) {
    try {
      const { id } = req.params;
      // Consulta SQL para obtener los detalles de un producto específico.
      const [producto] = await sql`
        SELECT idproducto, nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url
        FROM productos
        WHERE idproducto = ${id}
      `;
      if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
      // Devuelve los detalles del producto en formato JSON.
      res.status(200).json(producto);
    } catch (e) {
      // Manejo de errores en caso de fallo en la consulta SQL.
      console.error(`Error al obtener producto:`, e);
      res.status(500).json({ error: `Error al obtener producto: ${e.message}` });
    }
  }

  // Método para agregar un nuevo producto.
  static async addProducto(req, res) {
    try {
      const uid = req.user?.uid; // UID del usuario autenticado.

      // Leer valores del cuerpo de la solicitud (JSON o multipart).
      const b = req.body || {};
      const nombreRaw =
        b.nombre_producto ??
        b["nombre_producto "] ??
        b["nombre_producto"] ??
        null;

      const nombre_producto = toNullable(
        typeof nombreRaw === "string" ? nombreRaw.trim() : nombreRaw
      );
      const descripcion     = toNullable(b.descripcion);
      const precio_unitario = toNumberOrNull(b.precio_unitario);
      const cantidad        = toNumberOrNull(b.cantidad);
      const talla           = toNullable(b.talla);
      const estado          = toNullable(b.estado) ?? "Pendiente";

      // URL de la imagen (si se proporciona directamente).
      let image_url = toNullable(b.image_url);

      // Si se sube un archivo, súbelo a Supabase y usa esa URL.
      if (req.file && uid) {
        const up = await uploadToSupabase({ file: req.file, uid });
        image_url = up.url; // URL pública de la imagen.
      }

      // Validaciones mínimas para los datos del producto.
      if (!nombre_producto) {
        return res.status(400).json({ mensaje: "Nombre y precio son obligatorios!" });
      }
      if (precio_unitario === null || precio_unitario < 0) {
        return res.status(400).json({ mensaje: "Precio unitario inválido" });
      }

      // Inserta el nuevo producto en la base de datos.
      const result = await sql`
        INSERT INTO productos (nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url)
        VALUES (
          ${nombre_producto},
          ${descripcion},
          ${precio_unitario},
          ${cantidad},
          ${talla},
          ${estado},
          ${image_url}
        )
        RETURNING idproducto, nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url
      `;

      // Devuelve una respuesta indicando que el producto fue creado exitosamente.
      return res.status(201).json({
        mensaje: "Producto creado correctamente",
        producto: result[0],
      });
    } catch (e) {
      // Manejo de errores en caso de fallo al agregar el producto.
      console.error(`Error al agregar producto:`, e);
      return res.status(500).json({ error: `Error al agregar producto: ${e.message}` });
    }
  }

  // Método para actualizar un producto existente.
  static async actualizarProducto(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    try {
      const uid = req.user?.uid;
      const b = req.body || {};

      // Leer valores del cuerpo de la solicitud (permitiendo parches parciales).
      const nombre_producto = toNullable(
        typeof b.nombre_producto === "string" ? b.nombre_producto.trim() : b.nombre_producto
      );
      const descripcion     = toNullable(b.descripcion);
      const precio_unitario = toNumberOrNull(b.precio_unitario);
      const cantidad        = toNumberOrNull(b.cantidad);
      const talla           = toNullable(b.talla);
      const estado          = toNullable(b.estado);
      let   image_url       = toNullable(b.image_url);

      // Recupera la URL actual de la imagen para saber si debe ser eliminada.
      const prevRows = await sql`
        SELECT image_url
        FROM productos
        WHERE idproducto = ${id}
      `;
      if (prevRows.length === 0) {
        return res.status(404).json({ mensaje: "Producto no encontrado" });
      }
      const prevImageUrl = prevRows[0]?.image_url || null;

      // Si se sube un archivo, súbelo a Supabase y reemplaza la URL.
      if (req.file && uid) {
        const up = await uploadToSupabase({ file: req.file, uid });
        image_url = up.url;

        // Borra la imagen anterior en Supabase si fue reemplazada.
        if (prevImageUrl && prevImageUrl !== image_url) {
          try { await deleteFromSupabaseByUrl(prevImageUrl); } catch { /* noop */ }
        }
      }

      // Actualiza el producto en la base de datos.
      const result = await sql`
        UPDATE productos
           SET nombre_producto = COALESCE(${nombre_producto}, nombre_producto),
               descripcion     = COALESCE(${descripcion}, descripcion),
               precio_unitario = COALESCE(${precio_unitario}, precio_unitario),
               cantidad        = COALESCE(${cantidad}, cantidad),
               talla           = COALESCE(${talla}, talla),
               estado          = COALESCE(${estado}, estado),
               image_url       = COALESCE(${image_url}, image_url)
         WHERE idproducto = ${id}
         RETURNING idproducto, nombre_producto, descripcion, precio_unitario, cantidad, talla, estado, image_url
      `;

      // Devuelve una respuesta indicando que el producto fue actualizado exitosamente.
      return res.status(200).json({
        mensaje: "Producto actualizado correctamente",
        producto: result[0],
      });
    } catch (e) {
      // Manejo de errores en caso de fallo al actualizar el producto.
      console.error(`Error al actualizar producto:`, e);
      return res.status(500).json({ error: `Error al actualizar producto: ${e.message}` });
    }
  }

  // Método para eliminar un producto existente.
  static async eliminarProducto(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }
    try {
      // Recupera la URL de la imagen para eliminarla del bucket.
      const rows = await sql`
        SELECT image_url
        FROM productos
        WHERE idproducto = ${id}
      `;
      if (rows.length === 0) {
        return res.status(404).json({ mensaje: "Producto no encontrado" });
      }
      const imgUrl = rows[0]?.image_url || null;

      // Elimina el producto de la base de datos.
      await sql`DELETE FROM productos WHERE idproducto = ${id}`;

      // Elimina la imagen del bucket si existe.
      if (imgUrl) {
        try { await deleteFromSupabaseByUrl(imgUrl); } catch { /* noop */ }
      }

      // Devuelve una respuesta indicando que el producto fue eliminado exitosamente.
      return res.status(200).json({ mensaje: "Producto eliminado correctamente!" });
    } catch (e) {
      // Manejo de errores en caso de fallo al eliminar el producto.
      console.error(`Error al eliminar producto:`, e);
      return res.status(500).json({ mensaje: "Error al eliminar producto", error: e.message });
    }
  }
}
