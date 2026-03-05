import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [ubicacion, setUbicacion] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerUbicacion();
  }, []);

  const obtenerUbicacion = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Se necesita permiso de ubicación para mostrar el mapa');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setUbicacion(loc.coords);
  };

  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.errorTexto}>{error}</Text>
      </View>
    );
  }

  if (!ubicacion) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#E8210A" />
        <Text style={styles.cargandoTexto}>Obteniendo tu ubicación...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.mapa}
        initialRegion={{
          latitude: ubicacion.latitude,
          longitude: ubicacion.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
      >
        <Marker
          coordinate={{
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude,
          }}
          title="Tú estás aquí"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapa: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF8F2', padding: 24 },
  cargandoTexto: { marginTop: 12, fontSize: 15, color: '#6B5E57' },
  errorTexto: { fontSize: 15, color: '#E8210A', textAlign: 'center' },
});