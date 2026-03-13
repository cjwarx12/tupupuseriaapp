import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';

export default function PanelPupuseriaScreen({ route, navigation }) {
  const { nombre } = route.params;
  const [pedidos, setPedidos] = useState([]);
  const [totalHoy, setTotalHoy] = useState(0);
  const [cargando, setCargando] = useState(true);

  const unsubPupuseriaRef = useRef(null);
  const unsubPedidosRef = useRef(null);
  const unsubTotalRef = useRef(null);

  useEffect(() => {
    let activo = true;

    const iniciarListeners = async () => {
      try {
        await auth.currentUser.getIdToken(true);
        if (!activo) return;

        const qPupuseria = query(
          collection(db, 'pupuserias'),
          where('dueno_uid', '==', auth.currentUser.uid)
        );

        unsubPupuseriaRef.current = onSnapshot(qPupuseria, (snapshot) => {
          if (!activo) return;
          if (!snapshot.empty) {
            const id = snapshot.docs[0].id;
            escucharPedidos(id, activo);
            escucharTotalHoy(id, activo);
          }
          setCargando(false);
        }, (error) => {
          console.log('Error listener pupuseria:', error.code);
          setCargando(false);
        });

      } catch (error) {
        console.log('Error iniciando listeners:', error);
        setCargando(false);
      }
    };

    iniciarListeners();

    return () => {
      activo = false;
      if (unsubPupuseriaRef.current) unsubPupuseriaRef.current();
      if (unsubPedidosRef.current) unsubPedidosRef.current();
      if (unsubTotalRef.current) unsubTotalRef.current();
    };
  }, []);

  const escucharPedidos = (id, activo) => {
    if (unsubPedidosRef.current) unsubPedidosRef.current();

    const qPedidos = query(
      collection(db, 'pedidos'),
      where('pupuseria_id', '==', id),
      where('estado', 'in', ['pendiente', 'listo'])
    );

    unsubPedidosRef.current = onSnapshot(qPedidos, (snapshot) => {
      if (!activo) return;
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      lista.sort((a, b) => {
        if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
        if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1;
        if (a.fecha && b.fecha) return a.fecha.seconds - b.fecha.seconds;
        return 0;
      });

      setPedidos(lista);
    }, (error) => {
      console.log('Error listener pedidos:', error.code);
    });
  };

  const escucharTotalHoy = (id, activo) => {
    if (unsubTotalRef.current) unsubTotalRef.current();

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const qTotal = query(
      collection(db, 'pedidos'),
      where('pupuseria_id', '==', id),
    );

    unsubTotalRef.current = onSnapshot(qTotal, (snapshot) => {
      if (!activo) return;
      const hoy = snapshot.docs.filter(doc => {
        const fecha = doc.data().fecha;
        if (!fecha) return false;
        return fecha.toDate() >= inicioHoy;
      });
      setTotalHoy(hoy.length);
    }, (error) => {
      console.log('Error listener total:', error.code);
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
            if (unsubPupuseriaRef.current) unsubPupuseriaRef.current();
            if (unsubPedidosRef.current) unsubPedidosRef.current();
            if (unsubTotalRef.current) unsubTotalRef.current();
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
      await updateDoc(doc(db, 'pedidos', pedidoId), { estado: 'listo' });
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
              await updateDoc(doc(db, 'pedidos', pedidoId), { estado: 'entregado' });
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el pedido.');
            }
          }
        }
      ]
    );
  };

  const numeroPedido = (index) => {
    const num = (index + 1).toString().padStart(2, '0');
    return `Pedido #${num}`;
  };

  const tiempoRelativo = (fecha) => {
    if (!fecha || !fecha.toDate) return '';
    const ahora = new Date();
    const diff = Math.floor((ahora - fecha.toDate()) / 60000);
    if (diff < 1) return 'ahora';
    if (diff === 1) return 'hace 1 min';
    return `hace ${diff} min`;
  };

  const renderPedido = ({ item, index }) => {
    const esListo = item.estado === 'listo';
    return (
      <View style={[styles.tarjeta, esListo && styles.tarjetaLista]}>

        <View style={styles.tarjetaHeader}>
          <View style={styles.tarjetaHeaderIzq}>
            <Text style={styles.numeroPedido}>{numeroPedido(index)}</Text>
            <View style={[styles.badge, esListo ? styles.badgeListo : styles.badgePendiente]}>
              <Text style={styles.badgeTexto}>
                {esListo ? '✅ Listo' : '🕐 Pendiente'}
              </Text>
            </View>
          </View>
          <Text style={styles.tiempoTexto}>{tiempoRelativo(item.fecha)}</Text>
        </View>

        <View style={styles.detalleBox}>
          {item.detalle && (() => {
            const items = item.detalle;
            const filas = [];
            for (let i = 0; i < items.length; i += 2) {
              filas.push(
                <View key={i} style={styles.detalleFila}>
                  <Text style={styles.detalleLinea}>
                    · {items[i].cantidad} {items[i].tipo}
                  </Text>
                  {items[i + 1] && (
                    <Text style={styles.detalleLinea}>
                      · {items[i + 1].cantidad} {items[i + 1].tipo}
                    </Text>
                  )}
                </View>
              );
            }
            return filas;
          })()}
        </View>

        <View style={styles.tarjetaFooter}>
          <Text style={styles.totalItems}>
            {item.total} items · <Text style={styles.totalPrecio}>${item.total_precio ? item.total_precio.toFixed(2) : '—'}</Text>
          </Text>
          {!esListo ? (
            <TouchableOpacity style={styles.botonListo} onPress={() => marcarListo(item.id)}>
              <Text style={styles.botonListoTexto}>✅ Marcar como LISTO</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.botonEntregado} onPress={() => marcarEntregado(item.id)}>
              <Text style={styles.botonEntregadoTexto}>📦 Cliente recogiendo...</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <StatusBar backgroundColor="#1C0A00" barStyle="light-content" />
        <ActivityIndicator size="large" color="#D4850A" />
        <Text style={styles.cargandoTexto}>Cargando tu panel...</Text>
      </View>
    );
  }

  const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1C0A00" barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Panel de pedidos</Text>
          <Text style={styles.headerNombre}>{nombre}</Text>
        </View>
        <View style={styles.headerDerecha}>
          {pendientes > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeTexto}>{pendientes} nuevos</Text>
            </View>
          )}
          <TouchableOpacity style={styles.botonCerrarSesion} onPress={cerrarSesion}>
            <Text style={styles.botonCerrarSesionTexto}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats compactas */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>{totalHoy}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>{pedidos.length}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>{pendientes}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statAccion} onPress={() => navigation.navigate('MiSaldo')}>
          <Text style={styles.statAccionTexto}>💳</Text>
          <Text style={styles.statLabel}>Saldo</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statAccion} onPress={() => navigation.navigate('GestionarMenu')}>
          <Text style={styles.statAccionTexto}>🍽️</Text>
          <Text style={styles.statLabel}>Menú</Text>
        </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#1C0A00' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C0A00' },
  cargandoTexto: { marginTop: 12, fontSize: 14, color: '#B0956A' },

  header: {
    backgroundColor: '#1C0A00',
    padding: 24,
    paddingTop: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#3A2008',
  },
  headerSub: { fontSize: 12, color: '#7A5C3A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  headerNombre: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerDerecha: { alignItems: 'flex-end', gap: 8 },
  headerBadge: { backgroundColor: '#D4850A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  headerBadgeTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  botonCerrarSesion: { borderWidth: 1, borderColor: '#3A2008', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  botonCerrarSesionTexto: { color: '#7A5C3A', fontSize: 12, fontWeight: '600' },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#140800',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A2008',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statAccion: { flex: 1, alignItems: 'center' },
  statAccionTexto: { fontSize: 16 },
  statNumero: { fontSize: 16, fontWeight: '800', color: '#D4850A' },
  statLabel: { fontSize: 9, color: '#7A5C3A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28, backgroundColor: '#3A2008' },

  enVivoBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A1A0F', padding: 8, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#0F2A18',
    gap: 8,
  },
  enVivoPunto: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  enVivoTexto: { fontSize: 11, color: '#16A34A', fontWeight: '600' },

  lista: { padding: 16, gap: 12 },

  tarjeta: {
    backgroundColor: '#2A1200',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A2008',
  },
  tarjetaLista: {
    borderColor: '#14532D',
    backgroundColor: '#0A1F12',
  },

  tarjetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tarjetaHeaderIzq: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numeroPedido: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgePendiente: { backgroundColor: '#3A2800' },
  badgeListo: { backgroundColor: '#0A2A14' },
  badgeTexto: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  tiempoTexto: { fontSize: 11, color: '#7A5C3A' },

  detalleBox: { marginBottom: 14, gap: 6 },
  detalleFila: { flexDirection: 'row', gap: 8 },
  detalleLinea: { flex: 1, fontSize: 13, color: '#C4A882' },

  tarjetaFooter: { gap: 10 },
  totalItems: { fontSize: 14, color: '#B0956A', fontWeight: '600' },
  totalPrecio: { fontSize: 14, color: '#D4850A', fontWeight: '800' },

  botonListo: {
    backgroundColor: '#D4850A',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  botonListoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  botonEntregado: {
    backgroundColor: '#14532D',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  botonEntregadoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  vacioCentro: { alignItems: 'center', marginTop: 60 },
  vacioEmoji: { fontSize: 48, marginBottom: 16 },
  vacioTexto: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  vacioSub: { fontSize: 14, color: '#7A5C3A', textAlign: 'center', lineHeight: 20 },
});