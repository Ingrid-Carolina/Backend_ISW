import axios from "axios";
import auth from "../config/firebase.js";
import { sql } from "../config/postgre.js";
import enviarCorreoConfirmacion from "../utils/enviarcorreo.js";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import admin from "../config/firebase-admin.js";

//import { sql } from "./postgre.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd, // true en producción con HTTPS
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

class AuthController {
  // Funcion para registrar usuario
  static async registrarUsuario(req, res) {
    const { email, password, nombre } = req.body;

    try {
      const result = await sql`SELECT validar_usuario( ${email}, ${password})`;

      if (result[0].validar_usuario) {
        // Extrae el boolean del arreglo del resultado
        const userCredentials = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredentials.user;
        const uid = userCredentials.user.uid;

        await sendEmailVerification(user);

        const userdata = {
          id: uid,
          nombre: nombre,
          email: email,
          password: password,
        };

        await sql`INSERT INTO Usuarios ${sql(userdata)} `;

        res.status(203).send({
          mensaje: "Su usuario fue creado correctamente",
        });
      } else {
        res.status(400).send({
          mensaje: "Error: Email ya existe en la base de datos",
        });
      }
    } catch (err) {
      console.error("Error al crear el usuario:", err);
      res.status(500).send("Error al crear el usuario: " + err.message);
    }
  }

  // Funcion para autenticar el usuario existente
  static async loginUsuario(req, res) {
    const { email, password } = req.body;

    try {
      // 1. Iniciar sesión con Firebase
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredentials.user.getIdToken();

      // 2. Buscar el rol en la base de datos PostgreSQL
      const result =
        await sql`SELECT rol, nombre FROM Usuarios WHERE email = ${email}`;

      if (result.length === 0) {
        return res
          .status(404)
          .send({ mensaje: "Usuario no encontrado en la base de datos" });
      }

      const { rol, nombre } = result[0];

      // 3. Guardar token en cookie HttpOnly segura
      res.cookie("token", idToken, cookieOptions);

      // 4. Enviar respuesta sin token
      return res.status(200).send({
        mensaje: "Sesión iniciada correctamente",
        usuario: { email, rol, nombre },
        //token: idToken,
      });
    } catch (err) {
      return res
        .status(400)
        .send({ mensaje: "Error al iniciar sesión: " + err.message });
    }
  }

