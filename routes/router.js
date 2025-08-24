import express from 'express'
import { ContactFormValidator, CreateUserValidator, SignInValidator, EditProfileValidator } from '../Middlewares/ValidatorMiddleware.js';
import verificarToken from '../Middlewares/ValidatorMiddleware.js';
import AuthController from '../controllers/authController.js';
import { requireAuth, requireRole } from '../Middlewares/authCookieMiddleware.js';
import NoticiaController from '../controllers/noticiaController.js';
import eventController from '../controllers/eventController.js';

const router = express.Router();

router.use((req, _res, next) => {
  console.log('Cookie token?', !!req.cookies?.token, 'Origin:', req.headers.origin);
  next();
});


router.post('/signup', CreateUserValidator, AuthController.registrarUsuario);
router.post('/signin', SignInValidator, AuthController.loginUsuario);
router.post('/signout', AuthController.signOutUsuario);
router.post('/registrarformulario', ContactFormValidator, AuthController.registrarformulario);
router.post('/restablecer', AuthController.ResetPassword);
router.post('/verificar', AuthController.captcha);
router.get('/datosusuario', verificarToken, AuthController.obtenerDatosUsuario);
router.delete('/eliminar', verificarToken, AuthController.eliminarUsuarioAutenticado);
//router.post('/agregarproducto');
//router.post('/login', (req, res) => authController.login(req, res));

// Acciones que requieren sesión (usuario logueado)
router.post('/comprar', AuthController.realizarcompra);
router.put('/editarperfil', requireAuth, EditProfileValidator, AuthController.editarPerfil);
router.get('/obtenerperfil', requireAuth, AuthController.obtenerPerfil);

//eventos
router.get('/obtenereventos',eventController.obtenerEventos);
router.post('/registrarevento',eventController.registrarEvento);
router.put('/evento/:id',eventController.actualizarEvento);
router.delete('/evento/:id',eventController.eliminarEvento);

// noticias
router.get('/noticias', NoticiaController.getNoticias); 
router.post('/agregarnoticia/:autor_id', NoticiaController.addNoticia);
router.put('/modificarnoticia/:id/:autor_id' , NoticiaController.actualizarNoticia);
router.delete('/eliminarnoticia/:id', NoticiaController.eliminarNoticia);

//testimonios

router.post('/registrartestimonio', AuthController.registrarTestimonio);
router.get('/obtenertestimonios',AuthController.obtenerTestimonios);
router.delete('/testimonio/:id',AuthController.eliminarTestimonios);
router.put('/testimonio/:id', AuthController.actualizarTestimonio);





export default router;