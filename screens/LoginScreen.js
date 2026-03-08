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
        } catch (error) {
            Alert.alert('Error', 'Número o contraseña incorrectos');
        }
        setCargando(false);
    };

    return (
        <View style={styles.container}>

            {/* SECCIÓN CLIENTES */}
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

            {/* DIVISOR */}
            <View style={styles.divisor}>
                <View style={styles.divisorLinea} />
                <Text style={styles.divisorTexto}>¿Tienes un negocio?</Text>
                <View style={styles.divisorLinea} />
            </View>

            {/* SECCIÓN NEGOCIOS */}
            <TouchableOpacity
                style={styles.botonNegocio}
                onPress={() => navigation.navigate('RegistroPupuseria')}>
                <View style={styles.botonNegocioContenido}>
                    <Text style={styles.botonNegocioEmoji}>🫓</Text>
                    <View>
                        <Text style={styles.botonNegocioTitulo}>Registra tu pupusería</Text>
                        <Text style={styles.botonNegocioSub}>Empieza a recibir pedidos hoy</Text>
                    </View>
                    <Text style={styles.botonNegocioFlecha}>→</Text>
                </View>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#FFF8F2', padding:24, justifyContent:'center' },

    // Clientes
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

    // Divisor
    divisor: { flexDirection:'row', alignItems:'center', gap:12, marginTop:28, marginBottom:20 },
    divisorLinea: { flex:1, height:1, backgroundColor:'#E8D5C4' },
    divisorTexto: { fontSize:13, color:'#6B5E57', fontWeight:'600' },

    // Negocios
    botonNegocio: { backgroundColor:'#1A0F08', borderRadius:16, padding:20 },
    botonNegocioContenido: { flexDirection:'row', alignItems:'center', gap:14 },
    botonNegocioEmoji: { fontSize:32 },
    botonNegocioTitulo: { fontSize:16, fontWeight:'800', color:'#FFFFFF', marginBottom:3 },
    botonNegocioSub: { fontSize:13, color:'#9A8A80' },
    botonNegocioFlecha: { marginLeft:'auto', fontSize:22, color:'#E8210A', fontWeight:'bold' },
});
