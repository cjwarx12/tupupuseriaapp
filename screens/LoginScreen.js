import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, telefonoACorreo } from '../firebaseConfig';

export default function LoginScreen({ navigation }) {
    const [telefono, setTelefono] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [cargando, setCargando] = useState(false);

    const iniciarSesion = async () => {
        if (!telefono.trim() || telefono.length < 8) {
            Alert.alert('Error', 'Ingresa tu número de teléfono de 8 dígitos.');
            return;
        }
        if (!contrasena || contrasena.length < 6) {
            Alert.alert('Error', 'Ingresa tu contraseña.');
            return;
        }
        setCargando(true);
        try {
            const correo = telefonoACorreo(telefono.trim());
            await signInWithEmailAndPassword(auth, correo, contrasena);
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                Alert.alert('Error', 'Teléfono o contraseña incorrectos.');
            } else {
                Alert.alert('Error', 'No se pudo iniciar sesión. Intenta de nuevo.');
            }
        }
        setCargando(false);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo + nombre */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/logo-tupupuseria-final-perfecto.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.nombre}>
                        <Text style={styles.nombreNegro}>TuPupuseria</Text>
                        <Text style={styles.nombreRojo}>App</Text>
                    </Text>
                </View>

                {/* Campos */}
                <View style={styles.grupo}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 71234567"
                        placeholderTextColor="#B0A098"
                        value={telefono}
                        onChangeText={setTelefono}
                        keyboardType="phone-pad"
                        maxLength={8}
                    />
                </View>

                <View style={styles.grupo}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tu contraseña"
                        placeholderTextColor="#B0A098"
                        value={contrasena}
                        onChangeText={setContrasena}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.botonLogin, cargando && styles.botonDesactivado]}
                    onPress={iniciarSesion}
                    disabled={cargando}
                >
                    {cargando ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.botonLoginTexto}>Entrar</Text>
                    )}
                </TouchableOpacity>

                {/* Crear cuenta */}
                <TouchableOpacity
                    style={styles.botonCrear}
                    onPress={() => navigation.navigate('Registro')}
                >
                    <Text style={styles.botonCrearTexto}>Crear cuenta nueva</Text>
                </TouchableOpacity>

                {/* Divider negocio */}
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLinea} />
                    <Text style={styles.dividerTexto}>¿Tienes un negocio?</Text>
                    <View style={styles.dividerLinea} />
                </View>

                {/* Tarjeta registrar pupusería */}
                <TouchableOpacity
                    style={styles.tarjetaPupuseria}
                    onPress={() => navigation.navigate('RegistroPupuseria')}
                >
                    <Image
                        source={require('../assets/logo-tupupuseria-final-perfecto.png')}
                        style={styles.tarjetaLogo}
                        resizeMode="contain"
                    />
                    <View style={styles.tarjetaTextos}>
                        <Text style={styles.tarjetaTitulo}>Registra tu pupusería</Text>
                        <Text style={styles.tarjetaSub}>Empieza a recibir pedidos hoy</Text>
                    </View>
                    <Text style={styles.tarjetaFlecha}>→</Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        paddingTop: 40,
        paddingBottom: 40,
    },

    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 200,
        height: 200,
    },
    nombre: {
        fontSize: 28,
        letterSpacing: -0.5,
        marginTop: 4,
    },
    nombreNegro: {
        color: '#1A0F08',
        fontWeight: '900',
    },
    nombreRojo: {
        color: '#E8210A',
        fontWeight: '900',
    },

    grupo: { marginBottom: 16, width: '100%' },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A0F08',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#1A0F08',
    },

    botonLogin: {
        backgroundColor: '#E8210A',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        width: '100%',
        marginTop: 8,
        marginBottom: 12,
    },
    botonDesactivado: { opacity: 0.6 },
    botonLoginTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    botonCrear: {
        borderWidth: 1.5,
        borderColor: '#E8210A',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    botonCrearTexto: {
        color: '#E8210A',
        fontSize: 15,
        fontWeight: '700',
    },

    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
        gap: 10,
    },
    dividerLinea: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8D5C4',
    },
    dividerTexto: {
        fontSize: 13,
        color: '#6B5E57',
        fontWeight: '500',
    },

    tarjetaPupuseria: {
        backgroundColor: '#1A0F08',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 14,
    },
    tarjetaLogo: {
        width: 44,
        height: 44,
        borderRadius: 10,
    },
    tarjetaTextos: {
        flex: 1,
    },
    tarjetaTitulo: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    tarjetaSub: {
        fontSize: 12,
        color: '#9A8A80',
        marginTop: 2,
    },
    tarjetaFlecha: {
        fontSize: 18,
        color: '#E8210A',
        fontWeight: '800',
    },
});