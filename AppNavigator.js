import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegistroScreen from './screens/RegistroScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
        <Stack.Navigator initialRouteName='Splash' screenOptions={{ headerShown: false }}>
            <Stack.Screen name='Splash' component={SplashScreen} />
            <Stack.Screen name='Login' component={LoginScreen} />
            <Stack.Screen name='Registro' component={RegistroScreen} />
            <Stack.Screen name='Home' component={HomeScreen} />
            <Stack.Screen name='Mapa' component={MapScreen} />
        </Stack.Navigator>
        </NavigationContainer>
    );
}