import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const CATEGORIAS = [
    { id: 'pupusa', nombre: 'Pupusa', emoji: '🫓' },
    { id: 'refresco', nombre: 'Refresco', emoji: '🥤' },
    { id: 'otro', nombre: 'Otro', emoji: '🍽️' },
];

const MASAS = [
    { id: 'maiz', nombre: 'Maíz', emoji: '🌽' },
    { id: 'arroz', nombre: 'Arroz', emoji: '🍚' },
];

const EMOJIS_PUPUSA = [
    { palabras: ['queso'], emoji: '🧀' },
    { palabras: ['frijol', 'frijoles'], emoji: '🫘' },
    { palabras: ['chicharron', 'chicharrón'], emoji: '🥩' },
    { palabras: ['loroco'], emoji: '🌿' },
    { palabras: ['revuelta', 'revueltas'], emoji: '🌟' },
    { palabras: ['camaron', 'camarón'], emoji: '🦐' },
    { palabras: ['jalapeno', 'jalapeño'], emoji: '🌶️' },
    { palabras: ['ayote'], emoji: '🎃' },
    { palabras: ['espinaca'], emoji: '🥬' },
    { palabras: ['maiz', 'maíz'], emoji: '🌽' },
    { palabras: ['mora'], emoji: '🫐' },
];

const obtenerEmoji = (categoriaId, nombreProducto) => {
    if (categoriaId === 'refresco') return '🥤';
    if (categoriaId === 'otro') return '🍽️';
    const nombreLower = nombreProducto.toLowerCase();
    for (const item of EMOJIS_PUPUSA) {
        if (item.palabras.some(palabra => nombreLower.includes(palabra))) {
            return item.emoji;
        }
    }
    return '🫓';
};

