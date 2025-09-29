/**
 * Rutas API (Express Router)
 *
 * Define todas las rutas HTTP del backend y las agrupa por módulo/funcionalidad.
 * Aplica middlewares de autenticación/autorización y validaciones antes de
 * delegar en los controladores correspondientes.
 *
 * Incluye:
 * - Autenticación y perfil (signup, signin, signout, reset, captcha, perfil, UID).
 * - Contacto (formulario, textos e imágenes).
 * - Eventos (CRUD con subida de imágenes).
 * - Noticias (CRUD).
 * - Testimonios (CRUD + textos/imágenes del sitio).
 * - NuestroEquipo (textos, junta directiva e imágenes).
 * - Tienda (productos, textos, órdenes y detalle de órdenes).
 * - Donaciones (productos y registro de donaciones).
 * - Home (textos e imágenes).
 * - Categorías (imágenes y CRUD de categorías).
 * - Jugadores (listado para estadísticas).
 *
 * Middlewares:
 * - requireAuth: exige sesión válida (Firebase ID token en cookie).
 * - requireRole: restringe acceso por rol (e.g., 'admin').
 * - Validadores (express-validator) para inputs críticos.
 * - uploadImages: carga de archivos vía Multer.
 *
 * Respuestas:
 * - JSON consistente con códigos HTTP adecuados.
 * - Manejo de errores básico por try/catch en cada controlador.
 */
import express from 'express'
import { ContactFormValidator, CreateUserValidator, SignInValidator, EditProfileValidator, DonacionesFormValidator } from '../Middlewares/ValidatorMiddleware.js';
import verificarToken from '../Middlewares/ValidatorMiddleware.js';
import AuthController from '../controllers/authController.js';
import { requireAuth, requireRole } from '../Middlewares/authCookieMiddleware.js';
import NoticiaController from '../controllers/noticiaController.js';
import eventController from '../controllers/eventController.js';
import JugadorController from '../controllers/jugadorController.js';
import FileUploadController from '../controllers/fileUploadController.js';
import uploadImages from '../Middlewares/multer.js';
import ProductosDonacionController from '../controllers/productos_donacionController.js';
import contactoController from '../controllers/contactoController.js';
import ProductoController from '../controllers/productoController.js';
import HomeImageController from '../controllers/HomeImageController.js';
import OrdenController from '../controllers/ordenController.js';
import DetalleOrdenController from '../controllers/detalleOrdenController.js';
import AliadosImageController from '../controllers/TestimoniosImageController.js';
import TestimoniosImageController from '../controllers/TestimoniosImageController.js';
import testimoniosController from '../controllers/testimoniosController.js';
import ContactoImageController from '../controllers/ContactoImageController.js';
import CategoriaImageController from '../controllers/CategoriaImageController.js';
import NuestroEquipoImageController from '../controllers/NuestroEquipoImageController.js';
import HomeTextController from '../controllers/HomeTextController.js';
import CategoriasSiteController from '../controllers/categoriasSiteController.js';

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
router.post('/comprar', requireAuth, AuthController.realizarcompra);
router.put('/editarperfil', requireAuth, EditProfileValidator, AuthController.editarPerfil);
router.get('/obtenerperfil', requireAuth, AuthController.obtenerPerfil);

//eventos
router.get('/obtenereventos', eventController.obtenerEventos);
router.post('/registrarevento', requireAuth, requireRole('admin', 'admin-calendario'), uploadImages.single('file'), eventController.registrarEvento);
router.put('/evento/:id', requireAuth, requireRole('admin', 'admin-calendario'), uploadImages.single('file'), eventController.actualizarEvento);
router.delete('/evento/:id', requireAuth, requireRole('admin', 'admin-calendario'), eventController.eliminarEvento);

// noticias
router.get('/noticias', NoticiaController.getNoticias);
router.post('/agregarnoticia/:autor_id', requireAuth, requireRole('admin'), NoticiaController.addNoticia);
router.put('/modificarnoticia/:id/:autor_id', requireAuth, requireRole('admin'), NoticiaController.actualizarNoticia);
router.delete('/eliminarnoticia/:id', requireAuth, requireRole('admin'), NoticiaController.eliminarNoticia);
router.get('/noticias/:id', NoticiaController.getNoticiaById);

//testimonios
router.get('/obtenertestimonios', AuthController.obtenerTestimonios);
router.put("testimonios/destacado", requireAuth, requireRole('admin'), AuthController.destacarTestimonio);
router.get("testimonios/destacado", AuthController.obtenerDestacado);
router.post('/registrartestimonio', requireAuth, requireRole('admin'), AuthController.registrarTestimonio);
router.put('/testimonio/:id', requireAuth, requireRole('admin'), AuthController.actualizarTestimonio);
router.delete('/testimonio/:id', requireAuth, requireRole('admin'), AuthController.eliminarTestimonios);

