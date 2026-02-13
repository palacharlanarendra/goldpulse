import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

const AlertStatus = ({ alert, onCancel }) => {
    const [loading, setLoading] = useState(false);

    if (!alert) return null;

    const isTriggered = alert.triggered;
    const direction = alert.direction || 'BELOW';

    const handleRemove = async () => {
        setLoading(true);
        await onCancel(alert.id);
        setLoading(false);
    };

    return (
        <View style={styles.card}>
            {/* Left Side: Info */}
            <View style={styles.infoContainer}>
                <View style={styles.row}>
                    <Text style={styles.targetLabel}>Target:</Text>
                    <Text style={styles.targetPrice}>
                        ₹{Number(alert.target_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Text>
                </View>
                <Text style={styles.conditionText}>
                    {isTriggered
                        ? `Triggered (${direction.toLowerCase()})`
                        : `When price goes ${direction.toLowerCase()}`}
                </Text>
            </View>

            {/* Right Side: Action */}
            <View style={styles.actionContainer}>
                {isTriggered ? (
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={handleRemove}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.removeButtonText}>Remove</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleRemove}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#d32f2f" />
                        ) : (
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    infoContainer: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    targetLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 6,
    },
    targetPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    conditionText: {
        fontSize: 12,
        color: '#888',
    },
    actionContainer: {
        marginLeft: 10,
    },
    removeButton: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cancelButtonText: {
        color: '#d32f2f',
        fontSize: 12,
        fontWeight: '600',
    }
});

export default AlertStatus;