export default function GestionarMenuScreen({ navigation }) {
    const [menu, setMenu] = useState([]);
    const [pupuseriaId, setPupuseriaId] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoPrecio, setNuevoPrecio] = useState('');
    const [nuevaCategoria, setNuevaCategoria] = useState('pupusa');
    const [nuevaMasa, setNuevaMasa] = useState('maiz');

    useEffect(() => { cargarMenu(); }, []);

    const cargarMenu = async () => {
        try {
            const q = query(collection(db, 'pupuserias'), where('dueno_uid', '==', auth.currentUser.uid));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setPupuseriaId(snapshot.docs[0].id);
                setMenu(snapshot.docs[0].data().menu || []);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo cargar el menú.');
        }
        setCargando(false);
    };

    const agregarItem = () => {
        if (!nuevoNombre.trim()) { Alert.alert('Error', 'Escribe el nombre del producto.'); return; }
        if (!nuevoPrecio || isNaN(nuevoPrecio) || parseFloat(nuevoPrecio) <= 0) { Alert.alert('Error', 'Ingresa un precio válido.'); return; }
        const item = {
            id: Date.now().toString(),
            nombre: nuevoNombre.trim(),
            categoria: nuevaCategoria,
            masa: nuevaCategoria === 'pupusa' ? nuevaMasa : null,
            emoji: obtenerEmoji(nuevaCategoria, nuevoNombre.trim()),
            precio: parseFloat(parseFloat(nuevoPrecio).toFixed(2)),
        };
        setMenu(prev => [...prev, item]);
        setNuevoNombre('');
        setNuevoPrecio('');
        setNuevaCategoria('pupusa');
        setNuevaMasa('maiz');
    };

    const eliminarItem = (id) => {
        Alert.alert('Eliminar producto', '¿Seguro que quieres eliminar este producto?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => setMenu(prev => prev.filter(item => item.id !== id)) }
        ]);
    };

    const guardarMenu = async () => {
        if (menu.length === 0) { Alert.alert('Error', 'Agrega al menos un producto.'); return; }
        setGuardando(true);
        try {
            await updateDoc(doc(db, 'pupuserias', pupuseriaId), { menu });
            Alert.alert('✅ Menú guardado', 'Los cambios se guardaron correctamente.', [
                { text: 'Listo', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el menú.');
        }
        setGuardando(false);
    };

    if (cargando) {
        return (
            <View style={styles.centrado}>
                <StatusBar backgroundColor="#1C0A00" barStyle="light-content" />
                <ActivityIndicator size="large" color="#D4850A" />
                <Text style={styles.cargandoTexto}>Cargando menú...</Text>
            </View>
        );
    }

    // Agrupar pupusas por masa
    const pupusasMaiz = menu.filter(i => i.categoria === 'pupusa' && (i.masa === 'maiz' || !i.masa));
    const pupusasArroz = menu.filter(i => i.categoria === 'pupusa' && i.masa === 'arroz');
    const refrescos = menu.filter(i => i.categoria === 'refresco');
    const otros = menu.filter(i => i.categoria === 'otro');

    const renderItems = (items) => items.map(item => (
        <View key={item.id} style={styles.menuItem}>
            <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
            <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemNombre}>{item.nombre}</Text>
                <Text style={styles.menuItemPrecio}>${item.precio.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => eliminarItem(item.id)} style={styles.menuItemEliminar}>
                <Text style={styles.menuItemEliminarTexto}>✕</Text>
            </TouchableOpacity>
        </View>
    ));

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <StatusBar backgroundColor="#1C0A00" barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botonRegresar}>
                    <Text style={styles.botonRegresarTexto}>← Regresar al panel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitulo}>Gestionar menú</Text>
                <Text style={styles.headerSub}>Agrega o elimina productos de tu menú</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.seccionTitulo}>➕ Agregar producto</Text>

                <View style={styles.formulario}>

                    {/* Categoría */}
                    <View style={styles.grupo}>
                        <Text style={styles.label}>Categoría</Text>
                        <View style={styles.categorias}>
                            {CATEGORIAS.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoriaBtn, nuevaCategoria === cat.id && styles.categoriaBtnActivo]}
                                    onPress={() => setNuevaCategoria(cat.id)}
                                >
                                    <Text style={styles.categoriaEmoji}>{cat.emoji}</Text>
                                    <Text style={[styles.categoriaTexto, nuevaCategoria === cat.id && styles.categoriaTextoActivo]}>
                                        {cat.nombre}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Masa — solo si es pupusa */}
                    {nuevaCategoria === 'pupusa' && (
                        <View style={styles.grupo}>
                            <Text style={styles.label}>Masa</Text>
                            <View style={styles.categorias}>
                                {MASAS.map(masa => (
                                    <TouchableOpacity
                                        key={masa.id}
                                        style={[styles.categoriaBtn, nuevaMasa === masa.id && styles.masaBtnActivo]}
                                        onPress={() => setNuevaMasa(masa.id)}
                                    >
                                        <Text style={styles.categoriaEmoji}>{masa.emoji}</Text>
                                        <Text style={[styles.categoriaTexto, nuevaMasa === masa.id && styles.masaTextoActivo]}>
                                            {masa.nombre}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Nombre */}
                    <View style={styles.grupo}>
                        <Text style={styles.label}>Nombre del producto</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Pupusa de queso"
                            placeholderTextColor="#B0956A"
                            value={nuevoNombre}
                            onChangeText={setNuevoNombre}
                        />
                    </View>

                    {/* Precio */}
                    <View style={styles.grupo}>
                        <Text style={styles.label}>Precio ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 0.50"
                            placeholderTextColor="#B0956A"
                            value={nuevoPrecio}
                            onChangeText={setNuevoPrecio}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Preview emoji */}
                    {nuevoNombre.trim().length > 0 && nuevaCategoria === 'pupusa' && (
                        <View style={styles.previewEmoji}>
                            <Text style={styles.previewEmojiIcono}>{obtenerEmoji(nuevaCategoria, nuevoNombre)}</Text>
                            <Text style={styles.previewEmojiTexto}>
                                Pupusa de {nuevaMasa === 'maiz' ? 'maíz 🌽' : 'arroz 🍚'}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.botonAgregar} onPress={agregarItem}>
                        <Text style={styles.botonAgregarTexto}>+ Agregar al menú</Text>
                    </TouchableOpacity>
                </View>

                {/* Lista del menú */}
                <Text style={styles.seccionTitulo}>
                    📋 Tu menú actual {menu.length > 0 ? `(${menu.length} productos)` : ''}
                </Text>

                {menu.length === 0 ? (
                    <View style={styles.vacioContainer}>
                        <Text style={styles.vacioEmoji}>🍽️</Text>
                        <Text style={styles.vacioTexto}>Tu menú está vacío</Text>
                        <Text style={styles.vacioSub}>Agrega productos usando el formulario de arriba</Text>
                    </View>
                ) : (
                    <>
                        {pupusasMaiz.length > 0 && (
                            <View style={styles.categoriaSeccion}>
                                <Text style={styles.categoriaSeccionTitulo}>🌽 Pupusas de Maíz</Text>
                                {renderItems(pupusasMaiz)}
                            </View>
                        )}

                        {pupusasArroz.length > 0 && (
                            <View style={styles.categoriaSeccion}>
                                <Text style={styles.categoriaSeccionTitulo}>🍚 Pupusas de Arroz</Text>
                                {renderItems(pupusasArroz)}
                            </View>
                        )}

                        {refrescos.length > 0 && (
                            <View style={styles.categoriaSeccion}>
                                <Text style={styles.categoriaSeccionTitulo}>🥤 Refrescos</Text>
                                {renderItems(refrescos)}
                            </View>
                        )}

                        {otros.length > 0 && (
                            <View style={styles.categoriaSeccion}>
                                <Text style={styles.categoriaSeccionTitulo}>🍽️ Otros</Text>
                                {renderItems(otros)}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
                            onPress={guardarMenu}
                            disabled={guardando}
                        >
                            {guardando ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.botonGuardarTexto}>💾 Guardar cambios</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF6EE' },
    content: { paddingBottom: 48 },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6EE' },
    cargandoTexto: { marginTop: 12, fontSize: 14, color: '#7A5C3A' },

    header: {
        backgroundColor: '#1C0A00',
        paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24,
    },
    botonRegresar: {
        backgroundColor: '#D4850A', alignSelf: 'flex-start',
        borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16,
    },
    botonRegresarTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    headerTitulo: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
    headerSub: { fontSize: 13, color: '#B0956A' },

    body: { padding: 20 },
    seccionTitulo: { fontSize: 16, fontWeight: '800', color: '#2D1200', marginBottom: 12, marginTop: 8 },

    formulario: {
        backgroundColor: '#FFFAF3', borderRadius: 16,
        padding: 16, borderWidth: 1.5, borderColor: '#E8D5B7', marginBottom: 24,
    },
    grupo: { marginBottom: 16 },
    label: {
        fontSize: 13, fontWeight: '600', color: '#2D1200',
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#FDF6EE', borderWidth: 1.5, borderColor: '#E8D5B7',
        borderRadius: 12, padding: 14, fontSize: 15, color: '#2D1200',
    },

    categorias: { flexDirection: 'row', gap: 10 },
    categoriaBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, borderRadius: 10, padding: 10,
        borderWidth: 1.5, borderColor: '#E8D5B7', backgroundColor: '#FDF6EE',
    },
    categoriaBtnActivo: { borderColor: '#D4850A', backgroundColor: '#FEF3E2' },
    masaBtnActivo: { borderColor: '#2D7A3A', backgroundColor: '#F0FDF4' },
    categoriaEmoji: { fontSize: 16 },
    categoriaTexto: { fontSize: 13, color: '#7A5C3A', fontWeight: '600' },
    categoriaTextoActivo: { color: '#D4850A' },
    masaTextoActivo: { color: '#2D7A3A' },

    previewEmoji: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FDF6EE', borderRadius: 10, padding: 12,
        marginBottom: 12, borderWidth: 1, borderColor: '#E8D5B7',
    },
    previewEmojiIcono: { fontSize: 28 },
    previewEmojiTexto: { fontSize: 13, color: '#7A5C3A', fontWeight: '500' },

    botonAgregar: {
        backgroundColor: '#1C0A00', borderRadius: 12,
        padding: 14, alignItems: 'center', marginTop: 4,
    },
    botonAgregarTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    categoriaSeccion: {
        backgroundColor: '#FFFAF3', borderRadius: 16,
        borderWidth: 1.5, borderColor: '#E8D5B7',
        marginBottom: 12, overflow: 'hidden',
    },
    categoriaSeccionTitulo: {
        fontSize: 14, fontWeight: '700', color: '#2D1200',
        padding: 14, backgroundColor: '#FDF6EE',
        borderBottomWidth: 1, borderBottomColor: '#E8D5B7',
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderBottomWidth: 1, borderBottomColor: '#F0E4D0',
    },
    menuItemEmoji: { fontSize: 22 },
    menuItemInfo: { flex: 1 },
    menuItemNombre: { fontSize: 14, fontWeight: '600', color: '#2D1200' },
    menuItemPrecio: { fontSize: 13, color: '#D4850A', fontWeight: '700', marginTop: 2 },
    menuItemEliminar: {
        backgroundColor: '#FEE2E2', borderRadius: 8,
        width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
    },
    menuItemEliminarTexto: { color: '#A85C00', fontSize: 13, fontWeight: '800' },

    vacioContainer: { alignItems: 'center', padding: 32 },
    vacioEmoji: { fontSize: 40, marginBottom: 12 },
    vacioTexto: { fontSize: 16, fontWeight: '700', color: '#2D1200', marginBottom: 6 },
    vacioSub: { fontSize: 13, color: '#7A5C3A', textAlign: 'center' },

    botonGuardar: {
        backgroundColor: '#D4850A', borderRadius: 14,
        padding: 18, alignItems: 'center', marginTop: 8,
    },
    botonDeshabilitado: { opacity: 0.5 },
    botonGuardarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});