// Agregar al router.js junto con las otras rutas
router.get('/testimoniossite', testimoniosController.obtener);
router.put('/testimoniossite', requireAuth, requireRole('admin'), testimoniosController.actualizar);
router.get('/testimoniosimages', TestimoniosImageController.getImages);
router.put('/testimoniosimages', requireAuth, requireRole('admin'), TestimoniosImageController.updateImage);

//envivo
router.post('/registrarenvivo', requireAuth, requireRole('admin'), AuthController.registrarenvivo);
router.get('/obtenerenvivo', AuthController.obtenerenvivo);
router.put('/video/:id', requireAuth, requireRole('admin'), AuthController.actualizarenvivo);
router.patch('/envivo/mostrar-anuncio', requireAuth, requireRole('admin'), AuthController.setMostrarAnuncio);


//NuestroEquipo
router.get('/junta-directiva', AuthController.obtenerJuntaDirectiva); // Sin autenticación para mostrar públicamente
router.post('/junta-directiva', requireAuth, requireRole('admin'), AuthController.agregarMiembro);
router.put('/junta-directiva/:id', requireAuth, requireRole('admin'), AuthController.editarMiembro);
router.delete('/junta-directiva/:id', requireAuth, requireRole('admin'), AuthController.eliminarMiembro);



// NuestroEquipo imágenes
router.get('/nuestroequipo/images', NuestroEquipoImageController.getImages);
router.put('/nuestroequipo/images', requireAuth, requireRole('admin'), NuestroEquipoImageController.updateImage)


//Nuestro Equipo. editar texto
router.get('/nuestroequipo/textos', AuthController.obtenerTodosLosTextos);
router.get('/nuestroequipo/textos/:clave', AuthController.obtenerTextoPorClave);
router.put('/nuestroequipo/textos', requireAuth, requireRole('admin'), AuthController.actualizarTexto);
router.put('/nuestroequipo/textos/multiples', requireAuth, requireRole('admin'), AuthController.actualizarMultiplesTextos);

//Tienda Editar texto
// Tienda Editar texto - ESTAS RUTAS DEBEN EXISTIR
router.get('/tienda/textos', AuthController.obtenerTextosTienda);
router.get('/tienda/textos/:clave', AuthController.obtenerTextoPorClave);
router.put('/tienda/textos', requireAuth, requireRole('admin'), AuthController.actualizarTextoTienda);
router.put('/tienda/textos/multiple', requireAuth, requireRole('admin'), AuthController.actualizarMultiplesTextosTienda);

//jugadores
router.get('/jugadores', JugadorController.getJugadores);


//subir imagenes
router.post('/upload', requireAuth, requireRole('admin'), uploadImages.single('file'), FileUploadController.uploadFile);
router.put('/images', requireAuth, requireRole('admin'), HomeImageController.updateImage);
router.put('/aliadoimages', requireAuth, requireRole('admin'), AliadosImageController.updateImage);
router.put('/testimonioimages', requireAuth, requireRole('admin'), TestimoniosImageController.updateImage);

//router.post('/health', SomeController.someFunction);

/*
// productos donación
router.get('/productos', ProductosDonacionController.getProductos);
router.post('/productos', requireAuth, requireRole('admin'), ProductosDonacionController.addProducto);
router.put('/productos/:id', requireAuth, requireRole('admin'), ProductosDonacionController.updateProducto);
router.delete('/productos/:id', requireAuth, requireRole('admin'), ProductosDonacionController.deleteProducto);
router.post('/registrardonacion', DonacionesFormValidator, ProductosDonacionController.registrardonacion);
*/



// productos tienda
router.get("/tienda/productos", ProductoController.getProductos);
router.get("/tienda/productos/:id", ProductoController.getProductoById);
router.post("/tienda/agregarproducto", requireAuth, requireRole("admin"), uploadImages.single('file'), ProductoController.addProducto);
router.put("/tienda/modificarproducto/:id", requireAuth, requireRole("admin"), uploadImages.single('file'), ProductoController.actualizarProducto);
router.delete("/tienda/eliminarproducto/:id", requireAuth, requireRole("admin"), ProductoController.eliminarProducto);

