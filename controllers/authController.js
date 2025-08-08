import axios from "axios";
import auth from "../config/firebase.js";
import { sql } from "../config/postgre.js";
import enviarCorreoConfirmacion from "../utils/enviarcorreo.js";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

//import { sql } from "./postgre.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,       
  sameSite: 'lax',      
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
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
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax', 
      path: '/',
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

  /*async login(req, res) {
        //Logica para procesar el login

        //recibir los datos
        const userEmail = req.body.email;
        const userPass = req.body.password;

        //validar rapidamente
        if (!userEmail || !userPass)
            return res.status(400).json({ error: 'Faltan campos de email o password' });

        try {


            const response = await axios.post(
                https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY},
                {
                    email: userEmail,
                    password: userPass,
                    returnSecureToken: true
                }
            )


            const idToken = response.data.idToken;

            return res.status(200).json({ status: 'OK', message: 'Login exitoso!', token: idToken, userId: response.data.localId });


            //Buscar por email en usuarios
            /*
            const foundUser = this.usuarios.find(user => {
                return user.email === userEmail // Siemmpre debe tener un return 
            });

            //Si no encuentra el usuario
            if(!foundUser){
                return res.status(401).json({error: 'No se encontro ningun usuario con ese correo!'});
            }

            //Validad contrasena
            if(foundUser.password !== userPass){
                return res.status(401).json({error: 'Incorrect password'});
            }

            //Si todo sale bien

        } catch (e) {
            res.status(500).json({ error: Ocurrio un error ${e} });
        }
        
        */

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

  //Funcion para registrar Eventos

  static async registrarEvento(req, res) {
    const { nombre, fecha_inicio, descripcion, fecha_final } = req.body;

    try {
      const result = await sql`
      SELECT * FROM evento_valido(${nombre}, ${fecha_inicio}, ${fecha_final}, ${descripcion})
    `;

      const { exito, mensaje } = result[0];

      if (exito) {
        res.status(201).send({ mensaje });
      } else {
        res.status(400).send({ mensaje });
      }
    } catch (error) {
      console.error("Error al registrar evento:", error);

      res.status(500).send({
        mensaje: "Error interno al registrar el evento",
        detalle: error.message || error.toString(),
      });
    }
  }

  //funcion para mostrar eventos en el backend
  static async obtenerEventos(req, res) {
    try {
      const eventos = await sql`
      SELECT id, nombre, descripcion, fecha_inicio, fecha_final
      FROM Eventos
      ORDER BY fecha_inicio
    `;

      res.status(200).json(eventos);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      res
        .status(500)
        .send({ mensaje: "Error al obtener eventos", error: error.message });
    }
  }

  //funcion para eliminar eventos en la bd
  static async eliminarEvento(req, res) {
    const { id } = req.params;

    try {
      const result = await sql`
      DELETE FROM Eventos WHERE id = ${id}
    `;

      res.status(200).send({ mensaje: "Evento eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      res
        .status(500)
        .send({ mensaje: "Error al eliminar el evento", error: error.message });
    }
  }

  static async actualizarEvento(req, res) {
    const { id } = req.params;
    let { nombre, fecha_inicio, fecha_final, descripcion } = req.body;

    try {
      // Conversión segura a tipo Date
      const inicio = new Date(fecha_inicio);
      const final = new Date(fecha_final);

      // Validación mínima
      if (isNaN(inicio.getTime()) || isNaN(final.getTime())) {
        return res.status(400).send({ mensaje: "Fechas inválidas" });
      }

      const result = await sql`
			UPDATE Eventos
			SET nombre = ${nombre},
				fecha_inicio = ${inicio.toISOString()},
				fecha_final = ${final.toISOString()},
				descripcion = ${descripcion}
			WHERE id = ${id}
			RETURNING id
		`;

      if (result.length === 0) {
        return res.status(404).send({
          mensaje: "No se encontró el evento con ese ID",
        });
      }

      res.status(200).send({
        mensaje: "Evento actualizado correctamente",
        id: result[0].id,
      });
    } catch (error) {
      console.error("Error al actualizar evento:", error);
      res.status(500).send({
        mensaje: "Error al actualizar el evento",
        detalle: error.message,
      });
    }
  }

  static async realizarcompra(req, res) {
    const user = auth.currentUser;
    if (!user) {
      res.status(401).send("No hay cuenta iniciada");
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
}

export default AuthController;
