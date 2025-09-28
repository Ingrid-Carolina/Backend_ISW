import { validationResult } from "express-validator";

const validateResult = (req, res, next) => {
    try {
        validationResult(req).throw(); //throws algun error
        return next(); //procede con el request
    } catch (err) {
        res.status(403);
        res.send({ errors: err.array() }); //imprime los errores en el request antes de realizar el promise
    }
};

export default validateResult;
