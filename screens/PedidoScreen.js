import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { collection, addDoc, serverTimestamp, doc, getDoc, getCountFromServer, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function PedidoScreen({ route, navigation }) {
    const { pupuseria } = route.params;
    const [menu, setMenu] = useState([]);
    const [cantidades, setCantidades] = useState({});
    const [cargando, setCargando] = useState(false);
    const [cargandoMenu, setCargandoMenu] = useState(true);

    useEffect(() => {
        cargarMenu();
    }, []);

    const cargarMenu = async () => {
        try {
            const docRef = doc(db, 'pupuserias', pupuseria.id);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                const datos = snapshot.data();
                setMenu(datos.menu || []);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo cargar el menú.');
        }
        setCargandoMenu(false);
    };

    const cambiarCantidad = (id, delta) => {
        setCantidades(prev => {
            const actual = prev[id] || 0;
            const nueva = Math.max(0, actual + delta);
            return { ...prev, [id]: nueva };
        });
    };

    const totalItems = Object.values(cantidades).reduce((a, b) => a + b, 0);

    const totalPrecio = menu
        .filter(item => cantidades[item.id] > 0)
        .reduce((acc, item) => acc + (item.precio * (cantidades[item.id] || 0)), 0);

    const confirmarPedido = async () => {
        if (totalItems === 0) {
            Alert.alert('Error', 'Selecciona al menos un producto');
            return;
        }
        setCargando(true);
        try {
            // Contar pedidos previos de esta pupusería para número correlativo
            const qConteo = query(
                collection(db, 'pedidos'),
                where('pupuseria_id', '==', pupuseria.id)
            );
            const conteoSnap = await getCountFromServer(qConteo);
            const numeroPedido = conteoSnap.data().count + 1;

            const detalle = menu
                .filter(item => cantidades[item.id] > 0)
                .map(item => ({
                    tipo: item.nombre,
                    cantidad: cantidades[item.id],
                    precio: item.precio,
                }));

            await addDoc(collection(db, 'pedidos'), {
                cliente_uid: auth.currentUser.uid,
                pupuseria_id: pupuseria.id,
                pupuseria_nombre: pupuseria.nombre,
                detalle,
                total: totalItems,
                total_precio: parseFloat(totalPrecio.toFixed(2)),
                numero_pedido: numeroPedido,
                estado: 'pendiente',
                fecha: serverTimestamp(),
            });

            navigation.replace('Confirmacion', {
                pupuseria,
                total: totalItems,
                totalPrecio: parseFloat(totalPrecio.toFixed(2)),
                numeroPedido,
            });
        } catch (error) {
            Alert.alert('Error', 'No se pudo enviar el pedido');
        }
        setCargando(false);
    };

    if (cargandoMenu) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator size="large" color="#E8210A" />
                <Text style={styles.cargandoTexto}>Cargando menú...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← Regresar</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>{pupuseria.nombre}</Text>
                <Text style={styles.subtitulo}>{pupuseria.direccion}</Text>
            </View>

            {menu.length === 0 ? (
                <View style={styles.vacioCentro}>
                    <Text style={styles.vacioEmoji}>🫓</Text>
                    <Text style={styles.vacioTexto}>Sin menú disponible</Text>
                    <Text style={styles.vacioSub}>Esta pupusería aún no ha configurado su menú.</Text>
                </View>
            ) : (
                <>
                    {menu.filter(i => i.categoria === 'pupusa').length > 0 && (
                        <>
                            <Text style={styles.seccion}>🫓 Pupusas</Text>
                            {menu.filter(i => i.categoria === 'pupusa').map(item => (
                                <View key={item.id} style={styles.fila}>
                                    <Text style={styles.tipoEmoji}>{item.emoji}</Text>
                                    <View style={styles.tipoInfo}>
                                        <Text style={styles.tipoNombre}>{item.nombre}</Text>
                                        <Text style={styles.tipoPrecio}>${item.precio.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.contador}>
                                        <TouchableOpacity style={styles.btnContador}
                                            onPress={() => cambiarCantidad(item.id, -1)}>
                                            <Text style={styles.btnContadorTexto}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.cantidad}>{cantidades[item.id] || 0}</Text>
                                        <TouchableOpacity style={styles.btnContador}
                                            onPress={() => cambiarCantidad(item.id, 1)}>
                                            <Text style={styles.btnContadorTexto}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {menu.filter(i => i.categoria === 'refresco').length > 0 && (
                        <>
                            <Text style={styles.seccion}>🥤 Refrescos</Text>
                            {menu.filter(i => i.categoria === 'refresco').map(item => (
                                <View key={item.id} style={styles.fila}>
                                    <Text style={styles.tipoEmoji}>{item.emoji}</Text>
                                    <View style={styles.tipoInfo}>
                                        <Text style={styles.tipoNombre}>{item.nombre}</Text>
                                        <Text style={styles.tipoPrecio}>${item.precio.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.contador}>
                                        <TouchableOpacity style={styles.btnContador}
                                            onPress={() => cambiarCantidad(item.id, -1)}>
                                            <Text style={styles.btnContadorTexto}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.cantidad}>{cantidades[item.id] || 0}</Text>
                                        <TouchableOpacity style={styles.btnContador}
                                            onPress={() => cambiarCantidad(item.id, 1)}>
                                            <Text style={styles.btnContadorTexto}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {menu.filter(i => i.categoria === 'otro').length > 0 && (
                        <>
                            <Text style={styles.seccion}>🍽️ Otros</Text>
                            {menu.filter(i => i.categoria === 'otro').map(item => (
                                <View key={item.id} style={styles.fila}>
                                    <Text style={styles.tipoEmoji}>{item.emoji}</Text>
                                    <View style={styles.tipoInfo}>
                                        <Text style={styles.tipoNombre}>{item.nombre}</Text>
                                        <Text style={styles.tipoPrecio}>${item.precio.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.contador}>
                                        <TouchableOpacity style={styles.btnContador}
                                            onPress={() => cambiarCantidad(item.id, -1)}>
                                            <Text style={styles.btnContadorTexto}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.cantidad}>{cantidades[item.id] || 0}</Text>
                                        <TouchableOpacity style={styles.btnContador}
                                            onPress={() => cambiarCantidad(item.id, 1)}>
                                            <Text style={styles.btnContadorTexto}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    <View style={styles.footer}>
                        <View style={styles.resumen}>
                            <Text style={styles.resumenTexto}>{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</Text>
                            <Text style={styles.resumenPrecio}>${totalPrecio.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.boton, cargando && styles.botonDesactivado]}
                            onPress={confirmarPedido}
                            disabled={cargando}
                        >
                            <Text style={styles.botonTexto}>
                                {cargando ? 'Enviando...' : 'Confirmar pedido'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF8F2' },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F2' },
    cargandoTexto: { marginTop: 12, fontSize: 14, color: '#6B5E57' },

    header: { backgroundColor: '#E8210A', padding: 24, paddingTop: 48 },
    back: { color: '#FFFFFF', fontSize: 14, marginBottom: 12, opacity: 0.85 },
    titulo: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
    subtitulo: { fontSize: 14, color: '#FFFFFF', opacity: 0.85 },

    seccion: {
        fontSize: 16, fontWeight: '800', color: '#1A0F08',
        padding: 20, paddingBottom: 8, paddingTop: 20,
        borderBottomWidth: 1, borderBottomColor: '#E8D5C4',
    },
    fila: {
        flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20,
        backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 8,
        borderRadius: 12, borderWidth: 1, borderColor: '#E8D5C4',
    },
    tipoEmoji: { fontSize: 28, marginRight: 12 },
    tipoInfo: { flex: 1 },
    tipoNombre: { fontSize: 15, fontWeight: '600', color: '#1A0F08' },
    tipoPrecio: { fontSize: 13, color: '#E8210A', fontWeight: '700', marginTop: 2 },

    contador: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    btnContador: {
        backgroundColor: '#E8210A', width: 32, height: 32,
        borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    },
    btnContadorTexto: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    cantidad: { fontSize: 18, fontWeight: 'bold', color: '#1A0F08', minWidth: 24, textAlign: 'center' },

    footer: { padding: 24, gap: 12 },
    resumen: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
        borderWidth: 1.5, borderColor: '#E8D5C4',
    },
    resumenTexto: { fontSize: 15, fontWeight: '600', color: '#1A0F08' },
    resumenPrecio: { fontSize: 20, fontWeight: '800', color: '#E8210A' },

    boton: { backgroundColor: '#E8210A', borderRadius: 12, padding: 16, alignItems: 'center' },
    botonDesactivado: { opacity: 0.6 },
    botonTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

    vacioCentro: { alignItems: 'center', marginTop: 60, padding: 24 },
    vacioEmoji: { fontSize: 48, marginBottom: 16 },
    vacioTexto: { fontSize: 18, fontWeight: '800', color: '#1A0F08', marginBottom: 8 },
    vacioSub: { fontSize: 14, color: '#6B5E57', textAlign: 'center', lineHeight: 20 },
});