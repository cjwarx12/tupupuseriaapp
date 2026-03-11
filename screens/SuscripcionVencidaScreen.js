import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function SuscripcionVencidaScreen() {

    const cerrarSesion = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
        }
    };

    const solicitarRenovacion = () => {
        Alert.alert(
            'Renovar suscripción',
            'Para renovar tu suscripción comunícate con nosotros:\n\nWhatsApp: +503 0000-0000\n\nTu mensualidad es de $1.00 al mes.',
            [{ text: 'Entendido', style: 'default' }]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>

            <View style={styles.iconoContainer}>
                <Text style={styles.icono}>🔒</Text>
            </View>

            <Text style={styles.titulo}>Suscripción vencida</Text>
            <Text style={styles.subtitulo}>
                Tu acceso a TuPupuseriaApp está pausado. Renueva para seguir recibiendo pedidos.
            </Text>

            <View style={styles.tarjeta}>
                <Text style={styles.tarjetaTitulo}>¿Cuánto debo pagar?</Text>

                <View style={styles.fila}>
                    <Text style={styles.filaIcono}>💵</Text>
                    <View style={styles.filaTexto}>
                        <Text style={styles.filaTitle}>Mensualidad</Text>
                        <Text style={styles.filaSub}>$1.00 al mes por tu pupusería</Text>
                    </View>
                </View>

                <View style={styles.separador} />

                <View style={styles.fila}>
                    <Text style={styles.filaIcono}>📲</Text>
                    <View style={styles.filaTexto}>
                        <Text style={styles.filaTitle}>Tus clientes</Text>
                        <Text style={styles.filaSub}>Usan la app completamente gratis</Text>
                    </View>
                </View>

                <View style={styles.separador} />

                <View style={styles.fila}>
                    <Text style={styles.filaIcono}>✅</Text>
                    <View style={styles.filaTexto}>
                        <Text style={styles.filaTitle}>¿Qué incluye?</Text>
                        <Text style={styles.filaSub}>Pedidos en tiempo real, sin límites</Text>
                    </View>
                </View>
            </View>

            <View style={styles.tarjetaAviso}>
                <Text style={styles.avisoTexto}>
                    💡 Con solo $1 al mes tus clientes pueden hacer pedidos desde casa y pasar a recogerlos cuando estén listos.
                </Text>
            </View>

            <TouchableOpacity style={styles.botonRenovar} onPress={solicitarRenovacion}>
                <Text style={styles.botonRenovarTexto}>Renovar suscripción</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonSalir} onPress={cerrarSesion}>
                <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#FFF8F2',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconoContainer: {
        backgroundColor: '#FEE2E2',
        borderRadius: 60,
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    icono: {
        fontSize: 48,
    },
    titulo: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1A0F08',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitulo: {
        fontSize: 15,
        color: '#6B5E57',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    tarjeta: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        borderWidth: 1.5,
        borderColor: '#E8D5C4',
        marginBottom: 16,
    },
    tarjetaTitulo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A0F08',
        marginBottom: 16,
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    filaIcono: {
        fontSize: 24,
        marginRight: 14,
    },
    filaTexto: {
        flex: 1,
    },
    filaTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A0F08',
    },
    filaSub: {
        fontSize: 13,
        color: '#6B5E57',
        marginTop: 2,
    },
    separador: {
        height: 1,
        backgroundColor: '#E8D5C4',
        marginVertical: 4,
    },
    tarjetaAviso: {
        backgroundColor: '#FEF9C3',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    avisoTexto: {
        fontSize: 13,
        color: '#92400E',
        lineHeight: 20,
        textAlign: 'center',
    },
    botonRenovar: {
        backgroundColor: '#E8210A',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    botonRenovarTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    botonSalir: {
        borderRadius: 12,
        padding: 16,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E8D5C4',
    },
    botonSalirTexto: {
        color: '#6B5E57',
        fontSize: 15,
        fontWeight: '600',
    },
});