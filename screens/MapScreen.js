import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function MapScreen({ navigation }) {
    const [ubicacion, setUbicacion] = useState(null);
    const [error, setError] = useState(null);
    const [pupuserias, setPupuserias] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        obtenerUbicacion();
        cargarPupuserias();
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

    const cargarPupuserias = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'pupuserias'));
            const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPupuserias(lista);
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
                <Text style={styles.listaTitulo}>Pupuserías cercanas</Text>
                {cargando ? (
                    <ActivityIndicator size='small' color='#E8210A' />
                ) : (
                    <FlatList
                        data={pupuserias}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.lista}
                        ListEmptyComponent={
                            <Text style={styles.vacio}>No hay pupuserías disponibles</Text>
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
    vacio: { textAlign:'center', color:'#6B5E57', fontSize:15, marginTop:20 },
});