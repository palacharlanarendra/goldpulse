// mobile/src/services/api.js
import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android Emulator
// Or replace with your machine's IP address for real device
// Use production URL from environment or fallback to localhost
// For Android Emulator: 10.0.2.2 points to host machine's localhost
import Constants from 'expo-constants';

const getBaseUrl = () => {
    // 1. Check for EXPO_PUBLIC_API_URL or REACT_APP_API_URL from environment
    const manifestUrl = Constants.expoConfig?.extra?.apiUrl;
    if (manifestUrl) return manifestUrl;

    // 2. Fallback for Development
    if (__DEV__) {
        return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
    }

    // 3. Default Production URL (Replace this with your actual Render/Heroku URL once deployed)
    return 'https://goldpulse-674o.onrender.com';
};

const API_URL = getBaseUrl();

const handleResponse = async (response) => {
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`Invalid JSON: ${text}`);
    }

    if (!response.ok) {
        const error = new Error(data.message || 'API Error');
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
};

export const getLatestPrice = async () => {
    try {
        const response = await fetch(`${API_URL}/price/latest`);
        return handleResponse(response);
    } catch (error) {
        console.error('API Error (getLatestPrice):', error);
        throw error;
    }
};

export const createAlert = async (deviceToken, targetPrice) => {
    try {
        const response = await fetch(`${API_URL}/alerts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_token: deviceToken,
                target_price: targetPrice
            })
        });
        return handleResponse(response);
    } catch (error) {
        // Handle 409 Conflict specifically
        if (error.status === 409) {
            throw new Error('ALERT_EXISTS');
        }
        console.error('API Error (createAlert):', error);
        throw error;
    }
};

export const getUserAlerts = async (deviceToken) => {
    try {
        const url = new URL(`${API_URL}/alerts`);
        // Basic query param appending
        const finalUrl = `${API_URL}/alerts?device_token=${encodeURIComponent(deviceToken)}`;

        const response = await fetch(finalUrl);
        return handleResponse(response);
    } catch (error) {
        console.error('API Error (getUserAlerts):', error);
        throw error;
    }
};
