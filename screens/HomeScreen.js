import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function HomeScreen({ navigation }) {
    const [pedidoActivo, setPedidoActivo] = useState(null);

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // ── Escuchar en tiempo real si el cliente tiene un pedido activo ──
        const qPedido = query(
            collection(db, 'pedidos'),
            where('cliente_uid', '==', uid),
            where('estado', 'in', ['pendiente', 'listo'])
        );

        const unsub = onSnapshot(qPedido, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setPedidoActivo({ id: doc.id, ...doc.data() });
            } else {
                setPedidoActivo(null);
            }
        });

        return () => unsub();
    }, []);

    const cerrarSesion = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.log('Error cerrando sesión:', error);
        }
    };

    const verPedidoActivo = () => {
        if (!pedidoActivo) return;
        navigation.navigate('Confirmacion', {
            pupuseria: {
                nombre: pedidoActivo.pupuseria_nombre,
                direccion: pedidoActivo.pupuseria_direccion || '',
            },
            total: pedidoActivo.total,
            totalPrecio: pedidoActivo.total_precio,
            numeroPedido: pedidoActivo.numero_pedido,
            detalle: pedidoActivo.detalle,
        });
    };

    const esListo = pedidoActivo?.estado === 'listo';

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/logo-tupupuseria-final-perfecto.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.titulo}>
                <Text style={styles.tituloOscuro}>TuPupuseria</Text>
                <Text style={styles.tituloDorado}>App</Text>
            </Text>
            <Text style={styles.subtitulo}>¿Qué pupuserías hay cerca de ti?</Text>

            {/* ── Botón pedido activo — solo aparece si hay uno ── */}
            {pedidoActivo && (
                <TouchableOpacity
                    style={[styles.botonPedidoActivo, esListo && styles.botonPedidoListo]}
                    onPress={verPedidoActivo}
                >
                    <Text style={styles.botonPedidoActivoTexto}>
                        {esListo
                            ? '🎉 ¡Tu pedido está listo! Recógelo'
                            : '🫓 Ver mi pedido activo'}
                    </Text>
                </TouchableOpacity>
            )}

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
    container: {
        flex: 1,
        backgroundColor: '#FDF6EE',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    logo: {
        width: 160,
        height: 160,
        marginBottom: 12,
    },
    titulo: {
        fontSize: 28,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    tituloOscuro: {
        color: '#2D1200',
        fontWeight: '900',
    },
    tituloDorado: {
        color: '#D4850A',
        fontWeight: '900',
    },
    subtitulo: {
        fontSize: 15,
        color: '#7A5C3A',
        textAlign: 'center',
        marginBottom: 40,
    },
    botonPedidoActivo: {
        backgroundColor: '#1C0A00',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#D4850A',
    },
    botonPedidoListo: {
        backgroundColor: '#0A2A14',
        borderColor: '#16A34A',
    },
    botonPedidoActivoTexto: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    botonPrincipal: {
        backgroundColor: '#D4850A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
    },
    botonPrincipalTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    botonSecundario: {
        borderWidth: 1.5,
        borderColor: '#D4850A',
        borderRadius: 12,
        padding: 14,
        width: '100%',
        alignItems: 'center',
    },
    botonSecundarioTexto: {
        color: '#D4850A',
        fontSize: 15,
        fontWeight: '700',
    },
});