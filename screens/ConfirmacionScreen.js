import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView } from 'react-native';

export default function ConfirmacionScreen({ route, navigation }) {
    const { pupuseria, total, totalPrecio, numeroPedido } = route.params;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    const numeroPedidoFormateado = '#' + numeroPedido.toString().padStart(2, '0');

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>

            {/* Ícono + títulos */}
            <View style={styles.topSection}>
                <Animated.View style={[styles.iconoContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.icono}>✅</Text>
                </Animated.View>
                <Text style={styles.titulo}>¡Pedido enviado!</Text>
                <Text style={styles.subtitulo}>
                    Tu pedido fue recibido por{' '}
                    <Text style={styles.subtituloNombre}>{pupuseria.nombre}</Text>
                </Text>
            </View>

            {/* Tarjeta número de pedido */}
            <View style={styles.tarjetaPedido}>
                <Text style={styles.tarjetaPedidoLabel}>Tu número de pedido</Text>
                <Text style={styles.tarjetaPedidoNumero}>{numeroPedidoFormateado}</Text>
                <View style={styles.tarjetaPedidoDivider} />
                <View style={styles.tarjetaPedidoFila}>
                    <Text style={styles.tarjetaPedidoSub}>🕐 Esperando confirmación...</Text>
                    <Text style={styles.tarjetaPedidoSub}>⏱ 15–20 min</Text>
                </View>
            </View>

            {/* Resumen compacto */}
            <View style={styles.tarjetaResumen}>
                <View style={styles.resumenFila}>
                    <Text style={styles.resumenLabel}>Pupusería</Text>
                    <Text style={styles.resumenValor}>{pupuseria.nombre}</Text>
                </View>
                <View style={styles.resumenSeparador} />
                <View style={styles.resumenFila}>
                    <Text style={styles.resumenLabel}>Dirección</Text>
                    <Text style={styles.resumenValor}>{pupuseria.direccion}</Text>
                </View>
                <View style={styles.resumenSeparador} />
                <View style={styles.resumenFila}>
                    <Text style={styles.resumenLabel}>{total} productos</Text>
                    <Text style={styles.resumenTotal}>${totalPrecio ? totalPrecio.toFixed(2) : '—'}</Text>
                </View>
            </View>

            {/* Aviso + botón */}
            <View style={styles.bottomSection}>
                <View style={styles.avisoBox}>
                    <Text style={styles.avisoEmoji}>🔔</Text>
                    <Text style={styles.avisoTexto}>Te avisamos cuando esté listo para recoger</Text>
                </View>

                <TouchableOpacity
                    style={styles.botonVolver}
                    onPress={() => navigation.replace('Home')}
                >
                    <Text style={styles.botonVolverTexto}>Volver al inicio</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F2',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 24,
        justifyContent: 'space-between',
    },

    topSection: { alignItems: 'center' },
    iconoContainer: {
        backgroundColor: '#DCFCE7',
        borderRadius: 50,
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    icono: { fontSize: 38 },
    titulo: { fontSize: 24, fontWeight: '800', color: '#1A0F08', marginBottom: 6 },
    subtitulo: { fontSize: 14, color: '#6B5E57', textAlign: 'center' },
    subtituloNombre: { fontWeight: '800', color: '#1A0F08' },

    tarjetaPedido: {
        backgroundColor: '#1A0F08',
        borderRadius: 18,
        padding: 18,
        alignItems: 'center',
    },
    tarjetaPedidoLabel: {
        fontSize: 11,
        color: '#9A8A80',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    tarjetaPedidoNumero: {
        fontSize: 56,
        fontWeight: '800',
        color: '#E8780A',
        letterSpacing: 2,
        marginBottom: 12,
    },
    tarjetaPedidoDivider: {
        height: 1,
        backgroundColor: '#2A1F18',
        width: '100%',
        marginBottom: 10,
    },
    tarjetaPedidoFila: {
        flexDirection: 'row',
        gap: 20,
    },
    tarjetaPedidoSub: { fontSize: 12, color: '#9A8A80' },

    tarjetaResumen: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E8D5C4',
    },
    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    resumenLabel: { fontSize: 13, color: '#6B5E57' },
    resumenValor: { fontSize: 13, fontWeight: '600', color: '#1A0F08', flex: 1, textAlign: 'right' },
    resumenTotal: { fontSize: 15, fontWeight: '800', color: '#E8210A' },
    resumenSeparador: { height: 1, backgroundColor: '#E8D5C4' },

    bottomSection: { gap: 12 },
    avisoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF9C3',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 10,
    },
    avisoEmoji: { fontSize: 20 },
    avisoTexto: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

    botonVolver: {
        backgroundColor: '#E8210A',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
    },
    botonVolverTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});