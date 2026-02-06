// mobile/src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, FlatList } from 'react-native';
import { getLatestPrice, getUserAlerts } from '../services/api';

export default function HomeScreen({ onSetAlert, deviceToken }) {
    const [priceData, setPriceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alerts, setAlerts] = useState([]);

    const fetchPrice = useCallback(async () => {
        try {
            const data = await getLatestPrice();
            setPriceData(data);
        } catch (error) {
            console.error('Fetch error:', error);
            // In real app, show error toast
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchAlerts = useCallback(async () => {
        if (!deviceToken) return;
        try {
            const data = await getUserAlerts(deviceToken);
            setAlerts(data);
        } catch (error) {
            console.log('Error fetching alerts', error);
        }
    }, [deviceToken]);

    useEffect(() => {
        fetchPrice();
        fetchAlerts();
    }, [fetchPrice, fetchAlerts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPrice();
        fetchAlerts();
    }, [fetchPrice, fetchAlerts]);

    // Format price with Commas
    const formatPrice = (price) => {
        if (!price) return '---';
        return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.appTitle}>GoldPulse</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.priceContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.priceValue}>
                        {loading ? '...' : formatPrice(priceData?.price)}
                    </Text>
                    <Text style={styles.perGram}>/ g</Text>
                </View>

                <Text style={styles.subtext}>24K Digital Gold · India</Text>
                <Text style={styles.caption}>Indicative price · Updates every 5 minutes</Text>
            </View>

            {alerts.length > 0 && (
                <View style={styles.alertsSection}>
                    <Text style={styles.sectionTitle}>Your Active Alerts</Text>
                    {alerts.map((alert, index) => (
                        <View key={index} style={styles.alertCard}>
                            <View style={styles.alertInfo}>
                                <Text style={styles.alertLabel}>Target Price</Text>
                                <Text style={styles.alertPrice}>₹{parseInt(alert.target_price).toLocaleString()}</Text>
                            </View>
                            <View style={[styles.statusBadge, alert.triggered ? styles.triggeredBadge : styles.waitingBadge]}>
                                <Text style={[styles.statusText, alert.triggered ? styles.triggeredText : styles.waitingText]}>
                                    {alert.triggered ? 'TRIGGERED' : 'ACTIVE'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={onSetAlert}>
                    <Text style={styles.buttonText}>Set Price Alert</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 24,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        letterSpacing: 1,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '500',
        color: '#333',
        marginRight: 4,
    },
    priceValue: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#1A1A1A',
        letterSpacing: -2,
    },
    perGram: {
        fontSize: 24,
        fontWeight: '500',
        color: '#666',
        marginLeft: 8,
    },
    subtext: {
        fontSize: 18,
        fontWeight: '500',
        color: '#D4AF37', // Gold-ish
        marginBottom: 8,
    },
    caption: {
        fontSize: 14,
        color: '#999',
    },
    footer: {
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#1A1A1A',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    alertsSection: {
        width: '100%',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    alertCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    alertInfo: {
        flex: 1,
    },
    alertLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    alertPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    waitingBadge: {
        backgroundColor: '#E8F5E9', // Light Green
    },
    triggeredBadge: {
        backgroundColor: '#FFEBEE', // Light Red
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    waitingText: {
        color: '#2E7D32',
    },
    triggeredText: {
        color: '#C62828',
    },
});
