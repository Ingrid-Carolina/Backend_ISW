import dotenv from 'dotenv';
dotenv.config();
import { initializeApp } from "firebase/app"; //inicializamos sesion en firebase(para login, singin o sign up)
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDP3_xeF1iE-94f_1bUWwddfud9GLo0qqM",
  authDomain: "proyecto-isw1.firebaseapp.com",
  projectId: "proyecto-isw1",
  storageBucket: "proyecto-isw1.firebasestorage.app",
  messagingSenderId: "174582526082",
  appId: "1:174582526082:web:4e35f62afbdcb595d8849b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;

/*import admin from 'firebase-admin'
import serviceAccount from './firebase.json' assert {type: 'json'};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export default admin;*/

