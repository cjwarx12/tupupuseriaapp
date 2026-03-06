import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegistroScreen from './screens/RegistroScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const [usuario, setUsuario] = useState(undefined);

    useEffect(() => {
        const unsuscribe = onAuthStateChanged(auth, (user) => {
            setUsuario(user);
        });
        return unsuscribe;
    }, []);

    if (usuario === undefined) {
        return (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#E8210A' }}>
                <ActivityIndicator size='large' color='#FFFFFF' />
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
                    </>
                ) : (
                    <>
                        <Stack.Screen name='Splash' component={SplashScreen} />
                        <Stack.Screen name='Login' component={LoginScreen} />
                        <Stack.Screen name='Registro' component={RegistroScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}