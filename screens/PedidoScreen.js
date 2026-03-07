import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

const TIPOS_PUPUSA = [
    { id: 'queso', nombre: 'Queso', emoji: '🧀' },
    { id: 'frijoles', nombre: 'Frijoles', emoji: '🫘' },
    { id: 'revueltas', nombre: 'Revueltas', emoji: '🫓' },
    { id: 'chicharron', nombre: 'Chicharrón', emoji: '🥩' },
    { id: 'loroco', nombre: 'Loroco', emoji: '🌿' },
];

export default function PedidoScreen({ route, navigation }) {
    const { pupuseria } = route.params;
    const [cantidades, setCantidades] = useState({});
    const [cargando, setCargando] = useState(false);

    const cambiarCantidad = (id, delta) => {
        setCantidades(prev => {
            const actual = prev[id] || 0;
            const nueva = Math.max(0, actual + delta);
            return { ...prev, [id]: nueva };
        });
    };

    const totalPupusas = Object.values(cantidades).reduce((a, b) => a + b, 0);

    const confirmarPedido = async () => {
        if (totalPupusas === 0) {
            Alert.alert('Error', 'Selecciona al menos una pupusa');
            return;
        }
        setCargando(true);
        try {
            const detalle = TIPOS_PUPUSA
                .filter(t => cantidades[t.id] > 0)
                .map(t => ({ tipo: t.nombre, cantidad: cantidades[t.id] }));

            await addDoc(collection(db, 'pedidos'), {
                cliente_uid: auth.currentUser.uid,
                pupuseria_id: pupuseria.id,
                pupuseria_nombre: pupuseria.nombre,
                detalle,
                total: totalPupusas,
                estado: 'pendiente',
                fecha: serverTimestamp(),
            });
            navigation.replace('Confirmacion', { pupuseria, total: totalPupusas });
        } catch (error) {
            Alert.alert('Error', 'No se pudo enviar el pedido');
        }
        setCargando(false);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← Regresar</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>{pupuseria.nombre}</Text>
                <Text style={styles.subtitulo}>{pupuseria.direccion}</Text>
            </View>

            <Text style={styles.seccion}>¿Qué pupusas quieres?</Text>

            {TIPOS_PUPUSA.map(tipo => (
                <View key={tipo.id} style={styles.fila}>
                    <Text style={styles.tipoEmoji}>{tipo.emoji}</Text>
                    <Text style={styles.tipoNombre}>{tipo.nombre}</Text>
                    <View style={styles.contador}>
                        <TouchableOpacity style={styles.btnContador}
                            onPress={() => cambiarCantidad(tipo.id, -1)}>
                            <Text style={styles.btnContadorTexto}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.cantidad}>{cantidades[tipo.id] || 0}</Text>
                        <TouchableOpacity style={styles.btnContador}
                            onPress={() => cambiarCantidad(tipo.id, 1)}>
                            <Text style={styles.btnContadorTexto}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <View style={styles.footer}>
                <Text style={styles.total}>Total: {totalPupusas} pupusas</Text>
                <TouchableOpacity style={[styles.boton, cargando && styles.botonDesactivado]}
                    onPress={confirmarPedido} disabled={cargando}>
                    <Text style={styles.botonTexto}>
                        {cargando ? 'Enviando...' : 'Confirmar pedido'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#FFF8F2' },
    header: { backgroundColor:'#E8210A', padding:24, paddingTop:48 },
    back: { color:'#FFFFFF', fontSize:14, marginBottom:12, opacity:0.85 },
    titulo: { fontSize:24, fontWeight:'bold', color:'#FFFFFF', marginBottom:4 },
    subtitulo: { fontSize:14, color:'#FFFFFF', opacity:0.85 },
    seccion: { fontSize:18, fontWeight:'bold', color:'#1A0F08', padding:24, paddingBottom:12 },
    fila: { flexDirection:'row', alignItems:'center', padding:16, paddingHorizontal:24,
        borderBottomWidth:1, borderBottomColor:'#F0E0D0' },
    tipoEmoji: { fontSize:28, marginRight:12 },
    tipoNombre: { flex:1, fontSize:16, color:'#1A0F08' },
    contador: { flexDirection:'row', alignItems:'center', gap:12 },
    btnContador: { backgroundColor:'#E8210A', width:32, height:32, borderRadius:16,
        justifyContent:'center', alignItems:'center' },
    btnContadorTexto: { color:'#FFFFFF', fontSize:20, fontWeight:'bold' },
    cantidad: { fontSize:18, fontWeight:'bold', color:'#1A0F08', minWidth:24, textAlign:'center' },
    footer: { padding:24, gap:12 },
    total: { fontSize:18, fontWeight:'bold', color:'#1A0F08', textAlign:'center' },
    boton: { backgroundColor:'#E8210A', borderRadius:12, padding:16, alignItems:'center' },
    botonDesactivado: { opacity:0.6 },
    botonTexto: { color:'#FFFFFF', fontSize:16, fontWeight:'bold' },
});