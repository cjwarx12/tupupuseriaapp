import { useEffect, useState } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, getDocsFromServer, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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
import MiSaldoScreen from './screens/MiSaldoScreen';
import GestionarMenuScreen from './screens/GestionarMenuScreen';

const Stack = createNativeStackNavigator();

// Configuracion de como se muestran las notificaciones cuando la app esta abierta
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Funcion para obtener el token del celular
const obtenerTokenNotificacion = async () => {
    if (!Device.isDevice) return null;

    const { status: statusExistente } = await Notifications.getPermissionsAsync();
    let statusFinal = statusExistente;

    if (statusExistente !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        statusFinal = status;
    }

    if (statusFinal !== 'granted') return null;

    const token = await Notifications.getExpoPushTokenAsync({
        projectId: '0e8bb595-d919-426b-ba18-6d6717627795',
    });

    return token.data;
};

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
                    // Guardar token de notificacion del cliente
                    const token = await obtenerTokenNotificacion();
                    if (token) {
                        const qUsuario = query(
                            collection(db, 'usuarios'),
                            where('uid', '==', user.uid)
                        );
                        const snapshotUsuario = await getDocs(qUsuario);
                        if (!snapshotUsuario.empty) {
                            const docRef = doc(db, 'usuarios', snapshotUsuario.docs[0].id);
                            await updateDoc(docRef, { tokenNotificacion: token });
                        }
                    }

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

                        const qSuscripcion = query(
                            collection(db, 'suscripciones'),
                            where('dueno_uid', '==', user.uid)
                        );
                        const snapshotSuscripcion = await getDocsFromServer(qSuscripcion);

                        if (!snapshotSuscripcion.empty) {
                            const suscripcion = snapshotSuscripcion.docs[0].data();
                            const hoy = new Date();
                            const vencimiento = suscripcion.fecha_vencimiento.toDate();
                            setSuscripcionVencida(vencimiento < hoy);
                        } else {
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

    if (mostrarSplash || usuario === undefined || verificando) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#FDF6EE',
                position: 'absolute',
                top: 0, bottom: 0, left: 0, right: 0
            }}>
                <StatusBar backgroundColor="#FDF6EE" barStyle="dark-content" />
                <SplashScreen />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar backgroundColor="#FDF6EE" barStyle="dark-content" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {usuario ? (
                    <>
                        {esDueno ? (
                            <>
                                {suscripcionVencida ? (
                                    <Stack.Screen
                                        name='SuscripcionVencida'
                                        component={SuscripcionVencidaScreen}
                                        initialParams={{ pupuseriaId }}
                                    />
                                ) : (
                                    <>
                                        <Stack.Screen
                                            name='PanelPupuseria'
                                            component={PanelPupuseriaScreen}
                                            initialParams={{ nombre: nombrePupuseria }}
                                        />
                                        <Stack.Screen name='MiSaldo' component={MiSaldoScreen} />
                                        <Stack.Screen name='GestionarMenu' component={GestionarMenuScreen} />
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <Stack.Screen name='Home' component={HomeScreen} />
                                <Stack.Screen name='Mapa' component={MapScreen} />
                                <Stack.Screen name='Pedido' component={PedidoScreen} />
                                <Stack.Screen name='Confirmacion' component={ConfirmacionScreen} />
                                <Stack.Screen name='RegistroPupuseria' component={RegistroPupuseriaScreen} />
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