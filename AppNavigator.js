import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegistroScreen from './screens/RegistroScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import PedidoScreen from './screens/PedidoScreen';
import ConfirmacionScreen from './screens/ConfirmacionScreen';
import RegistroPupuseriaScreen from './screens/RegistroPupuseriaScreen';
import PanelPupuseriaScreen from './screens/PanelPupuseriaScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const [usuario, setUsuario] = useState(undefined);
    const [esDueno, setEsDueno] = useState(false);
    const [nombrePupuseria, setNombrePupuseria] = useState('');
    const [mostrarSplash, setMostrarSplash] = useState(true);
    const [verificando, setVerificando] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMostrarSplash(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const unsuscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Hay sesión — verificar si es dueño de pupusería
                setVerificando(true);
                try {
                    const q = query(
                        collection(db, 'pupuserias'),
                        where('dueno_uid', '==', user.uid)
                    );
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        // Es dueño — guardar nombre de su pupusería
                        setEsDueno(true);
                        setNombrePupuseria(snapshot.docs[0].data().nombre);
                    } else {
                        setEsDueno(false);
                    }
                } catch (error) {
                    setEsDueno(false);
                }
                setVerificando(false);
            } else {
                setEsDueno(false);
            }
            setUsuario(user);
        });
        return unsuscribe;
    }, []);

    // Mostrar splash o spinner mientras verifica
    if (mostrarSplash || usuario === undefined || verificando) {
        return (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#E8210A' }}>
                <SplashScreen />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {usuario ? (
                    <>
                        {esDueno ? (
                            // Es dueño — su pantalla inicial es el panel
                            <>
                                <Stack.Screen
                                    name='PanelPupuseria'
                                    component={PanelPupuseriaScreen}
                                    initialParams={{ nombre: nombrePupuseria }}
                                />
                            </>
                        ) : (
                            // Es cliente — su pantalla inicial es Home
                            <>
                                <Stack.Screen name='Home' component={HomeScreen} />
                                <Stack.Screen name='Mapa' component={MapScreen} />
                                <Stack.Screen name='Pedido' component={PedidoScreen} />
                                <Stack.Screen name='Confirmacion' component={ConfirmacionScreen} />
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Stack.Screen name='Login' component={LoginScreen} />
                        <Stack.Screen name='Splash' component={SplashScreen} />
                        <Stack.Screen name='Registro' component={RegistroScreen} />
                        <Stack.Screen name='RegistroPupuseria' component={RegistroPupuseriaScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}