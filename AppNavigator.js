import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, getDocsFromServer } from 'firebase/firestore';
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
import SuscripcionVencidaScreen from './screens/SuscripcionVencidaScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const [usuario, setUsuario] = useState(undefined);
    const [esDueno, setEsDueno] = useState(false);
    const [suscripcionVencida, setSuscripcionVencida] = useState(false);
    const [nombrePupuseria, setNombrePupuseria] = useState('');
    const [pupuseriaId, setPupuseriaId] = useState('');
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
                setVerificando(true);
                try {
                    // Paso 1 — verificar si es dueño
                    const qPupuseria = query(
                        collection(db, 'pupuserias'),
                        where('dueno_uid', '==', user.uid)
                    );
                    const snapshotPupuseria = await getDocs(qPupuseria);

                    if (!snapshotPupuseria.empty) {
                        const datosPupuseria = snapshotPupuseria.docs[0].data();
                        const idPupuseria = snapshotPupuseria.docs[0].id;
                        setEsDueno(true);
                        setNombrePupuseria(datosPupuseria.nombre);
                        setPupuseriaId(idPupuseria);

                        // Paso 2 — verificar suscripción directo al servidor (sin caché)
                        const qSuscripcion = query(
                            collection(db, 'suscripciones'),
                            where('dueno_uid', '==', user.uid)
                        );
                        const snapshotSuscripcion = await getDocsFromServer(qSuscripcion);

                        if (!snapshotSuscripcion.empty) {
                            const suscripcion = snapshotSuscripcion.docs[0].data();
                            const hoy = new Date();
                            const vencimiento = suscripcion.fecha_vencimiento.toDate();

                            if (vencimiento < hoy) {
                                // Suscripción vencida — bloquear acceso
                                setSuscripcionVencida(true);
                            } else {
                                // Suscripción vigente — acceso normal
                                setSuscripcionVencida(false);
                            }
                        } else {
                            // No tiene suscripción registrada — bloquear por seguridad
                            setSuscripcionVencida(true);
                        }
                    } else {
                        setEsDueno(false);
                        setSuscripcionVencida(false);
                    }
                } catch (error) {
                    setEsDueno(false);
                    setSuscripcionVencida(false);
                }
                setVerificando(false);
            } else {
                setEsDueno(false);
                setSuscripcionVencida(false);
            }
            setUsuario(user);
        });
        return unsuscribe;
    }, []);

    // Mostrar splash mientras verifica
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
                            <>
                                {suscripcionVencida ? (
                                    // Suscripción vencida — pantalla de bloqueo
                                    <Stack.Screen
                                        name='SuscripcionVencida'
                                        component={SuscripcionVencidaScreen}
                                        initialParams={{ pupuseriaId }}
                                    />
                                ) : (
                                    // Suscripción vigente — panel normal
                                    <Stack.Screen
                                        name='PanelPupuseria'
                                        component={PanelPupuseriaScreen}
                                        initialParams={{ nombre: nombrePupuseria }}
                                    />
                                )}
                            </>
                        ) : (
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