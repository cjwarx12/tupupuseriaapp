import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
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
    const [mostrarSplash, setMostrarSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMostrarSplash(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const unsuscribe = onAuthStateChanged(auth, (user) => {
            setUsuario(user);
        });
        return unsuscribe;
    }, []);

    if (mostrarSplash || usuario === undefined) {
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
                        <Stack.Screen name='Home' component={HomeScreen} />
                        <Stack.Screen name='Mapa' component={MapScreen} />
                        <Stack.Screen name='Pedido' component={PedidoScreen} />
                        <Stack.Screen name='Confirmacion' component={ConfirmacionScreen} />
                        <Stack.Screen name='PanelPupuseria' component={PanelPupuseriaScreen} />
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