import { View, Image, StyleSheet, Animated, Text } from 'react-native';
import { useEffect, useRef } from 'react';

export default function SplashScreen() {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 40,
                friction: 6,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.contenido, {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
            }]}>
                <Image
                    source={require('../assets/logo-tupupuseria-final-perfecto.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.nombre}>
                    <Text style={styles.nombreNegro}>TuPupuseria</Text>
                    <Text style={styles.nombreRojo}>App</Text>
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contenido: {
        alignItems: 'center',
    },
    logo: {
        width: 260,
        height: 260,
    },
    nombre: {
        fontSize: 32,
        letterSpacing: -0.5,
        marginTop: 8,
    },
    nombreNegro: {
        color: '#1A0F08',
        fontWeight: '900',
    },
    nombreRojo: {
        color: '#E8210A',
        fontWeight: '900',
    },
});