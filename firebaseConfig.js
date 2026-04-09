import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyCVfqknqkV0z_Pls3EkAwaytPIl5Z6ZBUk",
    authDomain: "tupupuseriaapp.firebaseapp.com",
    projectId: "tupupuseriaapp",
    storageBucket: "tupupuseriaapp.firebasestorage.app",
    messagingSenderId: "23479847487",
    appId: "1:23479847487:android:e6b9e0c629cb4ae02d868a"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export const telefonoACorreo = (telefono) => `${telefono}@tupupuseriaapp.com`;