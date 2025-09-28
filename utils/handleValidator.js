// Importa la función `validationResult` de la librería `express-validator`.
import { validationResult } from "express-validator";

/**
 * Middleware para validar los resultados de las validaciones realizadas en las rutas.
 * Si no hay errores, permite que la solicitud continúe al siguiente middleware o controlador.
 * Si hay errores, responde con un estado 403 y un arreglo de errores.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar al siguiente middleware.
 */
const validateResult = (req, res, next) => {
    try {
        validationResult(req).throw(); // Lanza un error si hay problemas de validación.
        return next(); // Continúa con el siguiente middleware o controlador si no hay errores.
    } catch (err) {
        res.status(403); // Establece el estado de respuesta en 403 (Prohibido).
        res.send({ errors: err.array() }); // Envía los errores de validación como respuesta.
    }
};

export default validateResult;
