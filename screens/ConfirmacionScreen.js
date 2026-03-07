import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ConfirmacionScreen({ route, navigation }) {
    const { pupuseria, total } = route.params;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.iconoContainer}>
                <Text style={styles.icono}>✅</Text>
            </View>

            <Text style={styles.titulo}>¡Pedido confirmado!</Text>
            <Text style={styles.subtitulo}>Tu pedido fue enviado correctamente</Text>

            <View style={styles.tarjeta}>
                <View style={styles.fila}>
                    <Text style={styles.etiqueta}>Pupusería</Text>
                    <Text style={styles.valor}>{pupuseria.nombre}</Text>
                </View>
                <View style={styles.separador} />
                <View style={styles.fila}>
                    <Text style={styles.etiqueta}>Dirección</Text>
                    <Text style={styles.valor}>{pupuseria.direccion}</Text>
                </View>
                <View style={styles.separador} />
                <View style={styles.fila}>
                    <Text style={styles.etiqueta}>Total</Text>
                    <Text style={styles.valorDestacado}>{total} pupusas</Text>
                </View>
            </View>

            <View style={styles.avisoContainer}>
                <Text style={styles.avisoEmoji}>🔔</Text>
                <Text style={styles.avisoTexto}>
                    Te avisaremos cuando tu pedido esté listo para recoger
                </Text>
            </View>

            <View style={styles.pasoContainer}>
                <Text style={styles.pasoTitulo}>¿Qué sigue?</Text>
                <Text style={styles.pasoPaso}>1. La pupusería recibe tu pedido</Text>
                <Text style={styles.pasoPaso}>2. Preparan tus pupusas</Text>
                <Text style={styles.pasoPaso}>3. Recibes una notificación</Text>
                <Text style={styles.pasoPaso}>4. Vas a recoger tu pedido 🫓</Text>
            </View>

            <TouchableOpacity style={styles.boton}
                onPress={() => navigation.navigate('Home')}>
                <Text style={styles.botonTexto}>Volver al inicio</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow:1, backgroundColor:'#FFF8F2', padding:24, alignItems:'center' },
    iconoContainer: { marginTop:40, marginBottom:16 },
    icono: { fontSize:72 },
    titulo: { fontSize:26, fontWeight:'bold', color:'#1A0F08', marginBottom:8, textAlign:'center' },
    subtitulo: { fontSize:15, color:'#6B5E57', marginBottom:32, textAlign:'center' },
    tarjeta: { backgroundColor:'#FFFFFF', borderRadius:16, padding:20,
        width:'100%', borderWidth:1.5, borderColor:'#E8D5C4', marginBottom:24 },
    fila: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8 },
    etiqueta: { fontSize:14, color:'#6B5E57' },
    valor: { fontSize:14, fontWeight:'600', color:'#1A0F08', maxWidth:'60%', textAlign:'right' },
    valorDestacado: { fontSize:16, fontWeight:'bold', color:'#E8210A' },
    separador: { height:1, backgroundColor:'#F0E0D0' },
    avisoContainer: { backgroundColor:'#FEF3C7', borderRadius:12, padding:16,
        width:'100%', flexDirection:'row', alignItems:'center', gap:12, marginBottom:24 },
    avisoEmoji: { fontSize:24 },
    avisoTexto: { flex:1, fontSize:14, color:'#92400E', lineHeight:20 },
    pasoContainer: { backgroundColor:'#FFFFFF', borderRadius:16, padding:20,
        width:'100%', borderWidth:1.5, borderColor:'#E8D5C4', marginBottom:32, gap:8 },
    pasoTitulo: { fontSize:16, fontWeight:'bold', color:'#1A0F08', marginBottom:4 },
    pasoPaso: { fontSize:14, color:'#6B5E57', lineHeight:22 },
    boton: { backgroundColor:'#E8210A', borderRadius:12, padding:16,
        width:'100%', alignItems:'center' },
    botonTexto: { color:'#FFFFFF', fontSize:16, fontWeight:'bold' },
});