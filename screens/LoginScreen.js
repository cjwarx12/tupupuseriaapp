import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';

export default function LoginScreen() {
    return (
        <View style={styles.container}>

        {/* Logo y titulo */}
        <View style={styles.header}>
            <Text style={styles.emoji}>🫓</Text>
            <Text style={styles.titulo}>Bienvenido</Text>
            <Text style={styles.subtitulo}>Ingresa para hacer tu pedido</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formulario}>
            <TextInput
                style={styles.input}
                placeholder="📧  Correo electrónico"
                placeholderTextColor="#9A8A80"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="🔒  Contraseña"
                placeholderTextColor="#9A8A80"
                secureTextEntry={true}
            />

            <TouchableOpacity style={styles.botonPrincipal}>
            <Text style={styles.botonPrincipalTexto}>Ingresar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonSecundario}>
            <Text style={styles.botonSecundarioTexto}>Crear cuenta nueva</Text>
            </TouchableOpacity>

            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>

            <Text style={styles.negocioLink}>
            ¿Eres dueño de pupusería?{'\n'}
            <Text style={styles.negocioLinkRojo}>Registra tu negocio aquí</Text>
            </Text>
        </View>

    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF6EC',
    },
    header: {
        backgroundColor: '#E8210A',
        paddingTop: 80,
        paddingBottom: 40,
        alignItems: 'center',
    },
    emoji: {
        fontSize: 60,
        marginBottom: 12,
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    subtitulo: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    formulario: {
        padding: 28,
        flex: 1,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E8D5C4',
        borderRadius: 10,
        padding: 14,
        fontSize: 14,
        color: '#1A0F08',
        marginBottom: 14,
    },
    botonPrincipal: {
        backgroundColor: '#E8210A',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 10,
    },
    botonPrincipalTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    botonSecundario: {
        borderWidth: 1.5,
        borderColor: '#E8210A',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    botonSecundarioTexto: {
        color: '#E8210A',
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        color: '#E8210A',
        textAlign: 'center',
        fontSize: 13,
        marginBottom: 24,
    },
    negocioLink: {
        textAlign: 'center',
        fontSize: 12,
        color: '#6B5E57',
        lineHeight: 20,
    },
    negocioLinkRojo: {
        color: '#E8210A',
        fontWeight: '600',
    },
});