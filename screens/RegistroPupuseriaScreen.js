import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import * as Location from 'expo-location';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, telefonoACorreo } from '../firebaseConfig';

export default function RegistroPupuseriaScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [cargandoGps, setCargandoGps] = useState(true);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);

  useEffect(() => {
    capturarGPS();
  }, []);

  const capturarGPS = async () => {
    setCargandoGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de ubicación necesario',
          'Para registrar tu pupusería necesitamos saber dónde está. Por favor activa el permiso de ubicación.',
          [{ text: 'Entendido' }]
        );
        setCargandoGps(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setUbicacion(loc.coords);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Intenta de nuevo.');
    }
    setCargandoGps(false);
  };

  const registrar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa el nombre de tu pupusería.');
      return;
    }
    if (!direccion.trim()) {
      Alert.alert('Error', 'Ingresa la dirección.');
      return;
    }
    if (!telefono.trim() || telefono.length < 8) {
      Alert.alert('Error', 'Ingresa un teléfono válido de 8 dígitos.');
      return;
    }
    if (!contrasena || contrasena.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!ubicacion) {
      Alert.alert(
        'Ubicación no capturada',
        'Necesitamos tu ubicación. Asegúrate de tener el GPS activado.',
        [{ text: 'Reintentar', onPress: capturarGPS }]
      );
      return;
    }

    setCargandoGuardar(true);
    try {
      const correo = telefonoACorreo(telefono);
      const credencial = await createUserWithEmailAndPassword(auth, correo, contrasena);
      const uid = credencial.user.uid;

      await addDoc(collection(db, 'pupuserias'), {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        latitud: ubicacion.latitude,
        longitud: ubicacion.longitude,
        dueno_uid: uid,
        activa: true,
        fecha_registro: serverTimestamp(),
      });

      navigation.replace('PanelPupuseria', { nombre: nombre.trim() });

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'Este número de teléfono ya tiene una cuenta registrada.');
      } else {
        Alert.alert('Error', 'No se pudo registrar. Intenta de nuevo.');
      }
    }
    setCargandoGuardar(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <TouchableOpacity style={styles.botonRegresar} onPress={() => navigation.goBack()}>
          <Text style={styles.botonRegresarTexto}>← Regresar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Registra tu{'\n'}Pupusería 🫓</Text>
        <Text style={styles.subtitulo}>
          Completa los datos estando físicamente en tu negocio.
        </Text>

        {/* Indicador GPS automático */}
        <View style={[styles.gpsIndicador, ubicacion ? styles.gpsOk : styles.gpsCargando]}>
          {cargandoGps ? (
            <>
              <ActivityIndicator size="small" color="#6B5E57" />
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
            placeholderTextColor="#B0A098"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.grupo}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Col. El Paraíso, San Salvador"
            placeholderTextColor="#B0A098"
            value={direccion}
            onChangeText={setDireccion}
          />
        </View>

        {/* Datos de la cuenta */}
        <Text style={styles.seccionTitulo}>🔐 Tu cuenta</Text>

        <View style={styles.grupo}>
          <Text style={styles.label}>Teléfono (será tu usuario)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 22224444"
            placeholderTextColor="#B0A098"
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
            placeholderTextColor="#B0A098"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />
        </View>

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
  container: { flex: 1, backgroundColor: '#FFF8F2' },
  content: { padding: 24, paddingBottom: 48 },

  botonRegresar: { marginBottom: 24 },
  botonRegresarTexto: { fontSize: 15, color: '#E8210A', fontWeight: '600' },

  titulo: {
    fontSize: 32, fontWeight: '800', color: '#1A0F08',
    letterSpacing: -0.5, marginBottom: 10, lineHeight: 38,
  },
  subtitulo: { fontSize: 14, color: '#6B5E57', marginBottom: 24, lineHeight: 20 },

  gpsIndicador: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, marginBottom: 28,
  },
  gpsCargando: { backgroundColor: '#F5F0EB', borderWidth: 1.5, borderColor: '#E8D5C4' },
  gpsOk: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
  gpsIndicadorEmoji: { fontSize: 16 },
  gpsIndicadorTexto: { fontSize: 13, color: '#6B5E57', fontWeight: '500' },
  gpsIndicadorTextoOk: { fontSize: 13, color: '#15803D', fontWeight: '600' },
  gpsIndicadorTextoError: { fontSize: 13, color: '#E8210A', fontWeight: '600' },
  gpsReintentar: { fontSize: 13, color: '#E8210A', fontWeight: '700', marginLeft: 8 },

  seccionTitulo: {
    fontSize: 16, fontWeight: '800', color: '#1A0F08',
    marginBottom: 16, marginTop: 8,
  },

  grupo: { marginBottom: 20 },
  label: {
    fontSize: 13, fontWeight: '600', color: '#1A0F08',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8D5C4',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#1A0F08',
  },

  botonRegistrar: {
    backgroundColor: '#E8210A', borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.5 },
  botonRegistrarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});