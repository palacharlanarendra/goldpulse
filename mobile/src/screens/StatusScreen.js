// mobile/src/screens/StatusScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function StatusScreen({ alert, onBack, onReset }) {
    if (!alert) return null;

    const isTriggered = alert.triggered;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Dashboard</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={[styles.statusBadge, isTriggered ? styles.triggeredBadge : styles.waitingBadge]}>
                    <Text style={[styles.statusText, isTriggered ? styles.triggeredText : styles.waitingText]}>
                        {isTriggered ? 'ALERT TRIGGERED' : 'ACTIVE'}
                    </Text>
                </View>

                <Text style={styles.targetLabel}>Target Price</Text>
                <Text style={styles.targetPrice}>₹{parseInt(alert.target_price).toLocaleString()}</Text>

                <Text style={styles.message}>
                    {isTriggered
                        ? "Check the market now!"
                        : "You'll receive a notification when the price drops below this target."
                    }
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.outlineButton} onPress={onReset}>
                    <Text style={styles.outlineButtonText}>
                        {isTriggered ? 'Set New Alert' : 'Cancel Alert'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
    },
    header: {
        marginTop: 60,
    },
    backText: {
        fontSize: 16,
        color: '#666',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 24,
    },
    waitingBadge: {
        backgroundColor: '#E8F5E9', // Light Green
    },
    triggeredBadge: {
        backgroundColor: '#FFEBEE', // Light Red
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    waitingText: {
        color: '#2E7D32',
    },
    triggeredText: {
        color: '#C62828',
    },
    targetLabel: {
        fontSize: 14,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    targetPrice: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 24,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    footer: {
        marginBottom: 40,
    },
    outlineButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#EEE',
    },
    outlineButtonText: {
        color: '#1A1A1A',
        fontSize: 18,
        fontWeight: '600',
    }
});
