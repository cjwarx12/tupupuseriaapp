import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
            <Text style={styles.emoji}>🫓</Text>
            <Text style={styles.titulo}>TuPupuseriaApp</Text>
            <Text style={styles.subtitulo}>¿Qué pupuserías hay cerca de ti?</Text>
            <TouchableOpacity style={styles.botonPrincipal}
                onPress={() => navigation.navigate('Mapa')}>
                <Text style={styles.botonPrincipalTexto}>🗺️ Ver pupuserías cercanas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botonSecundario} onPress={cerrarSesion}>
                <Text style={styles.botonSecundarioTexto}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#FFF8F2', alignItems:'center',
        justifyContent:'center', padding:24 },
    emoji: { fontSize:80, marginBottom:20 },
    titulo: { fontSize:28, fontWeight:'bold', color:'#1A0F08', marginBottom:8 },
    subtitulo: { fontSize:15, color:'#6B5E57', textAlign:'center', marginBottom:40 },
    botonPrincipal: { backgroundColor:'#E8210A', borderRadius:12, padding:16,
        paddingHorizontal:32, marginBottom:12, width:'100%', alignItems:'center' },
    botonPrincipalTexto: { color:'#FFFFFF', fontSize:16, fontWeight:'bold' },
    botonSecundario: { borderWidth:1.5, borderColor:'#E8210A', borderRadius:12,
        padding:14, paddingHorizontal:32, width:'100%', alignItems:'center' },
    botonSecundarioTexto: { color:'#E8210A', fontSize:15, fontWeight:'bold' },
});