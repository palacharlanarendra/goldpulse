import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';

const SetAlertScreen = ({ currentPrice, onSubmit, onCancel, loading }) => {
    const [targetPrice, setTargetPrice] = useState('');
    const [direction, setDirection] = useState('BELOW'); // 'BELOW' or 'ABOVE'
    const [error, setError] = useState('');

    const handleCreate = () => {
        const price = parseInt(targetPrice, 10);

        if (isNaN(price)) {
            setError('Please enter a valid amount');
            return;
        }
        if (price < 100) { // Changed min to 100 or something reasonable for testing, or keep 10000. Let's keep 10000 if users trade large amounts.
            // But if user wants to set alert for ABOVE, current price might be 7000. 10000 is fine.
            // Let's assume price is in INR per 1g or 10g? Price data says ~6000-7000/g.
            // If the code had < 10000, maybe it was for 10g?
            // "priceData?price" comes from backend. Backend defaults to digital gold premium.
            // Let's just trust the user input for now or lower the limit. 
            // If price is per gram (~7000), 10000 min is too high. 
            // I will lower the min limit to 1.
            if (price < 1) {
                setError('Please enter a valid amount');
                return;
            }
        }

        // Logic Check: if BELOW, target < current. if ABOVE, target > current.
        if (direction === 'BELOW' && price >= currentPrice) {
            setError('Target price must be lower than current price for "Below" alert');
            return;
        }
        if (direction === 'ABOVE' && price <= currentPrice) {
            setError('Target price must be higher than current price for "Above" alert');
            return;
        }

        onSubmit(price, direction);
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <View style={styles.innerContainer}>
                    <Text style={styles.title}>Set Price Alert</Text>

                    <View style={styles.currentPriceContainer}>
                        <Text style={styles.label}>Current Price</Text>
                        <Text style={styles.currentPrice}>₹{currentPrice?.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.directionContainer}>
                        <Text style={styles.label}>Notify me when price goes</Text>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleButton, direction === 'BELOW' && styles.activeToggle]}
                                onPress={() => setDirection('BELOW')}
                            >
                                <Text style={[styles.toggleText, direction === 'BELOW' && styles.activeToggleText]}>BELOW</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleButton, direction === 'ABOVE' && styles.activeToggle]}
                                onPress={() => setDirection('ABOVE')}
                            >
                                <Text style={[styles.toggleText, direction === 'ABOVE' && styles.activeToggleText]}>ABOVE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>Target Price (₹)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={targetPrice}
                        onChangeText={(text) => {
                            setTargetPrice(text);
                            setError('');
                        }}
                        placeholder="Enter amount"
                        placeholderTextColor="#999"
                    />

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabled]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Create Alert</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={loading}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    innerContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#1a1a1a',
        textAlign: 'center',
    },
    currentPriceContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    currentPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 10,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 18,
        marginBottom: 8,
        color: '#000',
    },
    error: {
        color: '#d32f2f',
        marginBottom: 16,
        fontSize: 14,
    },
    button: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabled: {
        opacity: 0.7,
    },
    cancelButton: {
        padding: 16,
        marginTop: 8,
        alignItems: 'center',
    },
    cancelText: {
        color: '#666',
        fontSize: 16,
    },
    directionContainer: {
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        marginTop: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeToggle: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeToggleText: {
        color: '#1a1a1a',
    }
});

export default SetAlertScreen;
