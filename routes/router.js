import express from 'express'
import { CreateUserValidator, SignInValidator } from '../Middlewares/ValidatorMiddleware.js';
import AuthController from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', CreateUserValidator, AuthController.registrarUsuario);
router.post('/signin', SignInValidator, AuthController.loginUsuario);
router.post('/signout', AuthController.signOutUsuario);
router.post('/registrarformulario', AuthController.registrarformulario);
//router.post('/login', (req, res) => authController.login(req, res));

export default router;