import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import AlertStatus from './AlertStatus';

const HomeScreen = ({
    priceData,
    activeAlerts, // Changed from activeAlert
    loading,
    onRefresh,
    onSetAlert,
    onCancelAlert
}) => {
    const currentPrice = priceData?.price;

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                {/* Placeholder for Logo */}
                <View style={styles.logoPlaceholder} />
                <Text style={styles.appName}>GoldPulse</Text>
            </View>

            <View style={styles.priceContainer}>
                <Text style={styles.price}>
                    {currentPrice ? `₹${currentPrice.toLocaleString('en-IN')} / g` : '---'}
                </Text>
                <Text style={styles.subtext}>24K Digital Gold · India</Text>
                <Text style={styles.caption}>Indicative price · Updates every 5 minutes</Text>
            </View>

            <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.setAlertButton} onPress={onSetAlert}>
                    <Text style={styles.setAlertText}>+ Set New Alert</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Your Alerts</Text>

            <View style={styles.alertSection}>
                {activeAlerts && activeAlerts.length > 0 ? (
                    activeAlerts.map((alert) => (
                        <AlertStatus
                            key={alert.id}
                            alert={alert}
                            currentPrice={currentPrice}
                            onCancel={onCancelAlert} // This now expects ID
                            onSetNew={onSetAlert}
                        />
                    ))
                ) : (
                    <View style={styles.emptyAlert}>
                        <Text style={styles.emptyText}>No active alerts</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
        alignItems: 'center',
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: '#FFD700',
        borderRadius: 20,
        marginBottom: 8,
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        letterSpacing: 0.5,
    },
    priceContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    price: {
        fontSize: 42,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtext: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    caption: {
        fontSize: 12,
        color: '#999',
    },
    actionContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    setAlertButton: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 2,
    },
    setAlertText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    alertSection: {
        width: '100%',
        paddingBottom: 40,
    },
    emptyAlert: {
        alignItems: 'center',
        marginTop: 20,
    },
    emptyText: {
        color: '#999',
        marginBottom: 16,
    }
});

export default HomeScreen;
