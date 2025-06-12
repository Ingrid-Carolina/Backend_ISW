import { check } from 'express-validator';
import { param } from 'express-validator';
import validateResult from './handleValidator.js';
import { sql } from '../postgre.js';

const CreateUserValidator = [
    check("nombre").notEmpty().withMessage('El nombre no debe estar en blanco.'),
    check("email").isEmail().exists().notEmpty().withMessage('Email es requerido y debe de ser un email real.'),
    check("password").exists().notEmpty().withMessage('Password es requerido.'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
];

const SignInValidator = [
    check("email").exists().notEmpty().withMessage('Email es requerido.'),
    check("password").exists().notEmpty().withMessage('Password es requerido.'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
];

export  {CreateUserValidator, SignInValidator};