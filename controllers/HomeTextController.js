// controllers/homeTextosController.js
import { sql } from "../config/postgre.js";

/**
 * Claves permitidas en Home (coinciden con lo que usarás en Home.jsx).
 */
const CLAVES_PERMITIDAS = [
  "header_l1",
  "header_l2",
  "header_l3",
  "about_titulo",
  "about_sub",
  "mision_titulo",
  "mision_desc",
  "vision_titulo",
  "vision_desc",
  "valores_titulo",
  "valores_sub",
  "noticias_titulo",
  "noticias_sub",
];

// Longitud máxima permitida para los valores de texto.
const MAX_LEN = 2000;

// Función para validar si una clave es válida.
function isValidClave(clave) {
  return typeof clave === "string" && CLAVES_PERMITIDAS.includes(clave);
}

// Controlador para manejar los textos de la página de inicio.
export default class HomeTextController {
  // Método para obtener todos los textos de la base de datos.
  static async obtenerTodos(req, res) {
    try {
      const rows = await sql`
        SELECT clave, valor, descripcion, updated_at
        FROM home_textos
        ORDER BY clave ASC
      `; // Consulta SQL para obtener los textos.

      const data = {};
      for (const r of rows) data[r.clave] = r.valor; // Convierte los resultados en un objeto clave-valor.

      return res.json({
        success: true,
        data,
        count: rows.length,
        timestamp: new Date().toISOString(),
      }); // Devuelve los textos en formato JSON.
    } catch (error) {
      console.error("❌ [HomeTextos] obtenerTodos:", error); // Manejo de errores.
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al cargar textos de Home",
      });
    }
  }

  // Método para obtener un texto específico por su clave.
  static async obtenerPorClave(req, res) {
    try {
      const { clave } = req.params; // Obtiene la clave de los parámetros de la solicitud.

      if (!isValidClave(clave)) {
        return res.status(400).json({
          success: false,
          mensaje: `Clave inválida. Válidas: ${CLAVES_PERMITIDAS.join(", ")}`,
        }); // Valida la clave.
      }

      const rows = await sql`
        SELECT clave, valor, descripcion, updated_at
        FROM home_textos
        WHERE clave = ${clave}
      `; // Consulta SQL para obtener el texto por clave.

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          mensaje: `No existe texto para la clave "${clave}"`,
        }); // Manejo de caso donde no se encuentra el texto.
      }

      return res.json({
        success: true,
        data: rows[0],
        timestamp: new Date().toISOString(),
      }); // Devuelve el texto encontrado.
    } catch (error) {
      console.error("❌ [HomeTextos] obtenerPorClave:", error); // Manejo de errores.
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al cargar el texto",
      });
    }
  }

  // Método para insertar o actualizar un texto en la base de datos.
  static async upsert(req, res) {
    try {
      let { clave, valor, descripcion } = req.body || {}; // Obtiene los datos del cuerpo de la solicitud.

      if (!isValidClave(clave)) {
        return res.status(400).json({
          success: false,
          mensaje: `Clave inválida. Válidas: ${CLAVES_PERMITIDAS.join(", ")}`,
        }); // Valida la clave.
      }
      if (typeof valor !== "string") {
        return res.status(400).json({
          success: false,
          mensaje: "El valor debe ser una cadena",
        }); // Valida que el valor sea una cadena.
      }
      if (valor.length > MAX_LEN) {
        return res.status(400).json({
          success: false,
          mensaje: `El texto excede el máximo de ${MAX_LEN} caracteres`,
        }); // Valida la longitud del valor.
      }
      if (descripcion && typeof descripcion !== "string") {
        descripcion = null; // Si la descripción no es una cadena, se establece como null.
      }

      const rows = await sql`
        INSERT INTO home_textos (clave, valor, descripcion)
        VALUES (${clave}, ${valor.trim()}, ${descripcion || null})
        ON CONFLICT (clave)
        DO UPDATE SET
          valor = EXCLUDED.valor,
          descripcion = COALESCE(EXCLUDED.descripcion, home_textos.descripcion),
          updated_at = NOW()
        RETURNING id_texto, clave, valor, descripcion, created_at, updated_at
      `; // Inserta o actualiza el texto en la base de datos.

      return res.json({
        success: true,
        mensaje: "Texto guardado correctamente",
        data: rows[0],
        timestamp: new Date().toISOString(),
      }); // Respuesta de éxito.
    } catch (error) {
      console.error("❌ [HomeTextos] upsert:", error); // Manejo de errores.
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al guardar el texto",
      });
    }
  }

  // Método para insertar o actualizar múltiples textos en la base de datos.
  static async upsertBulk(req, res) {
    try {
      const { textos } = req.body || {}; // Obtiene los textos del cuerpo de la solicitud.

      if (!textos || typeof textos !== "object" || Array.isArray(textos)) {
        return res.status(400).json({
          success: false,
          mensaje: "El cuerpo debe incluir { textos: { clave: valor, ... } }",
        }); // Valida el formato del cuerpo de la solicitud.
      }

      const resultados = { guardados: [], errores: [] };

      for (const [clave, valor] of Object.entries(textos)) {
        try {
          if (!isValidClave(clave)) {
            resultados.errores.push({ clave, error: "Clave no permitida" });
            continue;
          }
          if (typeof valor !== "string") {
            resultados.errores.push({ clave, error: "El valor debe ser string" });
            continue;
          }
          if (valor.length > MAX_LEN) {
            resultados.errores.push({
              clave,
              error: `Excede ${MAX_LEN} caracteres`,
            });
            continue;
          }

          await sql`
            INSERT INTO home_textos (clave, valor)
            VALUES (${clave}, ${valor.trim()})
            ON CONFLICT (clave)
            DO UPDATE SET
              valor = EXCLUDED.valor,
              updated_at = NOW()
          `; // Inserta o actualiza el texto en la base de datos.

          resultados.guardados.push(clave);
        } catch (e) {
          resultados.errores.push({ clave, error: e.message });
        }
      }

      const ok = resultados.errores.length === 0;

      return res.status(ok ? 200 : 207).json({
        success: ok,
        mensaje: ok
          ? "Textos guardados correctamente"
          : "Algunos textos no se pudieron guardar",
        data: resultados,
        timestamp: new Date().toISOString(),
      }); // Respuesta con los resultados de la operación.
    } catch (error) {
      console.error("❌ [HomeTextos] upsertBulk:", error); // Manejo de errores.
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al guardar textos",
      });
    }
  }
}
