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
  maxAge: 4 * 60 * 60 * 1000, // 4 horas
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
      SELECT u.nombre, p.descripcion, p.avatar, u.rol
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
        .send({ mensaje: "Error al crear el testimonio: " + err.message });
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
        .send({ mensaje: "Error al obtener testimonios", error: error.message });
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

static async registrarenvivo(req, res) {
    const { video_url, channel_url, descripcion, activo} = req.body; //destructuramos las propiedades especificas de mi req.body

    try {
      if (!video_url || !channel_url) {
      return res.status(400).send({
        mensaje: "Los campos video_url y channel_url son requeridos"
      });
    }

      const result = await sql`SELECT validar_url( ${video_url} )`;

     
        // Extrae el boolean del arreglo del resultad;

        const urldata = {
          video_url: video_url,
          channel_url: channel_url,
          descripcion: descripcion,
          activo: activo // Activar a true si esta un video live o false si no lo es

        };

        await sql`INSERT INTO envivo ${sql(urldata)} `;

        res.status(203).send({
          mensaje: "Su video en vivo fue creado correctamente",
        });
    } catch (err) {
      res
        .status(500)
        .send({ mensaje: "Error al crear el video en vivo: " + err.message });
    }
  }



  static async obtenerenvivo(req, res) {
   
    try {
       const videos = await sql`
      SELECT id_envivo, video_url, channel_url, descripcion, activo 
      FROM envivo 
      ORDER BY id_envivo DESC
      LIMIT 1
    `;

        console.log('Videos cargados!', videos.length)
        res.status(203).json({ videos}); //envia el arreglo de los videos cargados en un json
      
    } catch (err) {
      res.status(500).send({ mensaje: "Error al cargar los videos: " + err.message });
    }
  }


  static async actualizarenvivo(req,res){

    const{ id_envivo}= req.params;
     const { video_url, channel_url, descripcion} = req.body;
    try {

      if (!video_url || !channel_url) {
      return res.status(400).send({
        mensaje: "Los campos video_url y channel_url son requeridos"
      });
    }

      const result = await sql`
      UPDATE envivo
      SET video_url = ${video_url},
        channel_url = ${channel_url},
        descripcion = ${descripcion},
      WHERE id_envivo = ${id_envivo}
      RETURNING id_envivo, video_url, channel_url, descripcion, activo
    `;

    if (result.length === 0) {
      return res.status(404).send({
        mensaje: "Video no encontrado"
      });
    }


    res.status(203).send({ mensaje: "Video actualizado exitosamente!"})
      
    } catch (error) {

        res.status(500).send({ mensaje: "Error al actualizar el video: "+" "+error.message})
      
    }


  }

  static async toggleActivoEnvivo(req, res) {
  const { id_envivo } = req.params;
  
  try {
    // Primero desactivar todos los videos
    await sql`UPDATE envivo SET activo = 'N'`;
    
    // Luego activar solo el seleccionado
    const result = await sql`
      UPDATE envivo
      SET activo = 'S'
      WHERE id_envivo = ${id_envivo}
      RETURNING id_envivo, video_url, channel_url, descripcion, activo
    `;

    if (result.length === 0) {
      return res.status(404).send({
        mensaje: "Video no encontrado"
      });
    }

    res.status(200).send({
      mensaje: "Video activado correctamente",
      video: result[0]
    });
    
  } catch (error) {
    console.error('Error en toggleActivoEnvivo:', error);
    res.status(500).send({
      mensaje: "Error al activar el video: " + error.message
    });
  }
}

