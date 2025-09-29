import { sql } from '../config/postgre.js';

class CategoriasSiteController {
    // Obtener header
    static async getHeader(req, res) {
        try {
            const [header] = await sql`SELECT header_title, header_img FROM categorias_site WHERE id = 1`;
            if (!header) return res.status(404).json({ error: 'Header no encontrado' });
            res.status(200).json(header);
        } catch (err) {
            console.error('Error al obtener header:', err);
            res.status(500).json({ error: 'Error al obtener header' });
        }
    }

    // Actualizar header
    static async updateHeader(req, res) {
        try {
            const [current] = await sql`SELECT * FROM categorias_site WHERE id = 1`;
            if (!current) return res.status(404).json({ error: 'Header no encontrado' });

            const header_title = req.body.header_title ?? current.header_title;
            const header_img = req.body.header_img ?? current.header_img;

            const [updated] = await sql`
        UPDATE categorias_site
        SET
          header_title = ${header_title},
          header_img = ${header_img}
        WHERE id = 1
        RETURNING *
      `;
            res.status(200).json(updated);
        } catch (err) {
            console.error('Error al actualizar header:', err);
            res.status(500).json({ error: 'Error al actualizar header' });
        }
    }

    // Obtener carrusel
    static async getCarrusel(req, res) {
        try {
            const [carrusel] = await sql`SELECT carrusel_title, carrusel_subtitle, carrusel_image FROM categorias_site WHERE id = 1`;
            if (!carrusel) return res.status(404).json({ error: 'Carrusel no encontrado' });
            res.status(200).json(carrusel);
        } catch (err) {
            console.error('Error al obtener carrusel:', err);
            res.status(500).json({ error: 'Error al obtener carrusel' });
        }
    }

    // Actualizar carrusel
    static async updateCarrusel(req, res) {
        try {
            const [current] = await sql`SELECT * FROM categorias_site WHERE id = 1`;
            if (!current) return res.status(404).json({ error: 'Carrusel no encontrado' });

            const carrusel_title = req.body.carrusel_title ?? current.carrusel_title;
            const carrusel_subtitle = req.body.carrusel_subtitle ?? current.carrusel_subtitle;
            const carrusel_image = req.body.carrusel_image ?? current.carrusel_image;

            const [updated] = await sql`
        UPDATE categorias_site
        SET
          carrusel_title = ${carrusel_title},
          carrusel_subtitle = ${carrusel_subtitle},
          carrusel_image = ${carrusel_image}
        WHERE id = 1
        RETURNING *
      `;
            res.status(200).json(updated);
        } catch (err) {
            console.error('Error al actualizar carrusel:', err);
            res.status(500).json({ error: 'Error al actualizar carrusel' });
        }
    }

    static async getAll(req, res) {
        try {
            const [data] = await sql`SELECT * FROM categorias_site WHERE id = 1`;
            if (!data) return res.status(404).json({ error: 'Datos de categorías no encontrados' });
            res.status(200).json(data);
        } catch (err) {
            console.error('Error al obtener datos de categorías:', err);
            res.status(500).json({ error: 'Error al obtener datos de categorías' });
        }
    }

    static async updateCarrusel(req, res) {
        try {
            const [current] = await sql`SELECT * FROM categorias_site WHERE id = 1`;
            if (!current) return res.status(404).json({ error: 'Carrusel no encontrado' });

            const carrusel_title = req.body.carrusel_title ?? current.carrusel_title;
            const carrusel_subtitle = req.body.carrusel_subtitle ?? current.carrusel_subtitle;
            const carrusel_image = req.body.carrusel_image ?? current.carrusel_image;

            const [updated] = await sql`
      UPDATE categorias_site
      SET
        carrusel_title = ${carrusel_title},
        carrusel_subtitle = ${carrusel_subtitle},
        carrusel_image = ${carrusel_image}
      WHERE id = 1
      RETURNING *
    `;
            res.status(200).json(updated);
        } catch (err) {
            console.error('Error al actualizar carrusel:', err);
            res.status(500).json({ error: 'Error al actualizar carrusel' });
        }
    }
}

export default CategoriasSiteController;
