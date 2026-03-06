import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen() {
    return (
        <View style={styles.container}>
        <Text style={styles.emoji}>🫓</Text>
        <Text style={styles.titulo}>TuPupuseriaApp</Text>
        <Text style={styles.subtitulo}>Las mejores pupuserías cerca de ti</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8210A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    titulo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    subtitulo: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.85,
    },
});