//Nuestroequipo
//Obtener todos los miembros de la junta directiva
static async obtenerJuntaDirectiva(req, res) {
  try {
    const juntaDirectiva = await sql`
      SELECT id_miembro, nombre, rol 
      FROM junta_directiva 
      WHERE activo = 'S' 
      ORDER BY 
        CASE rol
          WHEN 'Presidente' THEN 1
          WHEN 'Vicepresidente' THEN 2
          WHEN 'Secretaria' THEN 3
          WHEN 'Tesorera' THEN 4
          WHEN 'Fiscal' THEN 5
          WHEN 'Vocal I' THEN 6
          WHEN 'Vocal II' THEN 7
          WHEN 'Vocal III' THEN 8
          ELSE 9
        END
    `;
    
    console.log('Junta directiva obtenida!', juntaDirectiva.length);
    res.status(200).json(juntaDirectiva);
  } catch (error) {
    console.error('Error al obtener junta directiva:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
}

// Agregar nuevo miembro a la junta directiva
static async agregarMiembro(req, res) {
  const { nombre, rol } = req.body;
  
  try {
    // Validaciones
    if (!nombre || !rol) {
      return res.status(400).json({ 
        mensaje: 'El nombre y rol son requeridos' 
      });
    }

    // Verificar si el rol ya existe
    const existing = await sql`
      SELECT id_miembro 
      FROM junta_directiva 
      WHERE rol = ${rol} AND activo = 'S'
    `;

    if (existing.length > 0) {
      return res.status(400).json({ 
        mensaje: `El rol "${rol}" ya está ocupado` 
      });
    }

    // Insertar nuevo miembro
    const result = await sql`
      INSERT INTO junta_directiva (nombre, rol, activo)
      VALUES (${nombre}, ${rol}, 'S')
      RETURNING id_miembro
    `;

    res.status(201).json({
      mensaje: 'Miembro agregado correctamente',
      id_miembro: result[0].id_miembro,
      nombre,
      rol
    });
  } catch (error) {
    console.error('Error al agregar miembro:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
}

// Editar miembro existente
static async editarMiembro(req, res) {
  const { id } = req.params;
  const { nombre, rol } = req.body;

  try {
    // Validaciones
    if (!nombre || !rol) {
      return res.status(400).json({ 
        mensaje: 'El nombre y rol son requeridos' 
      });
    }

    // Verificar si el miembro existe
    const member = await sql`
      SELECT id_miembro 
      FROM junta_directiva 
      WHERE id_miembro = ${id} AND activo = 'S'
    `;

    if (member.length === 0) {
      return res.status(404).json({ 
        mensaje: 'Miembro no encontrado' 
      });
    }

    // Verificar si el rol ya está ocupado por otro miembro
    const existing = await sql`
      SELECT id_miembro 
      FROM junta_directiva 
      WHERE rol = ${rol} AND id_miembro != ${id} AND activo = 'S'
    `;

    if (existing.length > 0) {
      return res.status(400).json({ 
        mensaje: `El rol "${rol}" ya está ocupado por otro miembro` 
      });
    }

    // Actualizar miembro
    const result = await sql`
      UPDATE junta_directiva 
      SET nombre = ${nombre}, rol = ${rol}
      WHERE id_miembro = ${id}
      RETURNING id_miembro, nombre, rol
    `;

    if (result.length === 0) {
      return res.status(404).json({ 
        mensaje: 'Error al actualizar el miembro' 
      });
    }

    res.status(200).json({
      mensaje: 'Miembro actualizado correctamente',
      id_miembro: parseInt(id),
      nombre,
      rol
    });
  } catch (error) {
    console.error('Error al actualizar miembro:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
}

// Eliminar miembro (soft delete)
static async eliminarMiembro(req, res) {
  const { id } = req.params;

  try {
    // Verificar si el miembro existe
    const member = await sql`
      SELECT id_miembro, nombre, rol 
      FROM junta_directiva 
      WHERE id_miembro = ${id} AND activo = 'S'
    `;

    if (member.length === 0) {
      return res.status(404).json({ 
        mensaje: 'Miembro no encontrado' 
      });
    }

    // Soft delete - marcar como inactivo
    await sql`
      UPDATE junta_directiva 
      SET activo = 'N' 
      WHERE id_miembro = ${id}
    `;

    res.status(200).json({
      mensaje: 'Miembro eliminado correctamente',
      miembro_eliminado: member[0]
    });
  } catch (error) {
    console.error('Error al eliminar miembro:', error);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor',
      error: error.message 
    });
  }
}

static async obtenerusuarios(req, res) {
   
    try {
       const usuarios = await sql`
      SELECT id, nombre, email, rol 
      FROM USUARIOS
    `;

        console.log('Usuarios cargados!', usuarios.length)
        res.status(203).json( usuarios); //envia el arreglo de los videos cargados en un json
      
    } catch (err) {
      res.status(500).send({ mensaje: "Error al cargar los usuarios: " ,error: err.message });
    }
  }

  static async setrol(req, res) {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    const result = await sql`
      UPDATE USUARIOS SET rol = ${rol} WHERE id = ${id}
    `;

    res.status(203).send({ mensaje: "Rol actualizado correctamente!" });
  } catch (err) {
    res.status(500).send({ mensaje: "Error al setear el rol", error: err.message });
  }
}

static async obtenerUid(req, res) {
  try {
    const uid = req.uid; // <- lo inyecta tu middleware de auth
    if (!uid) {
      return res.status(401).json({ error: "No autenticado" });
    }
    return res.status(200).json({ id: uid });
  } catch (error) {
    console.error("Error en obtenerUid:", error);
    return res.status(500).json({ mensaje: "Error al obtener id de usuario" });
  }
}



}
export default AuthController;
