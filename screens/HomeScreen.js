import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function HomeScreen({ navigation }) {

const cerrarSesion = async () => {
    try {
        await signOut(auth);
        navigation.replace('Login');
    } catch (error) {
        Alert.alert('Error', 'No se pudo cerrar sesión');
    }
};

return (
    <View style={styles.container}>
        <Text style={styles.emoji}>🫓</Text>
        <Text style={styles.titulo}>TuPupuseriaApp</Text>
        <Text style={styles.subtitulo}>¡Bienvenido! Aquí irá el mapa con las pupuserías cercanas.</Text>
        <TouchableOpacity style={styles.boton} onPress={cerrarSesion}>
            <Text style={styles.botonTexto}>Cerrar sesión</Text>
        </TouchableOpacity>
    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#FFF8F2', alignItems:'center',
        justifyContent:'center', padding:24 },
    emoji: { fontSize:80, marginBottom:20 },
    titulo: { fontSize:28, fontWeight:'bold', color:'#1A0F08', marginBottom:12 },
    subtitulo: { fontSize:15, color:'#6B5E57', textAlign:'center', marginBottom:40 },
    boton: { borderWidth:1.5, borderColor:'#E8210A', borderRadius:12,
        padding:14, paddingHorizontal:32 },
    botonTexto: { color:'#E8210A', fontSize:15, fontWeight:'bold' },
});