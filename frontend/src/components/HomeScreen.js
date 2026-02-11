import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image, SafeAreaView } from 'react-native';
import AlertStatus from './AlertStatus';

const HomeScreen = ({
    priceData,
    activeAlerts,
    loading,
    onRefresh,
    onSetAlert,
    onCancelAlert
}) => {
    const currentPrice = priceData?.price;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.fixedHeader}>
                <View style={styles.logoRow}>
                    <Image
                        source={require('../assets/logo.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.appName}>GoldPulse</Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                        {currentPrice
                            ? `₹${currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / g`
                            : '---'}
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
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} />
                }
            >
                <View style={styles.alertSection}>
                    {activeAlerts && activeAlerts.length > 0 ? (
                        activeAlerts.map((alert) => (
                            <AlertStatus
                                key={alert.id}
                                alert={alert}
                                currentPrice={currentPrice}
                                onCancel={onCancelAlert}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    fixedHeader: {
        paddingTop: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
        elevation: 2, // Slight shadow for fixed feel
        zIndex: 10,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginRight: 10,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        letterSpacing: 0.5,
    },
    priceContainer: {
        alignItems: 'center',
        marginBottom: 20,
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
        marginBottom: 15,
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
        marginTop: 5,
        marginBottom: 5,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
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
