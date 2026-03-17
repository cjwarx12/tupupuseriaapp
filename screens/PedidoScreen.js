import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { collection, addDoc, serverTimestamp, doc, getDoc, getCountFromServer, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function PedidoScreen({ route, navigation }) {
    const { pupuseria } = route.params;
    const [menu, setMenu] = useState([]);
    const [cantidades, setCantidades] = useState({});
    const [cargando, setCargando] = useState(false);
    const [cargandoMenu, setCargandoMenu] = useState(true);

    useEffect(() => { cargarMenu(); }, []);

    const cargarMenu = async () => {
        try {
            const docRef = doc(db, 'pupuserias', pupuseria.id);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                setMenu(snapshot.data().menu || []);
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
        if (totalItems === 0) { Alert.alert('Error', 'Selecciona al menos un producto'); return; }
        setCargando(true);
        try {
            const qActivos = query(
                collection(db, 'pedidos'),
                where('pupuseria_id', '==', pupuseria.id),
                where('estado', 'in', ['pendiente', 'listo'])
            );
            const conteoSnap = await getCountFromServer(qActivos);
            const numeroPedido = conteoSnap.data().count + 1;

            const detalle = menu
                .filter(item => cantidades[item.id] > 0)
                .map(item => ({
                    tipo: item.nombre,
                    cantidad: cantidades[item.id],
                    precio: item.precio,
                    masa: item.masa || null,
                    categoria: item.categoria,
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
                detalle,
            });
        } catch (error) {
            Alert.alert('Error', 'No se pudo enviar el pedido');
        }
        setCargando(false);
    };

    if (cargandoMenu) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator size="large" color="#D4850A" />
                <Text style={styles.cargandoTexto}>Cargando menú...</Text>
            </View>
        );
    }

    const pupusas = menu.filter(i => i.categoria === 'pupusa');
    const variedadesMap = {};
    pupusas.forEach(item => {
        if (!variedadesMap[item.nombre]) {
            variedadesMap[item.nombre] = { nombre: item.nombre, emoji: item.emoji, maiz: null, arroz: null };
        }
        if (item.masa === 'arroz') {
            variedadesMap[item.nombre].arroz = item;
        } else {
            variedadesMap[item.nombre].maiz = item;
        }
    });
    const listaVariedades = Object.values(variedadesMap);

    const refrescos = menu.filter(i => i.categoria === 'refresco');
    const otros = menu.filter(i => i.categoria === 'otro');

    const renderContador = (item) => {
        if (!item) {
            return (
                <View style={styles.celdaVacia}>
                    <Text style={styles.celdaVaciaTexto}>—</Text>
                </View>
            );
        }
        return (
            <View style={styles.contadorWrap}>
                <View style={styles.contador}>
                    <TouchableOpacity style={styles.btnContador} onPress={() => cambiarCantidad(item.id, -1)}>
                        <Text style={styles.btnContadorTexto}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.cantidad}>{cantidades[item.id] || 0}</Text>
                    <TouchableOpacity style={styles.btnContador} onPress={() => cambiarCantidad(item.id, 1)}>
                        <Text style={styles.btnContadorTexto}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.tablaPrecio}>${item.precio.toFixed(2)}</Text>
            </View>
        );
    };

    const renderItems = (items) => items.map(item => (
        <View key={item.id} style={styles.fila}>
            <Text style={styles.tipoEmoji}>{item.emoji}</Text>
            <View style={styles.tipoInfo}>
                <Text style={styles.tipoNombre}>{item.nombre}</Text>
                <Text style={styles.tipoPrecio}>${item.precio.toFixed(2)}</Text>
            </View>
            <View style={styles.contador}>
                <TouchableOpacity style={styles.btnContador} onPress={() => cambiarCantidad(item.id, -1)}>
                    <Text style={styles.btnContadorTexto}>−</Text>
                </TouchableOpacity>
                <Text style={styles.cantidad}>{cantidades[item.id] || 0}</Text>
                <TouchableOpacity style={styles.btnContador} onPress={() => cambiarCantidad(item.id, 1)}>
                    <Text style={styles.btnContadorTexto}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    ));

    return (
        <ScrollView style={styles.container}>
            <StatusBar backgroundColor="#1C0A00" barStyle="light-content" />

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
                    {listaVariedades.length > 0 && (
                        <View style={styles.tablaContainer}>
                            <Text style={styles.seccion}>🫓 Pupusas</Text>
                            <View style={styles.tablaHeader}>
                                <Text style={styles.tablaHeaderVariedad}>VARIEDAD</Text>
                                <View style={styles.tablaHeaderMasa}>
                                    <Text style={styles.tablaHeaderTexto}>🌽 MAÍZ</Text>
                                </View>
                                <View style={[styles.tablaHeaderMasa, styles.tablaHeaderUltima]}>
                                    <Text style={styles.tablaHeaderTexto}>🍚 ARROZ</Text>
                                </View>
                            </View>
                            {listaVariedades.map((variedad, index) => (
                                <View
                                    key={variedad.nombre}
                                    style={[
                                        styles.tablaFila,
                                        index % 2 === 0 && styles.tablaFilaPar,
                                        index === listaVariedades.length - 1 && styles.tablaFilaUltima,
                                    ]}
                                >
                                    <View style={styles.tablaColumnaVariedad}>
                                        <Text style={styles.tablaEmoji}>{variedad.emoji}</Text>
                                        <Text style={styles.tablaNombre}>{variedad.nombre}</Text>
                                    </View>
                                    <View style={styles.tablaColumnaMasa}>
                                        {renderContador(variedad.maiz)}
                                    </View>
                                    <View style={[styles.tablaColumnaMasa, styles.tablaColumnaUltima]}>
                                        {renderContador(variedad.arroz)}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {refrescos.length > 0 && (
                        <>
                            <Text style={styles.seccion}>🥤 Refrescos</Text>
                            {renderItems(refrescos)}
                        </>
                    )}

                    {otros.length > 0 && (
                        <>
                            <Text style={styles.seccion}>🍽️ Otros</Text>
                            {renderItems(otros)}
                        </>
                    )}

                    <View style={styles.footer}>
                        <View style={styles.resumen}>
                            <Text style={styles.resumenTexto}>
                                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                            </Text>
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
    container: { flex: 1, backgroundColor: '#FDF6EE' },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6EE' },
    cargandoTexto: { marginTop: 12, fontSize: 14, color: '#7A5C3A' },
    header: { backgroundColor: '#1C0A00', padding: 24, paddingTop: 48 },
    back: { color: '#D4850A', fontSize: 14, marginBottom: 12, fontWeight: '700' },
    titulo: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
    subtitulo: { fontSize: 14, color: '#B0956A' },
    seccion: { fontSize: 15, fontWeight: '800', color: '#2D1200', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
    tablaContainer: { marginHorizontal: 16, marginTop: 4, marginBottom: 8 },
    tablaHeader: {
        flexDirection: 'row', backgroundColor: '#1C0A00',
        borderTopLeftRadius: 12, borderTopRightRadius: 12,
        paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center',
    },
    tablaHeaderVariedad: {
        flex: 1.3, color: '#D4850A', fontSize: 11, fontWeight: '800', letterSpacing: 0.5,
        borderRightWidth: 1, borderRightColor: '#3D2010', paddingRight: 6,
    },
    tablaHeaderMasa: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#3D2010' },
    tablaHeaderUltima: { borderRightWidth: 0 },
    tablaHeaderTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    tablaFila: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFAF3',
        paddingVertical: 12, paddingHorizontal: 10,
        borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#E8D5B7',
    },
    tablaFilaPar: { backgroundColor: '#FDF6EE' },
    tablaFilaUltima: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    tablaColumnaVariedad: {
        flex: 1.3, flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRightWidth: 1, borderRightColor: '#E8D5B7', paddingRight: 8,
    },
    tablaEmoji: { fontSize: 20 },
    tablaNombre: { fontSize: 12, fontWeight: '700', color: '#2D1200', flexShrink: 1 },
    tablaColumnaMasa: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E8D5B7', paddingVertical: 2 },
    tablaColumnaUltima: { borderRightWidth: 0 },
    contadorWrap: { alignItems: 'center', gap: 3 },
    tablaPrecio: { fontSize: 11, color: '#D4850A', fontWeight: '700' },
    contador: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    btnContador: { backgroundColor: '#D4850A', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    btnContadorTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', lineHeight: 20 },
    cantidad: { fontSize: 14, fontWeight: 'bold', color: '#2D1200', minWidth: 18, textAlign: 'center' },
    celdaVacia: { width: 70, height: 26, alignItems: 'center', justifyContent: 'center' },
    celdaVaciaTexto: { fontSize: 16, color: '#D4C4A8', fontWeight: '300' },
    fila: {
        flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20,
        backgroundColor: '#FFFAF3', marginHorizontal: 16, marginTop: 8,
        borderRadius: 12, borderWidth: 1, borderColor: '#E8D5B7',
    },
    tipoEmoji: { fontSize: 28, marginRight: 12 },
    tipoInfo: { flex: 1 },
    tipoNombre: { fontSize: 15, fontWeight: '600', color: '#2D1200' },
    tipoPrecio: { fontSize: 13, color: '#D4850A', fontWeight: '700', marginTop: 2 },
    footer: { padding: 24, gap: 12 },
    resumen: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFAF3', borderRadius: 12, padding: 16,
        borderWidth: 1.5, borderColor: '#E8D5B7',
    },
    resumenTexto: { fontSize: 15, fontWeight: '600', color: '#2D1200' },
    resumenPrecio: { fontSize: 20, fontWeight: '800', color: '#D4850A' },
    boton: { backgroundColor: '#D4850A', borderRadius: 12, padding: 16, alignItems: 'center' },
    botonDesactivado: { opacity: 0.6 },
    botonTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    vacioCentro: { alignItems: 'center', marginTop: 60, padding: 24 },
    vacioEmoji: { fontSize: 48, marginBottom: 16 },
    vacioTexto: { fontSize: 18, fontWeight: '800', color: '#2D1200', marginBottom: 8 },
    vacioSub: { fontSize: 14, color: '#7A5C3A', textAlign: 'center', lineHeight: 20 },
});