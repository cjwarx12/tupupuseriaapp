import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export default function MapScreen({ navigation }) {
    const [ubicacion, setUbicacion] = useState(null);
    const [pupuserias, setPupuserias] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        iniciar();
    }, []);

    const iniciar = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setCargando(false);
            return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const coords = loc.coords;
        setUbicacion(coords);
        await cargarPupuserias(coords);
    };

    const cargarPupuserias = async (coords) => {
        try {
            const snapshot = await getDocs(collection(db, 'pupuserias'));
            const todas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const cercanas = todas.filter(p => {
                const distancia = calcularDistancia(
                    coords.latitude, coords.longitude,
                    p.latitud, p.longitud
                );
                return distancia <= 1;
            });

            setPupuserias(cercanas);
        } catch (error) {
            console.log('Error cargando pupuserías:', error);
        }
        setCargando(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.mapaContainer}>
                {!ubicacion ? (
                    <View style={styles.centro}>
                        <ActivityIndicator size='large' color='#E8210A' />
                        <Text style={styles.cargandoTexto}>Obteniendo tu ubicación...</Text>
                    </View>
                ) : (
                    <MapView
                        style={styles.mapa}
                        initialRegion={{
                            latitude: ubicacion.latitude,
                            longitude: ubicacion.longitude,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                        showsUserLocation={true}
                    >
                        {pupuserias.map(p => (
                            <Marker
                                key={p.id}
                                coordinate={{ latitude: p.latitud, longitude: p.longitud }}
                                title={p.nombre}
                                description={p.direccion}
                                pinColor='#E8210A'
                            />
                        ))}
                    </MapView>
                )}
            </View>

            <View style={styles.listaContainer}>
                <Text style={styles.listaTitulo}>
                    Pupuserías cercanas {!cargando && `(${pupuserias.length})`}
                </Text>
                {cargando ? (
                    <ActivityIndicator size='small' color='#E8210A' style={{ marginTop:20 }} />
                ) : (
                    <FlatList
                        data={pupuserias}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.lista}
                        ListEmptyComponent={
                            <View style={styles.vacioCentro}>
                                <Text style={styles.vacioEmoji}>🫓</Text>
                                <Text style={styles.vacioTexto}>No hay pupuserías cerca de ti</Text>
                                <Text style={styles.vacioSub}>Pronto más pupuserías de tu zona se unirán a TuPupuseriaApp</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.tarjeta}
                                onPress={() => navigation.navigate('Pedido', { pupuseria: item })}>
                                <View style={styles.tarjetaInfo}>
                                    <Text style={styles.tarjetaNombre}>{item.nombre}</Text>
                                    <Text style={styles.tarjetaDireccion}>{item.direccion}</Text>
                                </View>
                                <Text style={styles.tarjetaFlecha}>→</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#FFF8F2' },
    mapaContainer: { height:'45%' },
    mapa: { flex:1 },
    centro: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#F0F0F0' },
    cargandoTexto: { marginTop:12, fontSize:15, color:'#6B5E57' },
    listaContainer: { flex:1, backgroundColor:'#FFF8F2' },
    listaTitulo: { fontSize:16, fontWeight:'bold', color:'#1A0F08',
        padding:16, paddingBottom:8, borderBottomWidth:1, borderBottomColor:'#E8D5C4' },
    lista: { padding:12, gap:10 },
    tarjeta: { backgroundColor:'#FFFFFF', borderRadius:12, padding:16,
        flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:'#E8D5C4' },
    tarjetaInfo: { flex:1 },
    tarjetaNombre: { fontSize:15, fontWeight:'bold', color:'#1A0F08', marginBottom:3 },
    tarjetaDireccion: { fontSize:13, color:'#6B5E57' },
    tarjetaFlecha: { fontSize:20, color:'#E8210A', fontWeight:'bold' },
    vacioCentro: { alignItems:'center', marginTop:30 },
    vacioEmoji: { fontSize:40, marginBottom:12 },
    vacioTexto: { fontSize:16, fontWeight:'bold', color:'#1A0F08', marginBottom:6 },
    vacioSub: { fontSize:13, color:'#6B5E57', textAlign:'center' },
});