import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, getDocsFromServer } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function MiSaldoScreen({ navigation }) {
    const [suscripcion, setSuscripcion] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarSuscripcion();
    }, []);

    const cargarSuscripcion = async () => {
        try {
            const q = query(
                collection(db, 'suscripciones'),
                where('dueno_uid', '==', auth.currentUser.uid)
            );
            const snapshot = await getDocsFromServer(q);

            if (!snapshot.empty) {
                const datos = snapshot.docs[0].data();
                setSuscripcion(datos);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo cargar la información de suscripción.');
        }
        setCargando(false);
    };

    const calcularDiasRestantes = (fechaVencimiento) => {
        const hoy = new Date();
        const vencimiento = fechaVencimiento.toDate();
        const diferencia = vencimiento - hoy;
        const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
        return dias;
    };

    const formatearFecha = (timestamp) => {
        const fecha = timestamp.toDate();
        return fecha.toLocaleDateString('es-SV', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const solicitarRenovacion = () => {
        Alert.alert(
            'Renovar suscripción',
            'Para renovar tu suscripción comunícate con nosotros:\n\nWhatsApp: +503 0000-0000\n\nTu mensualidad es de $1.00 al mes.',
            [{ text: 'Entendido', style: 'default' }]
        );
    };

    if (cargando) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator size="large" color="#E8210A" />
                <Text style={styles.cargandoTexto}>Cargando tu saldo...</Text>
            </View>
        );
    }

    if (!suscripcion) {
        return (
            <View style={styles.centrado}>
                <Text style={styles.vacioEmoji}>⚠️</Text>
                <Text style={styles.vacioTexto}>No se encontró suscripción</Text>
            </View>
        );
    }

    const diasRestantes = calcularDiasRestantes(suscripcion.fecha_vencimiento);
    const estaVigente = diasRestantes > 0;
    const esCritico = diasRestantes <= 5 && diasRestantes > 0;

    return (
        <ScrollView contentContainerStyle={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botonRegresar}>
                    <Text style={styles.botonRegresarTexto}>← Regresar a los Pedidos</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitulo}>Mi saldo</Text>
            </View>

            {/* Tarjeta principal de estado */}
            <View style={[styles.tarjetaEstado, estaVigente ? styles.tarjetaVigente : styles.tarjetaVencida]}>
                <Text style={styles.estadoIcono}>{estaVigente ? '✅' : '🔒'}</Text>
                <Text style={styles.estadoTitulo}>
                    {estaVigente ? 'Suscripción activa' : 'Suscripción vencida'}
                </Text>
                {estaVigente ? (
                    <Text style={styles.estadoDias}>
                        {diasRestantes} {diasRestantes === 1 ? 'día restante' : 'días restantes'}
                    </Text>
                ) : (
                    <Text style={styles.estadoDias}>Tu acceso está pausado</Text>
                )}
            </View>

            {/* Aviso si quedan 5 días o menos */}
            {esCritico && (
                <View style={styles.tarjetaAviso}>
                    <Text style={styles.avisoTexto}>
                        ⚠️ Tu suscripción vence pronto. Renueva antes de que se acabe para no perder el acceso.
                    </Text>
                </View>
            )}

            {/* Detalle de la suscripción */}
            <View style={styles.tarjeta}>
                <Text style={styles.tarjetaTitulo}>Detalle de suscripción</Text>

                <View style={styles.fila}>
                    <Text style={styles.filaLabel}>Estado</Text>
                    <Text style={[styles.filaValor, estaVigente ? styles.colorVerde : styles.colorRojo]}>
                        {estaVigente ? 'Activa' : 'Vencida'}
                    </Text>
                </View>

                <View style={styles.separador} />

                <View style={styles.fila}>
                    <Text style={styles.filaLabel}>Tipo</Text>
                    <Text style={styles.filaValor}>
                        {suscripcion.es_trial ? 'Período de prueba' : 'Mensualidad'}
                    </Text>
                </View>

                <View style={styles.separador} />

                <View style={styles.fila}>
                    <Text style={styles.filaLabel}>Inicio</Text>
                    <Text style={styles.filaValor}>{formatearFecha(suscripcion.fecha_inicio)}</Text>
                </View>

                <View style={styles.separador} />

                <View style={styles.fila}>
                    <Text style={styles.filaLabel}>Vencimiento</Text>
                    <Text style={styles.filaValor}>{formatearFecha(suscripcion.fecha_vencimiento)}</Text>
                </View>

                <View style={styles.separador} />

                <View style={styles.fila}>
                    <Text style={styles.filaLabel}>Mensualidad</Text>
                    <Text style={styles.filaValor}>$1.00 / mes</Text>
                </View>
            </View>

            {/* Botón renovar */}
            <TouchableOpacity style={styles.botonRenovar} onPress={solicitarRenovacion}>
                <Text style={styles.botonRenovarTexto}>Renovar suscripción</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#FFF8F2',
        paddingBottom: 40,
    },
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF8F2',
    },
    cargandoTexto: { marginTop: 12, fontSize: 14, color: '#6B5E57' },
    vacioEmoji: { fontSize: 40, marginBottom: 12 },
    vacioTexto: { fontSize: 16, color: '#6B5E57' },

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
    botonRegresarTexto: {
        color: '#1A0F08',
        fontSize: 14,
        fontWeight: '700',
    },
    headerTitulo: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },

    tarjetaEstado: {
        margin: 20,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    tarjetaVigente: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
    tarjetaVencida: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
    estadoIcono: { fontSize: 40, marginBottom: 10 },
    estadoTitulo: { fontSize: 18, fontWeight: '800', color: '#1A0F08', marginBottom: 6 },
    estadoDias: { fontSize: 15, color: '#6B5E57' },

    tarjetaAviso: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#FEF9C3',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    avisoTexto: { fontSize: 13, color: '#92400E', lineHeight: 20 },

    tarjeta: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#E8D5C4',
    },
    tarjetaTitulo: { fontSize: 15, fontWeight: '700', color: '#1A0F08', marginBottom: 16 },

    fila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    filaLabel: { fontSize: 14, color: '#6B5E57' },
    filaValor: { fontSize: 14, fontWeight: '600', color: '#1A0F08' },
    colorVerde: { color: '#16A34A' },
    colorRojo: { color: '#E8210A' },

    separador: { height: 1, backgroundColor: '#E8D5C4' },

    botonRenovar: {
        backgroundColor: '#E8210A',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        alignItems: 'center',
    },
    botonRenovarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});