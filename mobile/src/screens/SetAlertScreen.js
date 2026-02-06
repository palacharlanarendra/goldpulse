// mobile/src/screens/SetAlertScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { getLatestPrice, createAlert } from '../services/api';

export default function SetAlertScreen({ deviceToken, onSuccess, onBack }) {
    const [targetPrice, setTargetPrice] = useState('');
    const [currentPrice, setCurrentPrice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch current price for validation
    useEffect(() => {
        getLatestPrice().then(data => setCurrentPrice(data.price));
    }, []);

    const isValid = () => {
        const val = parseInt(targetPrice);
        if (isNaN(val)) return false;
        if (val < 10000) return false;
        // if (currentPrice && val >= currentPrice) return false; <-- Removed to allow upper alerts
        return true;
    };

    const getHelperText = () => {
        if (!targetPrice) return 'Enter target price.';
        const val = parseInt(targetPrice);
        if (val < 10000) return 'Must be above ₹10,000.';

        if (currentPrice) {
            if (val > currentPrice) return 'Alert when price RISES ABOVE this amount.';
            if (val < currentPrice) return 'Alert when price DROPS BELOW this amount.';
        }
        return 'Alert will trigger when price reaches this amount.';
    };

    const handleSubmit = async () => {
        if (!isValid()) return;
        setLoading(true);
        setError(null);

        try {
            const result = await createAlert(deviceToken, parseInt(targetPrice));
            onSuccess(result);
        } catch (err) {
            if (err.message === 'ALERT_EXISTS') {
                setError('You already have an active alert.');
            } else {
                setError('Failed to create alert. Try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Cancel</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Set Price Alert</Text>
                <Text style={styles.subtitle}>
                    Current Price: ₹{currentPrice ? Math.round(currentPrice).toLocaleString() : '...'}
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={targetPrice}
                        onChangeText={setTargetPrice}
                        autoFocus
                    />
                </View>

                <Text style={styles.helperText}>
                    {getHelperText()}
                </Text>

                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, !isValid() && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={!isValid() || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Create Alert</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        marginBottom: 20,
    },
    backText: {
        fontSize: 16,
        color: '#666',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#EEE',
        paddingBottom: 8,
        marginBottom: 16,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1A1A1A',
        marginRight: 8,
    },
    input: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#1A1A1A',
        flex: 1,
    },
    helperText: {
        fontSize: 14,
        color: '#999',
        lineHeight: 20,
    },
    errorText: {
        marginTop: 20,
        color: '#D32F2F', // Red
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#1A1A1A',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#CCC',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    }
});
