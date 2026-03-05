import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCVfqknqkV0z_Pls3EkAwaytPIl5Z6ZBUk",
    authDomain: "tupupuseriaapp.firebaseapp.com",
    projectId: "tupupuseriaapp",
    storageBucket: "tupupuseriaapp.firebasestorage.app",
    messagingSenderId: "23479847487",
    appId: "1:23479847487:web:f5f9cd7d3c2ddd132d868a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const telefonoACorreo = (telefono) => `${telefono}@tupupuseriaapp.com`;