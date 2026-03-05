import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, telefonoACorreo } from '../firebaseConfig';

export default function LoginScreen({ navigation }) {
    const [telefono, setTelefono] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [cargando, setCargando] = useState(false);

const ingresar = async () => {
        if (!telefono || !contrasena) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
        }
        setCargando(true);
        try {
        const correo = telefonoACorreo(telefono);
        await signInWithEmailAndPassword(auth, correo, contrasena);
        navigation.replace('Home');
        } catch (error) {
        Alert.alert('Error', 'Número o contraseña incorrectos');
        }
        setCargando(false);
};

    return (
        <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.emoji}>🫓</Text>
            <Text style={styles.titulo}>Bienvenido</Text>
            <Text style={styles.subtitulo}>Las mejores pupuserías cerca de ti</Text>
        </View>
        <View style={styles.formulario}>
            <TextInput style={styles.input} placeholder='Número de teléfono'
            placeholderTextColor='#9A8A80' keyboardType='phone-pad' maxLength={8}
            value={telefono} onChangeText={setTelefono} />
            <TextInput style={styles.input} placeholder='Contraseña'
            placeholderTextColor='#9A8A80' secureTextEntry
            value={contrasena} onChangeText={setContrasena} />
        </View>
        <TouchableOpacity style={styles.botonPrincipal} onPress={ingresar} disabled={cargando}>
            <Text style={styles.botonPrincipalTexto}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
            </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonSecundario}
            onPress={() => navigation.navigate('Registro')}>
            <Text style={styles.botonSecundarioTexto}>Crear cuenta nueva</Text>
        </TouchableOpacity>
        <TouchableOpacity>
            <Text style={styles.linkTexto}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#FFF8F2', padding:24, justifyContent:'center' },
    header: { alignItems:'center', marginBottom:32 },
    emoji: { fontSize:60, marginBottom:12 },
    titulo: { fontSize:28, fontWeight:'bold', color:'#1A0F08', marginBottom:6 },
    subtitulo: { fontSize:15, color:'#6B5E57', textAlign:'center' },
    formulario: { gap:12, marginBottom:20 },
    input: { backgroundColor:'#FFFFFF', borderWidth:1.5, borderColor:'#E8D5C4',
        borderRadius:12, padding:14, fontSize:15, color:'#1A0F08' },
    botonPrincipal: { backgroundColor:'#E8210A', borderRadius:12, padding:16,
        alignItems:'center', marginBottom:12 },
    botonPrincipalTexto: { color:'#FFFFFF', fontSize:16, fontWeight:'bold' },
    botonSecundario: { borderWidth:1.5, borderColor:'#E8210A', borderRadius:12,
        padding:16, alignItems:'center', marginBottom:16 },
    botonSecundarioTexto: { color:'#E8210A', fontSize:16, fontWeight:'bold' },
    linkTexto: { color:'#6B5E57', textAlign:'center', fontSize:14 },
});