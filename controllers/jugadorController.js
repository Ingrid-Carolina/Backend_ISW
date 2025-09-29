/**
 * JugadorController.js
 *
 * Controlador para la gestión de jugadores.
 * Facilita la consulta de los datos de los jugadores almacenados en la base de datos,
 * principalmente para fines estadísticos o de visualización en el frontend.
 *
 * Funcionalidades principales:
 * - Obtener la lista completa de jugadores desde la tabla `jugadores`.
 *
 * Este controlador se centra únicamente en la lectura de datos y sirve como base
 * para mostrar información relacionada con jugadores en la aplicación.
 */


import { sql } from "../config/postgre.js";

class JugadorController {
    /**
     * 
     * Obtener lisa de jugadores para estadisticas
     */
    static async getJugadores(req, res) {
        try{
            const jugadores = await sql `SELECT * FROM jugadores`;

            res.status(200).json({jugadores});
        } catch (e) {
            console.error(`Error al obtener jugadores: ${e}`);
            res.status(500).json({
                error: `Error al obtener jugadores: ${e}`
            });
        }
    }
}

export default JugadorController;