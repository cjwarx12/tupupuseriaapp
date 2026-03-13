import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function HomeScreen({ navigation }) {

    const cerrarSesion = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.log('Error cerrando sesión:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/logo-tupupuseria-final-perfecto.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.titulo}>
                <Text style={styles.tituloOscuro}>TuPupuseria</Text>
                <Text style={styles.tituloDorado}>App</Text>
            </Text>
            <Text style={styles.subtitulo}>¿Qué pupuserías hay cerca de ti?</Text>

            <TouchableOpacity style={styles.botonPrincipal}
                onPress={() => navigation.navigate('Mapa')}>
                <Text style={styles.botonPrincipalTexto}>🗺️ Ver pupuserías cercanas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonNegocio}
                onPress={() => navigation.navigate('RegistroPupuseria')}>
                <Text style={styles.botonNegocioTexto}>🫓 ¿Tienes una pupusería? Regístrala</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonSecundario} onPress={cerrarSesion}>
                <Text style={styles.botonSecundarioTexto}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF6EE',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    logo: {
        width: 160,
        height: 160,
        marginBottom: 12,
    },
    titulo: {
        fontSize: 28,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    tituloOscuro: {
        color: '#2D1200',
        fontWeight: '900',
    },
    tituloDorado: {
        color: '#D4850A',
        fontWeight: '900',
    },
    subtitulo: {
        fontSize: 15,
        color: '#7A5C3A',
        textAlign: 'center',
        marginBottom: 40,
    },
    botonPrincipal: {
        backgroundColor: '#D4850A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
    },
    botonPrincipalTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    botonNegocio: {
        backgroundColor: '#FFFAF3',
        borderWidth: 1.5,
        borderColor: '#E8D5B7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
    },
    botonNegocioTexto: {
        color: '#2D1200',
        fontSize: 15,
        fontWeight: '600',
    },
    botonSecundario: {
        borderWidth: 1.5,
        borderColor: '#D4850A',
        borderRadius: 12,
        padding: 14,
        width: '100%',
        alignItems: 'center',
    },
    botonSecundarioTexto: {
        color: '#D4850A',
        fontSize: 15,
        fontWeight: '700',
    },
});