// controllers/homeTextosController.js
import { sql } from "../config/postgre.js";

/**
 * Claves permitidas en Home (coinciden con lo que usarás en Home.jsx)
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

const MAX_LEN = 2000;

function isValidClave(clave) {
  return typeof clave === "string" && CLAVES_PERMITIDAS.includes(clave);
}

export default class HomeTextController {
  // GET /auth/home/textos  → devuelve objeto clave-valor
  static async obtenerTodos(req, res) {
    try {
      const rows = await sql`
        SELECT clave, valor, descripcion, updated_at
        FROM home_textos
        ORDER BY clave ASC
      `;

      const data = {};
      for (const r of rows) data[r.clave] = r.valor;

      return res.json({
        success: true,
        data,
        count: rows.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ [HomeTextos] obtenerTodos:", error);
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al cargar textos de Home",
      });
    }
  }

  // GET /auth/home/textos/:clave  → un registro por clave
  static async obtenerPorClave(req, res) {
    try {
      const { clave } = req.params;

      if (!isValidClave(clave)) {
        return res.status(400).json({
          success: false,
          mensaje: `Clave inválida. Válidas: ${CLAVES_PERMITIDAS.join(", ")}`,
        });
      }

      const rows = await sql`
        SELECT clave, valor, descripcion, updated_at
        FROM home_textos
        WHERE clave = ${clave}
      `;

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          mensaje: `No existe texto para la clave "${clave}"`,
        });
      }

      return res.json({
        success: true,
        data: rows[0],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ [HomeTextos] obtenerPorClave:", error);
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al cargar el texto",
      });
    }
  }

  // PUT /auth/home/textos  → upsert { clave, valor }
  static async upsert(req, res) {
    try {
      let { clave, valor, descripcion } = req.body || {};

      if (!isValidClave(clave)) {
        return res.status(400).json({
          success: false,
          mensaje: `Clave inválida. Válidas: ${CLAVES_PERMITIDAS.join(", ")}`,
        });
      }
      if (typeof valor !== "string") {
        return res.status(400).json({
          success: false,
          mensaje: "El valor debe ser una cadena",
        });
      }
      if (valor.length > MAX_LEN) {
        return res.status(400).json({
          success: false,
          mensaje: `El texto excede el máximo de ${MAX_LEN} caracteres`,
        });
      }
      if (descripcion && typeof descripcion !== "string") {
        descripcion = null;
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
      `;

      return res.json({
        success: true,
        mensaje: "Texto guardado correctamente",
        data: rows[0],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ [HomeTextos] upsert:", error);
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al guardar el texto",
      });
    }
  }

  // PUT /auth/home/textos/bulk  → { textos: { clave: valor, ... } }
  static async upsertBulk(req, res) {
    try {
      const { textos } = req.body || {};

      if (!textos || typeof textos !== "object" || Array.isArray(textos)) {
        return res.status(400).json({
          success: false,
          mensaje: "El cuerpo debe incluir { textos: { clave: valor, ... } }",
        });
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
          `;

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
      });
    } catch (error) {
      console.error("❌ [HomeTextos] upsertBulk:", error);
      return res.status(500).json({
        success: false,
        mensaje: "Error interno al guardar textos",
      });
    }
  }
}
