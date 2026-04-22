import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar } from 'react-native';

export default function PedidoListoScreen({ route, navigation }) {
    const { numeroPedido, nombrePupuseria } = route.params || {};
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const numeroPedidoFormateado = '#' + (numeroPedido ?? '??').toString().padStart(2, '0');

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 40,
                friction: 5,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#1C0A00" barStyle="light-content" />

            <Animated.View style={[styles.contenido, { opacity: fadeAnim }]}>

                <Animated.View style={[styles.iconoContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.icono}>🎉</Text>
                </Animated.View>

                <Text style={styles.titulo}>¡Listo para recoger!</Text>
                <Text style={styles.subtitulo}>
                    Tu pedido de{' '}
                    <Text style={styles.subtituloNombre}>{nombrePupuseria ?? 'la pupusería'}</Text>
                    {'\n'}ya está listo.
                </Text>

                <View style={styles.tarjeta}>
                    <Text style={styles.tarjetaLabel}>TU NÚMERO DE PEDIDO</Text>
                    <Text style={styles.tarjetaNumero}>{numeroPedidoFormateado}</Text>
                    <View style={styles.tarjetaDivider} />
                    <Text style={styles.tarjetaMensaje}>Pasa a recogerlo cuando quieras 🫓</Text>
                </View>

                <View style={styles.avisoBox}>
                    <Text style={styles.avisoEmoji}>⏱️</Text>
                    <Text style={styles.avisoTexto}>
                        Los pedidos se guardan por un tiempo limitado.{' '}
                        ¡No tardes mucho!
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.boton}
                    onPress={() => navigation.replace('Home')}
                >
                    <Text style={styles.botonTexto}>Volver al inicio</Text>
                </TouchableOpacity>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C0A00',
        justifyContent: 'center',
    },
    contenido: {
        paddingHorizontal: 24,
        paddingVertical: 40,
        alignItems: 'center',
        gap: 20,
    },
    iconoContainer: {
        backgroundColor: '#2A1200',
        borderRadius: 60,
        width: 110,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#D4850A',
        marginBottom: 8,
    },
    icono: { fontSize: 52 },
    titulo: {
        fontSize: 30,
        fontWeight: '800',
        color: '#D4850A',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subtitulo: {
        fontSize: 16,
        color: '#C4A882',
        textAlign: 'center',
        lineHeight: 24,
    },
    subtituloNombre: {
        fontWeight: '800',
        color: '#FFFFFF',
    },
    tarjeta: {
        backgroundColor: '#2A1200',
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1.5,
        borderColor: '#D4850A',
        gap: 8,
    },
    tarjetaLabel: {
        fontSize: 11,
        color: '#B0956A',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    tarjetaNumero: {
        fontSize: 56,
        fontWeight: '800',
        color: '#D4850A',
        letterSpacing: 2,
    },
    tarjetaDivider: {
        height: 1,
        backgroundColor: '#3A2008',
        width: '100%',
    },
    tarjetaMensaje: {
        fontSize: 14,
        color: '#C4A882',
        textAlign: 'center',
        fontWeight: '600',
    },
    avisoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A1200',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#3A2008',
        gap: 10,
        width: '100%',
    },
    avisoEmoji: { fontSize: 20 },
    avisoTexto: {
        flex: 1,
        fontSize: 12,
        color: '#B0956A',
        lineHeight: 18,
    },
    boton: {
        backgroundColor: '#D4850A',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        width: '100%',
    },
    botonTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});