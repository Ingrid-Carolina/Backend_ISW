import express from 'express'
import { ContactFormValidator, CreateUserValidator, SignInValidator, EditProfileValidator } from '../Middlewares/ValidatorMiddleware.js';
import verificarToken from '../Middlewares/ValidatorMiddleware.js';
import AuthController from '../controllers/authController.js';
import { requireAuth, requireRole } from '../Middlewares/authCookieMiddleware.js';
import NoticiaController from '../controllers/noticiaController.js';

const router = express.Router();

router.post('/signup', CreateUserValidator, AuthController.registrarUsuario);
router.post('/signin', SignInValidator, AuthController.loginUsuario);
router.post('/signout', AuthController.signOutUsuario);
router.post('/registrarformulario', ContactFormValidator, AuthController.registrarformulario);
router.post('/restablecer', AuthController.ResetPassword);
router.post('/verificar', AuthController.captcha);
router.get('/obtenereventos', AuthController.obtenerEventos);
router.put('/editarperfil', verificarToken, EditProfileValidator, AuthController.editarPerfil);
router.get('/datosusuario', verificarToken, AuthController.obtenerDatosUsuario);
router.delete('/eliminar', verificarToken, AuthController.eliminarUsuarioAutenticado);
//router.post('/agregarproducto');
//router.post('/login', (req, res) => authController.login(req, res));
// Acciones que requieren sesión (usuario logueado)
// Acciones de administración de eventos

//eventos
router.post('/comprar', requireAuth, AuthController.realizarcompra);
router.post('/registrarevento', requireAuth, requireRole('admin', 'admin-calendario'), AuthController.registrarEvento);
router.put('/evento/:id',      requireAuth, requireRole('admin', 'admin-calendario'), AuthController.actualizarEvento);
router.delete('/evento/:id',   requireAuth, requireRole('admin', 'admin-calendario'), AuthController.eliminarEvento);

// noticias
router.get('/noticias', NoticiaController.getNoticias); 
router.post('/agregarnoticia/:autor_id', requireAuth, requireRole('admin', 'admin-calendario'), NoticiaController.addNoticia);
router.put('/modificarnoticia/:id/:autor_id' ,requireAuth, requireRole('admin', 'admin-calendario'), NoticiaController.actualizarNoticia);
router.delete('/eliminarnoticia/:id', requireAuth, requireRole('admin', 'admin-calendario'), NoticiaController.eliminarNoticia);


export default router;