  //Funcion para sign out el usuario
  static async signOutUsuario(req, res) {
    try {
      const user = auth.currentUser;
      if (user) {
        await signOut(auth);
      }

      // Borrar cookie del token
      res.clearCookie("token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
      });

      return res.status(203).send({ mensaje: "Sesion cerrada" });
    } catch (err) {
      console.error("Error al cerrar sesion:", err);
      return res.status(500).send("Error al cerrar la sesión: " + err.message);
    }
  }
  //Funcion para registrar un formulario de Contacto

  static async registrarformulario(req, res) {
    const { email, nombre, apellido, telefono, direccion, proposito, mensaje } =
      req.body;

    try {
      await sql`
            INSERT INTO Contactos (emailcontacto, nombre, apellido, telefono, direccion, proposito, mensaje)
            VALUES (
                ${email},
                ${nombre},
                ${apellido},
                ${telefono},
                ${direccion},
                ${sql.array(proposito)},
                ${mensaje}
            )
        `;

      // Enviar correo de confirmación
      await enviarCorreoConfirmacion({
        email,
        nombre,
        apellido,
        telefono,
        direccion,
        proposito,
        mensaje,
      });
      res.status(201).send({ mensaje: "Formulario enviado correctamente." });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).send({
        mensaje:
          "Hubo un problema al registrar el formulario, inténtalo nuevamente.",
        error: error.message,
      });
    }
  }

  static async ResetPassword(req, res) {
    const auth = getAuth();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: "El email no puede estar vacío" });
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return res.status(200).json({
        mensaje:
          "El correo para restablecer la contraseña ha sido enviado exitosamente",
      });
    } catch (error) {
      return res.status(500).json({
        mensaje: "Hubo un problema al enviar el correo, inténtalo nuevamente.",
        error: error.message,
      });
    }
  }

  static async captcha(req, res) {
    const { token } = req.body;
    const secret = process.env.RECAPTCHA_SECRET;

    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify`,
        null,
        {
          params: {
            secret,
            response: token,
          },
        }
      );

      if (response.data.success) {
        res.status(200).json({ success: true });
      } else {
        res
          .status(400)
          .json({ success: false, errors: response.data["error-codes"] });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Verification failed" });
    }
  }

  //compras
  static async realizarcompra(req, res) {
    const user = auth.currentUser;
    if (!user) {
      res.status(401).send({ mensaje: "No hay cuenta iniciada" });
      return;
    }

    try {
      const { nombreproducto, cantidad } = req.body;

      const producto = await sql`
    SELECT idproducto FROM Productos WHERE nombre_producto = ${nombreproducto}
`;

      /*if (producto.length === 0) {
        throw new Error("El producto no existe.");
      }*/

      // Luego, insertar la compra
      await sql`
    INSERT INTO Compras (idproducto, cantidad_compra, email_compra)
    VALUES (${producto[0].idproducto}, ${cantidad}, ${user.email})
`;

      await sql`UPDATE Productos SET cantidad=cantidad-${cantidad} WHERE nombre_producto = ${nombreproducto}`;

      res.status(201).send({
        mensaje: "Compra exitosa",
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).send({
        mensaje:
          "Hubo un problema al realizar su compra, inténtalo nuevamente.",
        error: error.message,
      });
    }
  }

  //perfil
  static async editarPerfil(req, res) {
    const { nombre, descripcion, avatar } = req.body;
    const uid = req.uid;
    if (!uid) return res.status(401).json({ mensaje: "No autenticado" });

    try {
      if (typeof nombre === "string" && nombre.trim() !== "") {
        await sql`
        UPDATE Usuarios
        SET nombre = ${nombre}
        WHERE id = ${uid}
      `;
      }

      // Transacción por seguridad
      await sql.begin(async (tx) => {
        const updated = await tx`
        UPDATE Perfiles
        SET descripcion = ${descripcion}, avatar = ${avatar}
        WHERE id_perfil = ${uid}
        RETURNING id_perfil
      `;
        if (updated.length === 0) {
          await tx`
          INSERT INTO Perfiles (id_perfil, descripcion, avatar)
          VALUES (${uid}, ${descripcion}, ${avatar})
        `;
        }
      });

      return res.status(200).json({
        mensaje: "Perfil actualizado correctamente",
        avatar, // devuelve la URL para refrescar la navbar
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      return res
        .status(500)
        .json({ mensaje: "Error al actualizar perfil", error: error.message });
    }
  }

  static async obtenerPerfil(req, res) {
    const uid = req.uid;
    if (!uid) return res.status(401).json({ error: "No autenticado" });

    try {
      const perfil = await sql`
      SELECT u.nombre, p.descripcion, p.avatar
      FROM Usuarios u
      LEFT JOIN Perfiles p ON u.id = p.id_perfil
      WHERE u.id = ${uid}
    `;
      return res.status(200).json(perfil);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      return res
        .status(500)
        .json({ mensaje: "Error al obtener perfil", error: error.message });
    }
  }

  static async obtenerDatosUsuario(req, res) {
    const uid = req.uid;

    try {
      const userRecord = await admin.auth().getUser(uid);
      const email = userRecord.email;

      const result = await sql`
      SELECT nombre, email, password
      FROM Usuarios
      WHERE email = ${email}
    `;

      if (result.length === 0) {
        return res
          .status(404)
          .json({ mensaje: "Usuario no encontrado en la base de datos" });
      }

      const { nombre, password } = result[0];

      res.status(200).json({
        nombre,
        email,
        password,
      });
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      res.status(500).json({
        mensaje: "Error al obtener datos del usuario",
        error: error.message,
      });
    }
  }

  static async eliminarUsuarioAutenticado(req, res) {
    try {
      const uid = req.uid;

      // Eliminar el usuario de Firebase Authentication
      await admin.auth().deleteUser(uid);

      // Eliminar el usuario de tu base de datos PostgreSQL
      await sql`DELETE FROM usuarios WHERE id = ${uid}`;

      return res
        .status(200)
        .json({ mensaje: "Usuario eliminado correctamente." });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);

      // Manejar error específico si el usuario no existe en Firebase
      if (error.code === "auth/user-not-found") {
        return res
          .status(404)
          .json({ error: "Usuario no encontrado en Firebase." });
      }

      return res.status(500).json({ error: "Error al eliminar el usuario." });
    }
  }

  static async registrarTestimonio(req, res) {
    const { nombre, contenido, imagen } = req.body; //destructuramos las propiedades especificas de mi req.body

    try {
      const result = await sql`SELECT validar_testimonio( ${nombre} )`;

      if (result[0].validar_testimonio) {
        // Extrae el boolean del arreglo del resultad;

        const userdata = {
          nombre: nombre,
          contenido: contenido,
          imagen: imagen,
        };

        await sql`INSERT INTO Testimonios ${sql(userdata)} `;

        res.status(203).send({
          mensaje: "Su testimonio fue creado correctamente",
        });
      } else {
        res.status(400).send({
          mensaje: "Error: Nombre del testimonio ya existe en la base de datos",
        });
      }
    } catch (err) {
      res
        .status(500)
        .send({ mensaje: "Error al crear el usuario: " + err.message });
    }
  }

  static async obtenerTestimonios(req, res) {
    try {
      const testimonios = await sql`
      SELECT id_testimonio, nombre, contenido, imagen
      FROM Testimonios
    `;
      console.log("Testimonios obtenidos!");
      res.status(200).json(testimonios); //los guarda en un json
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      res
        .status(500)
        .send({ mensaje: "Error al obtener eventos", error: error.message });
    }
  }

  static async eliminarTestimonios(req, res) {
    const { id } = req.params; //no es req.body, por que el id no lo introduce el usuario explicitamente vomo en un form

    try {
      const result = await sql`
      DELETE FROM Testimonios WHERE id_testimonio = ${id}
    `;

      res.status(200).send({ mensaje: "Testimonio eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar Testimonio:", error);
      res.status(500).send({
        mensaje: "Error al eliminar el testimonio",
        error: error.message,
      });
    }
  }

  static async actualizarTestimonio(req, res) {
    const { id } = req.params;
    const { nombre, contenido, imagen } = req.body;

    try {
      const result = await sql`
      UPDATE Testimonios
      SET nombre = ${nombre},
        contenido = ${contenido},
        imagen = ${imagen}
      WHERE id_testimonio = ${id}
      RETURNING id_testimonio
    `;

      res.status(200).send({
        mensaje: "Testimonio actualizado correctamente",
        id: result[0].id_testimonio,
      });
    } catch (error) {
      console.error("Error al actualizar el testimonio:", error);
      res.status(500).send({
        mensaje: "Error al actualizar el testimonio",
        detalle: error.message,
      });
    }
  }
}
export default AuthController;
