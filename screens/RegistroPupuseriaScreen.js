import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import * as Location from 'expo-location';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, telefonoACorreo } from '../firebaseConfig';

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

export default function RegistroPupuseriaScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [cargandoGps, setCargandoGps] = useState(true);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);

  const [menuItems, setMenuItems] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('pupusa');

  useEffect(() => { capturarGPS(); }, []);

  const capturarGPS = async () => {
    setCargandoGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Para registrar tu pupusería necesitamos saber dónde está.');
        setCargandoGps(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUbicacion(loc.coords);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Intenta de nuevo.');
    }
    setCargandoGps(false);
  };

  const agregarItem = () => {
    if (!nuevoNombre.trim()) { Alert.alert('Error', 'Escribe el nombre del producto.'); return; }
    if (!nuevoPrecio || isNaN(nuevoPrecio) || parseFloat(nuevoPrecio) <= 0) { Alert.alert('Error', 'Ingresa un precio válido.'); return; }
    const item = {
      id: Date.now().toString(),
      nombre: nuevoNombre.trim(),
      categoria: nuevaCategoria,
      emoji: obtenerEmoji(nuevaCategoria, nuevoNombre.trim()),
      precio: parseFloat(parseFloat(nuevoPrecio).toFixed(2)),
    };
    setMenuItems(prev => [...prev, item]);
    setNuevoNombre('');
    setNuevoPrecio('');
    setNuevaCategoria('pupusa');
  };

  const eliminarItem = (id) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  const registrar = async () => {
    // ── Validaciones básicas ──────────────────────────────
    if (!nombre.trim()) { Alert.alert('Error', 'Ingresa el nombre de tu pupusería.'); return; }
    if (!direccion.trim()) { Alert.alert('Error', 'Ingresa la dirección.'); return; }
    if (!telefono.trim() || telefono.length < 8) { Alert.alert('Error', 'Ingresa un teléfono válido de 8 dígitos.'); return; }
    if (!contrasena || contrasena.length < 6) { Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.'); return; }
    if (!ubicacion) {
      Alert.alert('Ubicación no capturada', 'Necesitamos tu ubicación.', [{ text: 'Reintentar', onPress: capturarGPS }]);
      return;
    }
    if (menuItems.length === 0) { Alert.alert('Error', 'Agrega al menos un producto a tu menú.'); return; }

    setCargandoGuardar(true);

    try {
      // ── FIX 1: Verificar nombre de pupusería duplicado ──
      const qNombre = query(
        collection(db, 'pupuserias'),
        where('nombre', '==', nombre.trim())
      );
      const snapshotNombre = await getDocs(qNombre);
      if (!snapshotNombre.empty) {
        Alert.alert(
          'Nombre no disponible',
          `Ya existe una pupusería llamada "${nombre.trim()}". Por favor elige un nombre diferente.`
        );
        setCargandoGuardar(false);
        return;
      }

      // ── FIX 2: Verificar que el teléfono no tenga ya una pupusería ──
      // (Se detecta automáticamente por Auth con auth/email-already-in-use,
      // pero también verificamos si ya tiene pupusería en Firestore)

      // ── Crear cuenta Auth ──────────────────────────────
      const correo = telefonoACorreo(telefono);
      const credencial = await createUserWithEmailAndPassword(auth, correo, contrasena);
      const uid = credencial.user.uid;

      // ── FIX 3: Registro con rollback completo ──────────
      let docPupuseriaId = null;

      try {
        // Paso 1 — Crear documento pupusería
        const docRef = await addDoc(collection(db, 'pupuserias'), {
          nombre: nombre.trim(),
          direccion: direccion.trim(),
          telefono: telefono.trim(),
          latitud: ubicacion.latitude,
          longitud: ubicacion.longitude,
          dueno_uid: uid,
          activa: true,
          menu: menuItems,
          fecha_registro: serverTimestamp(),
        });
        docPupuseriaId = docRef.id;

        // Paso 2 — Crear suscripción trial
        const ahora = new Date();
        const vencimiento = new Date();
        vencimiento.setDate(ahora.getDate() + 30);

        await addDoc(collection(db, 'suscripciones'), {
          pupuseria_id: docPupuseriaId,
          dueno_uid: uid,
          estado: 'trial',
          fecha_inicio: ahora,
          fecha_vencimiento: vencimiento,
          es_trial: true,
          meses_acumulados: 1,
        });

        // ✅ Todo salió bien — Auth redirige automáticamente al panel

      } catch (errorFirestore) {
        // ── ROLLBACK: si Firestore falla, limpiamos todo ──
        console.log('Error en Firestore, haciendo rollback...', errorFirestore);

        // Eliminar documento de pupusería si se creó
        if (docPupuseriaId) {
          try { await deleteDoc(doc(db, 'pupuserias', docPupuseriaId)); } catch (e) { }
        }

        // Eliminar cuenta Auth recién creada
        try { await deleteUser(credencial.user); } catch (e) { }

        Alert.alert(
          'Error al registrar',
          'Hubo un problema guardando tus datos. Por favor intenta de nuevo.',
          [{ text: 'Intentar de nuevo' }]
        );
      }

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Teléfono ya registrado', 'Este número ya tiene una cuenta. Si eres tú, inicia sesión.');
      } else {
        Alert.alert('Error', 'No se pudo registrar. Verifica tu conexión e intenta de nuevo.');
      }
    }

    setCargandoGuardar(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar backgroundColor="#FDF6EE" barStyle="dark-content" />

        <TouchableOpacity style={styles.botonRegresar} onPress={() => navigation.goBack()}>
          <Text style={styles.botonRegresarTexto}>← Regresar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Registra tu{'\n'}Pupusería 🫓</Text>
        <Text style={styles.subtitulo}>Completa los datos estando físicamente en tu negocio.</Text>

        {/* GPS */}
        <View style={[styles.gpsIndicador, ubicacion ? styles.gpsOk : styles.gpsCargando]}>
          {cargandoGps ? (
            <>
              <ActivityIndicator size="small" color="#7A5C3A" />
              <Text style={styles.gpsIndicadorTexto}>Detectando tu ubicación...</Text>
            </>
          ) : ubicacion ? (
            <>
              <Text style={styles.gpsIndicadorEmoji}>✅</Text>
              <Text style={styles.gpsIndicadorTextoOk}>Ubicación capturada correctamente</Text>
            </>
          ) : (
            <>
              <Text style={styles.gpsIndicadorEmoji}>⚠️</Text>
              <Text style={styles.gpsIndicadorTextoError}>No se pudo obtener la ubicación</Text>
              <TouchableOpacity onPress={capturarGPS}>
                <Text style={styles.gpsReintentar}>Reintentar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Datos del negocio */}
        <Text style={styles.seccionTitulo}>📍 Tu negocio</Text>

        <View style={styles.grupo}>
          <Text style={styles.label}>Nombre de la pupusería</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Pupusería La Bendición"
            placeholderTextColor="#B0956A"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.grupo}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Col. El Paraíso, San Salvador"
            placeholderTextColor="#B0956A"
            value={direccion}
            onChangeText={setDireccion}
          />
        </View>

        {/* Cuenta */}
        <Text style={styles.seccionTitulo}>🔐 Tu cuenta</Text>

        <View style={styles.grupo}>
          <Text style={styles.label}>Teléfono (será tu usuario)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 22224444"
            placeholderTextColor="#B0956A"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            maxLength={8}
          />
        </View>

        <View style={styles.grupo}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#B0956A"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />
        </View>

        {/* Menú */}
        <Text style={styles.seccionTitulo}>🍽️ Tu menú</Text>
        <Text style={styles.seccionSub}>Agrega los productos que vendes. Puedes editarlo después.</Text>

        <View style={styles.menuFormulario}>
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

          {nuevoNombre.trim().length > 0 && nuevaCategoria === 'pupusa' && (
            <View style={styles.previewEmoji}>
              <Text style={styles.previewEmojiIcono}>{obtenerEmoji(nuevaCategoria, nuevoNombre)}</Text>
              <Text style={styles.previewEmojiTexto}>Así se verá tu producto</Text>
            </View>
          )}

          <TouchableOpacity style={styles.botonAgregar} onPress={agregarItem}>
            <Text style={styles.botonAgregarTexto}>+ Agregar al menú</Text>
          </TouchableOpacity>
        </View>

        {menuItems.length > 0 && (
          <View style={styles.menuLista}>
            <Text style={styles.menuListaTitulo}>Tu menú ({menuItems.length} productos)</Text>
            {menuItems.map(item => (
              <View key={item.id} style={styles.menuItem}>
                <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemNombre}>{item.nombre}</Text>
                  <Text style={styles.menuItemCategoria}>
                    {CATEGORIAS.find(c => c.id === item.categoria)?.nombre} · ${item.precio.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => eliminarItem(item.id)} style={styles.menuItemEliminar}>
                  <Text style={styles.menuItemEliminarTexto}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.botonRegistrar, (cargandoGuardar || cargandoGps) && styles.botonDeshabilitado]}
          onPress={registrar}
          disabled={cargandoGuardar || cargandoGps}
        >
          {cargandoGuardar ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botonRegistrarTexto}>Registrar mi pupusería →</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EE' },
  content: { padding: 24, paddingBottom: 48 },

  botonRegresar: { marginBottom: 24 },
  botonRegresarTexto: { fontSize: 15, color: '#D4850A', fontWeight: '700' },

  titulo: {
    fontSize: 32, fontWeight: '800', color: '#2D1200',
    letterSpacing: -0.5, marginBottom: 10, lineHeight: 38,
  },
  subtitulo: { fontSize: 14, color: '#7A5C3A', marginBottom: 24, lineHeight: 20 },

  gpsIndicador: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, marginBottom: 28,
  },
  gpsCargando: { backgroundColor: '#FDF6EE', borderWidth: 1.5, borderColor: '#E8D5B7' },
  gpsOk: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
  gpsIndicadorEmoji: { fontSize: 16 },
  gpsIndicadorTexto: { fontSize: 13, color: '#7A5C3A', fontWeight: '500' },
  gpsIndicadorTextoOk: { fontSize: 13, color: '#15803D', fontWeight: '600' },
  gpsIndicadorTextoError: { fontSize: 13, color: '#D4850A', fontWeight: '600' },
  gpsReintentar: { fontSize: 13, color: '#D4850A', fontWeight: '700', marginLeft: 8 },

  seccionTitulo: {
    fontSize: 16, fontWeight: '800', color: '#2D1200',
    marginBottom: 6, marginTop: 8,
  },
  seccionSub: { fontSize: 13, color: '#7A5C3A', marginBottom: 16, lineHeight: 18 },

  grupo: { marginBottom: 16 },
  label: {
    fontSize: 13, fontWeight: '600', color: '#2D1200',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFAF3', borderWidth: 1.5, borderColor: '#E8D5B7',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#2D1200',
  },

  menuFormulario: {
    backgroundColor: '#FFFAF3', borderRadius: 16,
    padding: 16, borderWidth: 1.5, borderColor: '#E8D5B7', marginBottom: 16,
  },

  categorias: { flexDirection: 'row', gap: 10 },
  categoriaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, padding: 10,
    borderWidth: 1.5, borderColor: '#E8D5B7', backgroundColor: '#FDF6EE',
  },
  categoriaBtnActivo: { borderColor: '#D4850A', backgroundColor: '#FEF3E2' },
  categoriaEmoji: { fontSize: 16 },
  categoriaTexto: { fontSize: 13, color: '#7A5C3A', fontWeight: '600' },
  categoriaTextoActivo: { color: '#D4850A' },

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

  menuLista: {
    backgroundColor: '#FFFAF3', borderRadius: 16,
    padding: 16, borderWidth: 1.5, borderColor: '#E8D5B7', marginBottom: 24,
  },
  menuListaTitulo: { fontSize: 14, fontWeight: '700', color: '#2D1200', marginBottom: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0E4D0',
  },
  menuItemEmoji: { fontSize: 22 },
  menuItemInfo: { flex: 1 },
  menuItemNombre: { fontSize: 14, fontWeight: '600', color: '#2D1200' },
  menuItemCategoria: { fontSize: 12, color: '#7A5C3A', marginTop: 2 },
  menuItemEliminar: {
    backgroundColor: '#FEE2E2', borderRadius: 8,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
  },
  menuItemEliminarTexto: { color: '#A85C00', fontSize: 12, fontWeight: '800' },

  botonRegistrar: {
    backgroundColor: '#D4850A', borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.5 },
  botonRegistrarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
