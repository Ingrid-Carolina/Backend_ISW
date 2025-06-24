import axios from "axios";
import auth from "../config/firebase.js";
import { sql } from "../config/postgre.js";
import enviarCorreoConfirmacion from "../utils/enviarcorreo.js";
//import { sql } from "./postgre.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";

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

      return res.status(200).send({
        mensaje: "Sesión iniciada correctamente",
        token: idToken,
        usuario: {
          email,
          rol,
          nombre,
        },
      });
    } catch (err) {
      return res
        .status(400)
        .send({ mensaje: "Error al iniciar sesión: " + err.message });
    }
  }

  //Funcion para sign out el usuario
  static async signOutUsuario(req, res) {
    const user = auth.currentUser;
    if (!user) {
      res.status(401).send("No hay cuenta iniciada");
      return;
    }

    try {
      await signOut(auth);
      res.status(203).send({
        mensaje: "Sesion cerrada",
      });
    } catch (err) {
      console.error("Error al cerrar sesion:", err);
      res.status(500).send("Error al crear el usuario: " + err.message);
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
