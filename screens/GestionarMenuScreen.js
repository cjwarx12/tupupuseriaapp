import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const CATEGORIAS = [
    { id: 'pupusa', nombre: 'Pupusa', emoji: '🫓' },
    { id: 'refresco', nombre: 'Refresco', emoji: '🥤' },
    { id: 'otro', nombre: 'Otro', emoji: '🍽️' },
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

    useEffect(() => {
        cargarMenu();
    }, []);

    const cargarMenu = async () => {
        try {
            const q = query(
                collection(db, 'pupuserias'),
                where('dueno_uid', '==', auth.currentUser.uid)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const id = snapshot.docs[0].id;
                const datos = snapshot.docs[0].data();
                setPupuseriaId(id);
                setMenu(datos.menu || []);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo cargar el menú.');
        }
        setCargando(false);
    };

    const agregarItem = () => {
        if (!nuevoNombre.trim()) {
            Alert.alert('Error', 'Escribe el nombre del producto.');
            return;
        }
        if (!nuevoPrecio || isNaN(nuevoPrecio) || parseFloat(nuevoPrecio) <= 0) {
            Alert.alert('Error', 'Ingresa un precio válido.');
            return;
        }
        const item = {
            id: Date.now().toString(),
            nombre: nuevoNombre.trim(),
            categoria: nuevaCategoria,
            emoji: obtenerEmoji(nuevaCategoria, nuevoNombre.trim()),
            precio: parseFloat(parseFloat(nuevoPrecio).toFixed(2)),
        };
        setMenu(prev => [...prev, item]);
        setNuevoNombre('');
        setNuevoPrecio('');
        setNuevaCategoria('pupusa');
    };

    const eliminarItem = (id) => {
        Alert.alert(
            'Eliminar producto',
            '¿Seguro que quieres eliminar este producto del menú?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => setMenu(prev => prev.filter(item => item.id !== id))
                }
            ]
        );
    };

    const guardarMenu = async () => {
        if (menu.length === 0) {
            Alert.alert('Error', 'Agrega al menos un producto al menú.');
            return;
        }
        setGuardando(true);
        try {
            await updateDoc(doc(db, 'pupuserias', pupuseriaId), {
                menu: menu,
            });
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
                <ActivityIndicator size="large" color="#E8210A" />
                <Text style={styles.cargandoTexto}>Cargando menú...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

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
                    <View style={styles.grupo}>
                        <Text style={styles.label}>Nombre del producto</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Pupusa de queso"
                            placeholderTextColor="#B0A098"
                            value={nuevoNombre}
                            onChangeText={setNuevoNombre}
                        />
                    </View>

                    <View style={styles.grupo}>
                        <Text style={styles.label}>Precio ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 0.50"
                            placeholderTextColor="#B0A098"
                            value={nuevoPrecio}
                            onChangeText={setNuevoPrecio}
                            keyboardType="decimal-pad"
                        />
                    </View>

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

                    {/* Preview del emoji en tiempo real */}
                    {nuevoNombre.trim().length > 0 && nuevaCategoria === 'pupusa' && (
                        <View style={styles.previewEmoji}>
                            <Text style={styles.previewEmojiIcono}>
                                {obtenerEmoji(nuevaCategoria, nuevoNombre)}
                            </Text>
                            <Text style={styles.previewEmojiTexto}>
                                Así se verá tu producto
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.botonAgregar} onPress={agregarItem}>
                        <Text style={styles.botonAgregarTexto}>+ Agregar al menú</Text>
                    </TouchableOpacity>
                </View>

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
                        {/* Pupusas */}
                        {menu.filter(i => i.categoria === 'pupusa').length > 0 && (
                            <View style={styles.categoriaSeccion}>
                                <Text style={styles.categoriaSeccionTitulo}>🫓 Pupusas</Text>
                                {menu.filter(i => i.categoria === 'pupusa').map(item => (
                                    <View key={item.id} style={styles.menuItem}>
                                        <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                                        <View style={styles.menuItemInfo}>
                                            <Text style={styles.menuItemNombre}>{item.nombre}</Text>
                                            <Text style={styles.menuItemPrecio}>${item.precio.toFixed(2)}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => eliminarItem(item.id)}
                                            style={styles.menuItemEliminar}
                                        >
                                            <Text style={styles.menuItemEliminarTexto}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Refrescos */}
                        {menu.filter(i => i.categoria === 'refresco').length > 0 && (
                            <View style={styles.categoriaSeccion}>
                                <Text style={styles.categoriaSeccionTitulo}>🥤 Refrescos</Text>
                                {menu.filter(i => i.categoria === 'refresco').map(item => (
                                    <View key={item.id} style={styles.menuItem}>
                                        <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                                        <View style={styles.menuItemInfo}>
                                            <Text style={styles.menuItemNombre}>{item.nombre}</Text>
                                            <Text style={styles.menuItemPrecio}>${item.precio.toFixed(2)}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => eliminarItem(item.id)}
                                            style={styles.menuItemEliminar}
                                        >
                                            <Text style={styles.menuItemEliminarTexto}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Otros */}
                        {menu.filter(i => i.categoria === 'otro').length > 0 && (
                            <View style={styles.categoriaSeccion}>
                                <Text style={styles.categoriaSeccionTitulo}>🍽️ Otros</Text>
                                {menu.filter(i => i.categoria === 'otro').map(item => (
                                    <View key={item.id} style={styles.menuItem}>
                                        <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                                        <View style={styles.menuItemInfo}>
                                            <Text style={styles.menuItemNombre}>{item.nombre}</Text>
                                            <Text style={styles.menuItemPrecio}>${item.precio.toFixed(2)}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => eliminarItem(item.id)}
                                            style={styles.menuItemEliminar}
                                        >
                                            <Text style={styles.menuItemEliminarTexto}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
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
    container: { flex: 1, backgroundColor: '#FFF8F2' },
    content: { paddingBottom: 48 },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F2' },
    cargandoTexto: { marginTop: 12, fontSize: 14, color: '#6B5E57' },

    header: {
        backgroundColor: '#1A0F08',
        paddingTop: 56,
        paddingBottom: 24,
        paddingHorizontal: 24,
    },
    botonRegresar: {
        backgroundColor: '#FDF6EC',
        alignSelf: 'flex-start',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    botonRegresarTexto: { color: '#1A0F08', fontSize: 14, fontWeight: '700' },
    headerTitulo: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
    headerSub: { fontSize: 13, color: '#9A8A80' },

    body: { padding: 20 },

    seccionTitulo: {
        fontSize: 16, fontWeight: '800', color: '#1A0F08',
        marginBottom: 12, marginTop: 8,
    },

    formulario: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        padding: 16, borderWidth: 1.5, borderColor: '#E8D5C4', marginBottom: 24,
    },
    grupo: { marginBottom: 16 },
    label: {
        fontSize: 13, fontWeight: '600', color: '#1A0F08',
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#FFF8F2', borderWidth: 1.5, borderColor: '#E8D5C4',
        borderRadius: 12, padding: 14, fontSize: 15, color: '#1A0F08',
    },

    categorias: { flexDirection: 'row', gap: 10 },
    categoriaBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, borderRadius: 10, padding: 10,
        borderWidth: 1.5, borderColor: '#E8D5C4', backgroundColor: '#FFF8F2',
    },
    categoriaBtnActivo: { borderColor: '#E8210A', backgroundColor: '#FEF2F2' },
    categoriaEmoji: { fontSize: 16 },
    categoriaTexto: { fontSize: 13, color: '#6B5E57', fontWeight: '600' },
    categoriaTextoActivo: { color: '#E8210A' },

    previewEmoji: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FFF8F2', borderRadius: 10, padding: 12,
        marginBottom: 12, borderWidth: 1, borderColor: '#E8D5C4',
    },
    previewEmojiIcono: { fontSize: 28 },
    previewEmojiTexto: { fontSize: 13, color: '#6B5E57', fontWeight: '500' },

    botonAgregar: {
        backgroundColor: '#1A0F08', borderRadius: 12,
        padding: 14, alignItems: 'center', marginTop: 4,
    },
    botonAgregarTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    categoriaSeccion: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1.5, borderColor: '#E8D5C4',
        marginBottom: 12, overflow: 'hidden',
    },
    categoriaSeccionTitulo: {
        fontSize: 14, fontWeight: '700', color: '#1A0F08',
        padding: 14, backgroundColor: '#FDF6EC',
        borderBottomWidth: 1, borderBottomColor: '#E8D5C4',
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderBottomWidth: 1, borderBottomColor: '#F0E8E0',
    },
    menuItemEmoji: { fontSize: 22 },
    menuItemInfo: { flex: 1 },
    menuItemNombre: { fontSize: 14, fontWeight: '600', color: '#1A0F08' },
    menuItemPrecio: { fontSize: 13, color: '#E8210A', fontWeight: '700', marginTop: 2 },
    menuItemEliminar: {
        backgroundColor: '#FEE2E2', borderRadius: 8,
        width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
    },
    menuItemEliminarTexto: { color: '#E8210A', fontSize: 13, fontWeight: '800' },

    vacioContainer: { alignItems: 'center', padding: 32 },
    vacioEmoji: { fontSize: 40, marginBottom: 12 },
    vacioTexto: { fontSize: 16, fontWeight: '700', color: '#1A0F08', marginBottom: 6 },
    vacioSub: { fontSize: 13, color: '#6B5E57', textAlign: 'center' },

    botonGuardar: {
        backgroundColor: '#E8210A', borderRadius: 14,
        padding: 18, alignItems: 'center', marginTop: 8,
    },
    botonDeshabilitado: { opacity: 0.5 },
    botonGuardarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});