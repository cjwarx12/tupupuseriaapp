import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, telefonoACorreo } from '../firebaseConfig';

export default function RegistroScreen({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [cargando, setCargando] = useState(false);

const registrar = async () => {
        if (!nombre || !telefono || !contrasena) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
        }
        if (telefono.length !== 8) {
        Alert.alert('Error', 'El número debe tener 8 dígitos');
        return;
        }
        if (contrasena.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
        }
        setCargando(true);
        try {
        const correo = telefonoACorreo(telefono);
        await createUserWithEmailAndPassword(auth, correo, contrasena);
        Alert.alert('¡Listo!', 'Cuenta creada exitosamente');
        } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            Alert.alert('Error', 'Este número ya tiene una cuenta');
        } else {
            Alert.alert('Error', 'No se pudo crear la cuenta');
        }
        }
    setCargando(false);
};

return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.emoji}>🫓</Text>
                <Text style={styles.titulo}>Crear cuenta</Text>
                <Text style={styles.subtitulo}>Regístrate para hacer pedidos</Text>
            </View>
            <View style={styles.formulario}>
                <TextInput style={styles.input} placeholder='Tu nombre completo'
                placeholderTextColor='#9A8A80' value={nombre} onChangeText={setNombre} />
                <TextInput style={styles.input} placeholder='Número de teléfono'
                placeholderTextColor='#9A8A80' keyboardType='phone-pad' maxLength={8}
                value={telefono} onChangeText={setTelefono} />
                <TextInput style={styles.input} placeholder='Contraseña'
                placeholderTextColor='#9A8A80' secureTextEntry
                value={contrasena} onChangeText={setContrasena} />
            </View>
            <TouchableOpacity style={styles.botonPrincipal} onPress={registrar} disabled={cargando}>
                <Text style={styles.botonPrincipalTexto}>
                {cargando ? 'Creando cuenta...' : 'Crear mi cuenta'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkTexto}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#FFF8F2', padding:24, justifyContent:'center' },
    header: { alignItems:'center', marginBottom:32 },
    emoji: { fontSize:60, marginBottom:12 },
    titulo: { fontSize:28, fontWeight:'bold', color:'#1A0F08', marginBottom:6 },
    subtitulo: { fontSize:15, color:'#6B5E57' },
    formulario: { gap:12, marginBottom:20 },
    input: { backgroundColor:'#FFFFFF', borderWidth:1.5, borderColor:'#E8D5C4',
        borderRadius:12, padding:14, fontSize:15, color:'#1A0F08' },
    botonPrincipal: { backgroundColor:'#E8210A', borderRadius:12, padding:16,
        alignItems:'center', marginBottom:16 },
    botonPrincipalTexto: { color:'#FFFFFF', fontSize:16, fontWeight:'bold' },
    linkTexto: { color:'#E8210A', textAlign:'center', fontSize:14 },
});