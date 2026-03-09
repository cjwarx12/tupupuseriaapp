import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert
} from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';

export default function PanelPupuseriaScreen({ route, navigation }) {
  const { nombre } = route.params;
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const qPupuseria = query(
      collection(db, 'pupuserias'),
      where('dueno_uid', '==', auth.currentUser.uid)
    );

    const unsubPupuseria = onSnapshot(qPupuseria, (snapshot) => {
      if (!snapshot.empty) {
        const id = snapshot.docs[0].id;
        escucharPedidos(id);
      }
      setCargando(false);
    });

    return () => unsubPupuseria();
  }, []);

  const escucharPedidos = (id) => {
    const qPedidos = query(
      collection(db, 'pedidos'),
      where('pupuseria_id', '==', id),
      where('estado', 'in', ['pendiente', 'listo'])
    );

    onSnapshot(qPedidos, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      lista.sort((a, b) => {
        if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
        if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1;
        return 0;
      });

      setPedidos(lista);
    });
  };

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión.');
            }
          }
        }
      ]
    );
  };

  const marcarListo = async (pedidoId) => {
    try {
      await updateDoc(doc(db, 'pedidos', pedidoId), {
        estado: 'listo'
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el pedido.');
    }
  };

  const marcarEntregado = async (pedidoId) => {
    Alert.alert(
      'Confirmar entrega',
      '¿El cliente ya recogió su pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, entregado',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'pedidos', pedidoId), {
                estado: 'entregado'
              });
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el pedido.');
            }
          }
        }
      ]
    );
  };

  const renderPedido = ({ item }) => {
    const esListo = item.estado === 'listo';

    return (
      <View style={[styles.tarjeta, esListo && styles.tarjetaLista]}>

        <View style={styles.tarjetaHeader}>
          <View style={[styles.badge, esListo ? styles.badgeListo : styles.badgePendiente]}>
            <Text style={styles.badgeTexto}>
              {esListo ? '✅ Listo' : '🕐 Pendiente'}
            </Text>
          </View>
          <Text style={styles.tarjetaTotal}>{item.total} pupusas</Text>
        </View>

        <View style={styles.detalleBox}>
          {item.detalle && item.detalle.map((d, i) => (
            <Text key={i} style={styles.detalleLinea}>
              • {d.cantidad}x {d.tipo}
            </Text>
          ))}
        </View>

        {item.fecha && (
          <Text style={styles.tarjetaFecha}>
            🕐 {item.fecha.toDate
              ? item.fecha.toDate().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
              : 'Ahora'}
          </Text>
        )}

        {!esListo ? (
          <TouchableOpacity
            style={styles.botonListo}
            onPress={() => marcarListo(item.id)}
          >
            <Text style={styles.botonListoTexto}>✅ Marcar como listo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.botonEntregado}
            onPress={() => marcarEntregado(item.id)}
          >
            <Text style={styles.botonEntregadoTexto}>📦 Marcar como entregado</Text>
          </TouchableOpacity>
        )}

      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#E8210A" />
        <Text style={styles.cargandoTexto}>Cargando tu panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Panel de pedidos</Text>
          <Text style={styles.headerNombre}>{nombre}</Text>
        </View>
        <View style={styles.headerDerecha}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeTexto}>
              {pedidos.filter(p => p.estado === 'pendiente').length} nuevos
            </Text>
          </View>
          <TouchableOpacity style={styles.botonCerrarSesion} onPress={cerrarSesion}>
            <Text style={styles.botonCerrarSesionTexto}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.enVivoBar}>
        <View style={styles.enVivoPunto} />
        <Text style={styles.enVivoTexto}>Escuchando pedidos en tiempo real</Text>
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={item => item.id}
        renderItem={renderPedido}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacioCentro}>
            <Text style={styles.vacioEmoji}>🫓</Text>
            <Text style={styles.vacioTexto}>Sin pedidos por ahora</Text>
            <Text style={styles.vacioSub}>
              Cuando un cliente haga un pedido{'\n'}aparecerá aquí al instante
            </Text>
          </View>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F2' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F2' },
  cargandoTexto: { marginTop: 12, fontSize: 14, color: '#6B5E57' },

  header: {
    backgroundColor: '#1A0F08',
    padding: 24,
    paddingTop: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerSub: { fontSize: 12, color: '#9A8A80', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  headerNombre: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerDerecha: { alignItems: 'flex-end', gap: 8 },
  headerBadge: { backgroundColor: '#E8210A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  headerBadgeTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  botonCerrarSesion: { borderWidth: 1, borderColor: '#9A8A80', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  botonCerrarSesionTexto: { color: '#9A8A80', fontSize: 12, fontWeight: '600' },

  enVivoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
    gap: 8,
  },
  enVivoPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  enVivoTexto: { fontSize: 12, color: '#15803D', fontWeight: '600' },

  lista: { padding: 16, gap: 14 },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E8D5C4',
  },
  tarjetaLista: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  tarjetaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgePendiente: { backgroundColor: '#FEF9C3' },
  badgeListo: { backgroundColor: '#DCFCE7' },
  badgeTexto: { fontSize: 12, fontWeight: '700' },
  tarjetaTotal: { fontSize: 18, fontWeight: '800', color: '#E8210A' },

  detalleBox: { marginBottom: 10, gap: 4 },
  detalleLinea: { fontSize: 14, color: '#1A0F08' },
  tarjetaFecha: { fontSize: 12, color: '#6B5E57', marginBottom: 14 },

  botonListo: { backgroundColor: '#E8210A', borderRadius: 12, padding: 14, alignItems: 'center' },
  botonListoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  botonEntregado: { backgroundColor: '#1A0F08', borderRadius: 12, padding: 14, alignItems: 'center' },
  botonEntregadoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  vacioCentro: { alignItems: 'center', marginTop: 60 },
  vacioEmoji: { fontSize: 48, marginBottom: 16 },
  vacioTexto: { fontSize: 18, fontWeight: '800', color: '#1A0F08', marginBottom: 8 },
  vacioSub: { fontSize: 14, color: '#6B5E57', textAlign: 'center', lineHeight: 20 },
});