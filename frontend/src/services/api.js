import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
});

export const getLatestPrice = async () => {
    try {
        const response = await api.get('/price/latest');
        return response.data;
    } catch (error) {
        console.error("Error fetching price:", error);
        throw error;
    }
};

export const createAlert = async (targetPrice, deviceToken, direction = null) => {
    try {
        const response = await api.post('/alerts', {
            target_price: targetPrice,
            device_token: deviceToken,
            direction: direction
        });
        return response.data;
    } catch (error) {
        console.error("Error creating alert:", error);
        throw error;
    }
};

export const deleteAlert = async (alertId, deviceToken) => {
    try {
        const response = await api.delete(`/alerts/${alertId}`, {
            params: { device_token: deviceToken }
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting alert:", error);
        throw error;
    }
};

export const getAlerts = async (deviceToken) => {
    try {
        const response = await api.get(`/alerts`, {
            params: { device_token: deviceToken }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching alerts:", error);
        throw error;
    }
};
