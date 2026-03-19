import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';

const enviarNotificacion = async (token, numeroPedido, nombrePupuseria) => {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title: '🫓 ¡Tu pedido está listo!',
        body: `Tu pedido #${numeroPedido} en ${nombrePupuseria} ya está listo para recoger`,
        sound: 'default',
        data: { tipo: 'pedido_listo' },
      }),
    });
  } catch (error) {
    console.log('Error enviando notificacion:', error);
  }
};

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
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
            try { await signOut(auth); }
            catch (error) { Alert.alert('Error', 'No se pudo cerrar sesión.'); }
          }
        }
      ]
    );
  };

  const marcarListo = async (pedido, index) => {
    try {
      // Actualizar estado en Firestore
      await updateDoc(doc(db, 'pedidos', pedido.id), { estado: 'listo' });

      // Buscar token del cliente para enviarle notificacion
      const qUsuario = query(
        collection(db, 'usuarios'),
        where('uid', '==', pedido.cliente_uid)
      );
      const snapshotUsuario = await getDocs(qUsuario);

      if (!snapshotUsuario.empty) {
        const cliente = snapshotUsuario.docs[0].data();
        if (cliente.tokenNotificacion) {
          const numPedido = (index + 1).toString().padStart(2, '0');
          await enviarNotificacion(cliente.tokenNotificacion, numPedido, nombre);
        }
      }
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
            try { await updateDoc(doc(db, 'pedidos', pedidoId), { estado: 'entregado' }); }
            catch (error) { Alert.alert('Error', 'No se pudo actualizar el pedido.'); }
          }
        }
      ]
    );
  };

  const numeroPedido = (index) => `Pedido #${(index + 1).toString().padStart(2, '0')}`;

  const tiempoRelativo = (fecha) => {
    if (!fecha || !fecha.toDate) return '';
    const diff = Math.floor((new Date() - fecha.toDate()) / 60000);
    if (diff < 1) return 'ahora';
    if (diff === 1) return 'hace 1 min';
    return `hace ${diff} min`;
  };

  const renderPedido = ({ item, index }) => {
    const esListo = item.estado === 'listo';
    const detalle = item.detalle || [];

    const pupusasMap = {};
    detalle.filter(i => i.categoria === 'pupusa' || i.masa).forEach(i => {
      if (!pupusasMap[i.tipo]) pupusasMap[i.tipo] = { nombre: i.tipo, maiz: 0, arroz: 0 };
      if (i.masa === 'arroz') pupusasMap[i.tipo].arroz += i.cantidad;
      else pupusasMap[i.tipo].maiz += i.cantidad;
    });
    const pupusas = Object.values(pupusasMap);
    const otros = detalle.filter(i => i.categoria !== 'pupusa' && !i.masa);

    return (
      <View style={[styles.tarjeta, esListo && styles.tarjetaLista]}>
        <View style={styles.tarjetaHeader}>
          <View style={styles.tarjetaHeaderIzq}>
            <Text style={styles.numeroPedido}>{numeroPedido(index)}</Text>
            <View style={[styles.badge, esListo ? styles.badgeListo : styles.badgePendiente]}>
              <Text style={styles.badgeTexto}>{esListo ? '✅ Listo' : '🕐 Pendiente'}</Text>
            </View>
          </View>
          <Text style={styles.tiempoTexto}>{tiempoRelativo(item.fecha)}</Text>
        </View>

        {pupusas.length > 0 && (
          <View style={styles.tablaDetalle}>
            <View style={styles.tablaHeader}>
              <Text style={styles.tablaHeaderVar}>VARIEDAD</Text>
              <Text style={styles.tablaHeaderMasa}>🌽 MAÍZ</Text>
              <Text style={styles.tablaHeaderMasa}>🍚 ARROZ</Text>
            </View>
            {pupusas.map((p) => (
              <View key={p.nombre} style={styles.tablaFila}>
                <Text style={styles.tablaNombre}>{p.nombre}</Text>
                <Text style={styles.tablaCantidad}>{p.maiz > 0 ? p.maiz : '—'}</Text>
                <Text style={styles.tablaCantidad}>{p.arroz > 0 ? p.arroz : '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {otros.length > 0 && (
          <View style={styles.otrosBox}>
            <Text style={styles.otrosLabel}>🥤 Bebidas y otros</Text>
            {(() => {
              const filas = [];
              for (let i = 0; i < otros.length; i += 2) {
                filas.push(
                  <View key={i} style={styles.detalleFila}>
                    <Text style={styles.detalleLinea}>· {otros[i].cantidad} {otros[i].tipo}</Text>
                    {otros[i + 1] && (
                      <Text style={styles.detalleLinea}>· {otros[i + 1].cantidad} {otros[i + 1].tipo}</Text>
                    )}
                  </View>
                );
              }
              return filas;
            })()}
          </View>
        )}

        <View style={styles.tarjetaFooter}>
          <Text style={styles.totalItems}>
            {item.total} items · <Text style={styles.totalPrecio}>${item.total_precio ? item.total_precio.toFixed(2) : '—'}</Text>
          </Text>
          {!esListo ? (
            <TouchableOpacity style={styles.botonListo} onPress={() => marcarListo(item, index)}>
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
    backgroundColor: '#1C0A00', padding: 24, paddingTop: 56,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderBottomWidth: 1, borderBottomColor: '#3A2008',
  },
  headerSub: { fontSize: 12, color: '#7A5C3A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  headerNombre: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerDerecha: { alignItems: 'flex-end', gap: 8 },
  headerBadge: { backgroundColor: '#D4850A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  headerBadgeTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  botonCerrarSesion: { borderWidth: 1, borderColor: '#3A2008', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  botonCerrarSesionTexto: { color: '#7A5C3A', fontSize: 12, fontWeight: '600' },
  statsBar: {
    flexDirection: 'row', backgroundColor: '#140800',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#3A2008', alignItems: 'center',
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
    borderBottomWidth: 1, borderBottomColor: '#0F2A18', gap: 8,
  },
  enVivoPunto: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  enVivoTexto: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
  lista: { padding: 16, gap: 12 },
  tarjeta: { backgroundColor: '#2A1200', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#3A2008' },
  tarjetaLista: { borderColor: '#14532D', backgroundColor: '#0A1F12' },
  tarjetaHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  tarjetaHeaderIzq: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numeroPedido: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgePendiente: { backgroundColor: '#3A2800' },
  badgeListo: { backgroundColor: '#0A2A14' },
  badgeTexto: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  tiempoTexto: { fontSize: 11, color: '#7A5C3A' },
  tablaDetalle: {
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: '#3A2008', marginBottom: 10,
  },
  tablaHeader: {
    flexDirection: 'row', backgroundColor: '#3A1A00',
    paddingVertical: 5, paddingHorizontal: 10,
  },
  tablaHeaderVar: { flex: 1.5, fontSize: 10, fontWeight: '800', color: '#D4850A', letterSpacing: 0.5 },
  tablaHeaderMasa: {
    flex: 1, fontSize: 10, fontWeight: '800', color: '#B0956A',
    textAlign: 'center', letterSpacing: 0.3,
    borderLeftWidth: 1, borderLeftColor: '#3A2008',
  },
  tablaFila: {
    flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10,
    borderTopWidth: 1, borderTopColor: '#3A2008',
  },
  tablaNombre: { flex: 1.5, fontSize: 12, color: '#C4A882', fontWeight: '600' },
  tablaCantidad: {
    flex: 1, fontSize: 12, fontWeight: '800', color: '#D4850A',
    textAlign: 'center',
    borderLeftWidth: 1, borderLeftColor: '#3A2008',
  },
  otrosBox: {
    borderTopWidth: 1, borderTopColor: '#3A2008',
    paddingTop: 8, marginBottom: 10, gap: 4,
  },
  otrosLabel: { fontSize: 10, color: '#7A5C3A', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detalleFila: { flexDirection: 'row', gap: 8 },
  detalleLinea: { flex: 1, fontSize: 12, color: '#C4A882' },
  tarjetaFooter: { gap: 10 },
  totalItems: { fontSize: 14, color: '#B0956A', fontWeight: '600' },
  totalPrecio: { fontSize: 14, color: '#D4850A', fontWeight: '800' },
  botonListo: { backgroundColor: '#D4850A', borderRadius: 10, padding: 12, alignItems: 'center' },
  botonListoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  botonEntregado: { backgroundColor: '#14532D', borderRadius: 10, padding: 12, alignItems: 'center' },
  botonEntregadoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  vacioCentro: { alignItems: 'center', marginTop: 60 },
  vacioEmoji: { fontSize: 48, marginBottom: 16 },
  vacioTexto: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  vacioSub: { fontSize: 14, color: '#7A5C3A', textAlign: 'center', lineHeight: 20 },
});