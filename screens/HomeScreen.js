import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function HomeScreen({ navigation }) {
    const [pupuserias, setPupuserias] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarPupuserias();
    }, []);

    const cargarPupuserias = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'pupuserias'));
            const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPupuserias(lista);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar las pupuserías');
        }
        setCargando(false);
    };

    const cerrarSesion = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.emoji}>🫓</Text>
                <Text style={styles.titulo}>TuPupuseriaApp</Text>
                <Text style={styles.subtitulo}>Pupuserías cerca de ti</Text>
            </View>

            {cargando ? (
                <ActivityIndicator size='large' color='#E8210A' style={{ marginTop:40 }} />
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

            <TouchableOpacity style={styles.botonSalir} onPress={cerrarSesion}>
                <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#FFF8F2' },
    header: { backgroundColor:'#E8210A', padding:24, paddingTop:48, alignItems:'center' },
    emoji: { fontSize:48, marginBottom:8 },
    titulo: { fontSize:24, fontWeight:'bold', color:'#FFFFFF', marginBottom:4 },
    subtitulo: { fontSize:14, color:'#FFFFFF', opacity:0.85 },
    lista: { padding:16, gap:12 },
    tarjeta: { backgroundColor:'#FFFFFF', borderRadius:12, padding:16,
        flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:'#E8D5C4' },
    tarjetaInfo: { flex:1 },
    tarjetaNombre: { fontSize:16, fontWeight:'bold', color:'#1A0F08', marginBottom:4 },
    tarjetaDireccion: { fontSize:13, color:'#6B5E57' },
    tarjetaFlecha: { fontSize:20, color:'#E8210A', fontWeight:'bold' },
    vacio: { textAlign:'center', color:'#6B5E57', fontSize:15, marginTop:40 },
    botonSalir: { margin:16, borderWidth:1.5, borderColor:'#E8210A', borderRadius:12,
        padding:14, alignItems:'center' },
    botonSalirTexto: { color:'#E8210A', fontSize:15, fontWeight:'bold' },
});