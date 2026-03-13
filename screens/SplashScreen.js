import { View, Image, StyleSheet, Animated, Text, StatusBar } from 'react-native';
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
            <StatusBar backgroundColor="#FDF6EE" barStyle="dark-content" />
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
                    <Text style={styles.nombreOscuro}>TuPupuseria</Text>
                    <Text style={styles.nombreDorado}>App</Text>
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF6EE',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
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
    nombreOscuro: {
        color: '#2D1200',
        fontWeight: '900',
    },
    nombreDorado: {
        color: '#D4850A',
        fontWeight: '900',
    },
});