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

// ── Configurar cómo se muestran las notificaciones cuando la app está abierta ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Obtener token y guardarlo en Firestore en el documento del cliente ──
const guardarTokenCliente = async (uid) => {
  try {
    // Solo funciona en dispositivo físico, no en simulador
    if (!Device.isDevice) return;

    // Pedir permiso para notificaciones
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Si el usuario no dio permiso, salimos sin error
    if (finalStatus !== 'granted') return;

    // Obtener el token — projectId es OBLIGATORIO en Expo SDK 55
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '0e8bb595-d919-426b-ba18-6d6717627795',
    });
    const token = tokenData.data;

    // Buscar el documento del cliente en Firestore y guardar el token
    const qUsuario = query(
      collection(db, 'usuarios'),
      where('uid', '==', uid)
    );
    const snapshot = await getDocs(qUsuario);

    if (!snapshot.empty) {
      const docRef = doc(db, 'usuarios', snapshot.docs[0].id);
      await updateDoc(docRef, { tokenNotificacion: token });
    }

  } catch (error) {
    // Si falla el token, la app sigue funcionando normal
    console.log('Error guardando token:', error);
  }
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
          const qPupuseria = query(
            collection(db, 'pupuserias'),
            where('dueno_uid', '==', user.uid)
          );
          const snapshotPupuseria = await getDocsFromServer(qPupuseria);

          if (!snapshotPupuseria.empty) {
            // ── Es DUEÑO ──
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
            // ── Es CLIENTE — guardar token para recibir notificaciones ──
            setEsDueno(false);
            setSuscripcionVencida(false);
            guardarTokenCliente(user.uid);
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