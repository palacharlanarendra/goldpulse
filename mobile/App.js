// mobile/App.js
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import SetAlertScreen from './src/screens/SetAlertScreen';
import StatusScreen from './src/screens/StatusScreen';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { getUserAlerts } from './src/services/api';

// Simple Router (Avoiding React Navigation for simplicity as per "No navigation complexity" rule)
// Views: 'HOME', 'SET_ALERT', 'STATUS'

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('LOADING');
    const [deviceToken, setDeviceToken] = useState(null);
    const [activeAlert, setActiveAlert] = useState(null);

    useEffect(() => {
        async function init() {
            // 1. Get Token
            // In real app, persist this
            const token = await registerForPushNotificationsAsync();
            setDeviceToken(token);

            // 2. Check for existing alerts
            if (token) {
                try {
                    // Check for alerts but don't auto-redirect, let Home show them
                    await getUserAlerts(token);
                } catch (e) {
                    console.log('Error fetching initial alerts:', e);
                }
            }

            setCurrentScreen('HOME');
        }

        init();
    }, []);

    const navigateTo = (screen) => {
        setCurrentScreen(screen);
    };

    const onAlertCreated = (alertData) => {
        setActiveAlert({
            target_price: alertData.target_price,
            triggered: false
        });
        setCurrentScreen('STATUS');
    };

    if (currentScreen === 'LOADING') {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {currentScreen === 'HOME' && (
                <HomeScreen
                    onSetAlert={() => navigateTo('SET_ALERT')}
                    deviceToken={deviceToken}
                />
            )}
            {currentScreen === 'SET_ALERT' && (
                <SetAlertScreen
                    deviceToken={deviceToken}
                    onSuccess={onAlertCreated}
                    onBack={() => navigateTo('HOME')}
                />
            )}
            {currentScreen === 'STATUS' && (
                <StatusScreen
                    alert={activeAlert}
                    onBack={() => navigateTo('HOME')}
                    onReset={() => {
                        setActiveAlert(null);
                        navigateTo('HOME');
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Calm background
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
