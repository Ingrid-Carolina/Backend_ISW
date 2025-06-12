import axios from "axios";

class AuthController {


    async login(req, res) {
        //Logica para procesar el login

        //recibir los datos
        const userEmail = req.body.email;
        const userPass = req.body.password;

        //validar rapidamente
        if (!userEmail || !userPass)
            return res.status(400).json({ error: 'Faltan campos de email o password' });

        try {


            const response = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
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
            }*/

            //Si todo sale bien
           
        } catch (e) {
            res.status(500).json({ error: `Ocurrio un error ${e}` });
        }

    }
}

export default AuthController;