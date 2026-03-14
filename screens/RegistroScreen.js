import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar, Image } from 'react-native';
import { useState } from 'react';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, telefonoACorreo } from '../firebaseConfig';

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
            // Paso 1 — Crear cuenta en Firebase Auth
            const correo = telefonoACorreo(telefono);
            const credencial = await createUserWithEmailAndPassword(auth, correo, contrasena);
            const uid = credencial.user.uid;

            // Paso 2 — Guardar datos en Firestore con rollback
            try {
                await setDoc(doc(db, 'usuarios', uid), {
                    nombre: nombre.trim(),
                    telefono: telefono.trim(),
                    uid,
                    rol: 'cliente',
                    tokenNotificacion: null,
                    fecha_registro: new Date(),
                });

                // ✅ Todo salió bien
                Alert.alert('¡Listo!', 'Cuenta creada exitosamente');

            } catch (errorFirestore) {
                // ── ROLLBACK: Firestore falló, eliminar cuenta Auth ──
                console.log('Error Firestore, haciendo rollback...', errorFirestore);
                try { await deleteUser(credencial.user); } catch (e) { }

                Alert.alert(
                    'Error al registrar',
                    'Hubo un problema guardando tus datos. Por favor intenta de nuevo.'
                );
            }

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Teléfono ya registrado', 'Este número ya tiene una cuenta. Inicia sesión.');
            } else {
                Alert.alert('Error', 'No se pudo crear la cuenta. Verifica tu conexión.');
            }
        }
        setCargando(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#FDF6EE" barStyle="dark-content" />

            <View style={styles.header}>
                <Image
                    source={require('../assets/logo-tupupuseria-final-perfecto.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.titulo}>Crear cuenta</Text>
                <Text style={styles.subtitulo}>Regístrate para hacer pedidos</Text>
            </View>

            <View style={styles.formulario}>
                <View style={styles.grupo}>
                    <Text style={styles.label}>Nombre completo</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#B0956A"
                        value={nombre}
                        onChangeText={setNombre}
                    />
                </View>

                <View style={styles.grupo}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Número de teléfono"
                        placeholderTextColor="#B0956A"
                        keyboardType="phone-pad"
                        maxLength={8}
                        value={telefono}
                        onChangeText={setTelefono}
                    />
                </View>

                <View style={styles.grupo}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor="#B0956A"
                        secureTextEntry
                        value={contrasena}
                        onChangeText={setContrasena}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.botonPrincipal, cargando && styles.botonDesactivado]}
                onPress={registrar}
                disabled={cargando}
            >
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
    container: {
        flex: 1,
        backgroundColor: '#FDF6EE',
        padding: 28,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 12,
    },
    titulo: {
        fontSize: 26,
        fontWeight: '900',
        color: '#2D1200',
        marginBottom: 6,
    },
    subtitulo: {
        fontSize: 14,
        color: '#7A5C3A',
    },
    formulario: {
        gap: 4,
        marginBottom: 20,
    },
    grupo: {
        marginBottom: 14,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D1200',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#FFFAF3',
        borderWidth: 1.5,
        borderColor: '#E8D5B7',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#2D1200',
    },
    botonPrincipal: {
        backgroundColor: '#D4850A',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    botonDesactivado: {
        opacity: 0.6,
    },
    botonPrincipalTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    linkTexto: {
        color: '#D4850A',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
    },
});
