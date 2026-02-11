import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

const AlertStatus = ({ alert, currentPrice, onCancel, onSetNew }) => {
    const [loading, setLoading] = useState(false);

    if (!alert) return null;

    const isTriggered = alert.triggered;
    const direction = alert.direction || 'BELOW';

    const handleCancel = () => {
        if (isTriggered) {
            // For triggered alerts, just remove them without scary confirmation
            performCancel();
        } else {
            Alert.alert(
                "Delete Alert?",
                "Are you sure you want to delete this alert?",
                [
                    { text: "No", style: "cancel" },
                    { text: "Yes, Delete", style: "destructive", onPress: performCancel }
                ]
            );
        }
    };

    const performCancel = async () => {
        setLoading(true);
        await onCancel(alert.id);
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.label}>Target Price ({direction})</Text>
                    <Text style={styles.price}>₹{alert.target_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                </View>
                {/* 
                  Optional: Display direction icon or text clearly. 
                  Included in label above for simplicity. 
                */}
            </View>

            <View style={[styles.badge, isTriggered ? styles.triggered : styles.active]}>
                <Text style={styles.badgeText}>
                    {isTriggered ? 'ALERT TRIGGERED' : 'ACTIVE'}
                </Text>
            </View>

            <Text style={styles.message}>
                {isTriggered
                    ? `Price reached target ${direction.toLowerCase()} ₹${Number(alert.target_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                    : `You'll be notified when price goes ${direction.toLowerCase()}`}
            </Text>

            {isTriggered ? (
                // If triggered, we can just delete/dismiss it or set new.
                // For now, let's allow "Set New" which probably just opens the modal, 
                // AND a "Dismiss" to remove it from list? 
                // Req: "allow multiple alerts".
                // Triggered alerts stay in history? 
                // "Actions: Cancel alert".
                // Let's assume triggered alerts are just informational until removed?
                // Or maybe they should be removed automatically?
                // Provide a "Remove" button for triggered alerts.
                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.button, styles.removeButton]} onPress={handleCancel} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Remove</Text>}
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={loading}>
                    {loading ? <ActivityIndicator color="#d32f2f" size="small" /> : <Text style={styles.cancelText}>Cancel Alert</Text>}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#eee'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginBottom: 12,
    },
    active: {
        backgroundColor: '#e3f2fd',
    },
    triggered: {
        backgroundColor: '#ffebee',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    message: {
        fontSize: 14,
        color: '#444',
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginLeft: 10,
    },
    removeButton: {
        backgroundColor: '#666',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 8,
    },
    cancelText: {
        color: '#d32f2f',
        fontWeight: '500',
    },
});

export default AlertStatus;
