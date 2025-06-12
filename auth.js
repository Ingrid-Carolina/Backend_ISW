
import { initializeApp } from "firebase/app"; //inicializamos sesion en firebase(para login, singin o sign up)
import { getAuth,createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification} from "firebase/auth";
import express from 'express';
const router= express.Router();
//import sql from './postgre.js';
import {CreateUserValidator,SignInValidator} from "./validaciones/Validators.js";
import { sql } from "./postgre.js";


const firebaseConfig = {
  apiKey: "AIzaSyDP3_xeF1iE-94f_1bUWwddfud9GLo0qqM",
  authDomain: "proyecto-isw1.firebaseapp.com",
  projectId: "proyecto-isw1",
  storageBucket: "proyecto-isw1.firebasestorage.app",
  messagingSenderId: "174582526082",
  appId: "1:174582526082:web:4e35f62afbdcb595d8849b"
};


const app = initializeApp(firebaseConfig);
const auth= getAuth(app);

console.log("Conectado a firebase!");

//Funcion para Crear Usuario en Firebase

        


router.post('/signup', CreateUserValidator, async (req, res) => {
    const { email, password, nombre } = req.body;
    
    try {
        const result = await sql`SELECT validar_usuario( ${email}, ${password})`;

        if (result[0].validar_usuario) { // Extrae el boolean del arreglo del resultado
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredentials.user;
            const uid= userCredentials.user.uid;

            await sendEmailVerification(user);

            const userdata = {
            id: uid,
            nombre: nombre,
            email: email,
            password: password
                    };

            await sql `INSERT INTO Usuarios ${sql(userdata)} `;

            res.status(203).send({
                mensaje: "Su usuario fue creado correctamente",
            });
        } else {
            res.status(400).send({
                mensaje: "Error: Email o contraseña ya existen en la base de datos",
            });
        }
    } catch (err) {
        console.error('Error al crear el usuario:', err);
        res.status(500).send('Error al crear el usuario: ' + err.message);
    }
});

//Funcion para Usuario que cierre sesion en Firebase
router.post('/signout',async (req, res) => {

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
        console.error('Error al cerrar sesion:', err);
        res.status(500).send('Error al crear el usuario: ' + err.message);
    }
});


//Funcion para Iniciar Sesion con Credenciales del Usuario ya creadas y autenticadas en su correo Electronico

router.post('/signin', SignInValidator,async (req, res) => {
    const { email, password } = req.body;

     const user = auth.currentUser;

    if (user) {
        res.status(401).send( {mensaje:"Ya hay cuenta iniciada" + user.email});
        return;
    }


    try {
        const userCredentials = await signInWithEmailAndPassword(auth, email, password);
    

            res.status(203).send({
                 mensaje: "Sesion iniciada correctamente",});
    
    } catch (err) {
        console.error('Error al crear el usuario:', err);
        res.status(500).send('Error al crear el usuario: ' + err.message);
    }
});

export default router;