// productos donación
router.get('/donaciones/productos', ProductosDonacionController.getProductos);
router.post('/donaciones/productos', requireAuth, requireRole('admin'), ProductosDonacionController.addProducto);
router.put('/donaciones/productos/:id', requireAuth, requireRole('admin'), ProductosDonacionController.updateProducto);
router.delete('/donaciones/productos/:id', requireAuth, requireRole('admin'), ProductosDonacionController.deleteProducto);
router.post('/donaciones/registrardonacion', DonacionesFormValidator, ProductosDonacionController.registrardonacion);
router.get('/donaciones', ProductosDonacionController.getDonaciones);

// ordenes
router.get('/ordenes', OrdenController.getOrdenes);
router.get('/ordenes/:idorden/productos_comprados', OrdenController.getProductosbyID);
router.get('/ordenes/:id', OrdenController.getOrdenById);
router.get('/idorden', AuthController.obteneridorden);
router.put('/orden/:idorden', OrdenController.setestado);
router.post('/agregarorden', requireAuth, OrdenController.addOrden);
router.put('/modificarorden/:id', requireAuth, OrdenController.actualizarOrden);
router.delete('/eliminarorden/:id', requireAuth, requireRole('admin'), OrdenController.eliminarOrden);

// detalle orden
router.get('/detalles', DetalleOrdenController.getDetalles);
router.get('/detalles/:id', DetalleOrdenController.getDetalleById);
router.post('/agregardetalle', requireAuth, DetalleOrdenController.addDetalle);
router.put('/modificardetalle/:id', requireAuth, DetalleOrdenController.actualizarDetalle);
router.delete('/eliminardetalle/:id', requireAuth, requireRole('admin'), DetalleOrdenController.eliminarDetalle);



//contacto
router.get('/contacto', contactoController.obtener);
router.put('/contacto', requireAuth, requireRole('admin'), contactoController.actualizar);
router.get('/contactoimages', ContactoImageController.getImages);
router.put('/contactoimages', requireAuth, requireRole('admin'), ContactoImageController.updateImage);

//Promote Usuario

router.get('/obtenerusuarios', AuthController.obtenerusuarios);
router.put('/usuario/:id', AuthController.setrol); router.get('/images', HomeImageController.getImages);

//Categorias
router.get('/images', CategoriaImageController.getImages);
router.post('/upload', CategoriaImageController.uploadImage);
router.put('/images', CategoriaImageController.updateImage);

//obtener uid
router.get('/obteneruid', requireAuth, AuthController.obtenerUid);

//obtener ultima orden
router.get('/ultimaorden', OrdenController.getultimaorden);

//aliados editar texto 
router.get('/aliados/textos', AuthController.obtenerTextosAliados);
router.get('/aliados/textos/:clave', AuthController.obtenerTextoPorClave);
router.put('/aliados/textos', requireAuth, requireRole('admin'), AuthController.actualizarTextoAliados);
router.put('/aliados/textos/multiple', requireAuth, requireRole('admin'), AuthController.actualizarMultiplesTextosAliados);



//Historia editar texto
router.get('/historia/textos', AuthController.obtenerTextosHistoria);
router.get('/historia/textos/:clave', AuthController.obtenerTextoPorClave);
router.put('/historia/textos', requireAuth, requireRole('admin'), AuthController.actualizarTextoHistoria);
router.put('/historia/textos/multiple', requireAuth, requireRole('admin'), AuthController.actualizarMultiplesTextosHistoria);

//Home editar texto
// Públicos (cualquiera puede leer los textos de Home)
router.get("/home/textos", HomeTextController.obtenerTodos);
router.get("/home/textos/:clave", HomeTextController.obtenerPorClave);

// Protegidos (solo admin puede escribir)
router.put("/home/textos", requireAuth, requireRole("admin"), HomeTextController.upsert);
router.put("/home/textos/bulk", requireAuth, requireRole("admin"), HomeTextController.upsertBulk);

// Obtener todas las categorías
router.get('/categorias', CategoriaImageController.getCategorias);
router.put('/categorias/:id', CategoriaImageController.updateCategoria);

// Rutas para manejar el header y carrusel en categorias_site
router.get('/categorias/site', CategoriasSiteController.getHeader);
router.put('/categorias/site/header', requireAuth, requireRole('admin'), CategoriasSiteController.updateHeader);
router.get('/categorias/carrusel', CategoriasSiteController.getCarrusel);
router.put('/categorias/carrusel', requireAuth, requireRole('admin'), CategoriasSiteController.updateCarrusel);
router.get('/categorias/site/all', CategoriasSiteController.getAll);
router.put('/categorias/site/carrusel', requireAuth, requireRole('admin'), CategoriasSiteController.updateCarrusel);
export default router;