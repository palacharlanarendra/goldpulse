const { Expo } = require('expo-server-sdk');
require('dotenv').config();

// Initialize Expo SDK
const expo = new Expo();

/**
 * Send a push notification to a specific device using Expo Push API
 * @param {string} deviceToken 
 * @param {object} payload { title, body, data }
 */
async function sendAlertNotification(deviceToken, payload) {
    if (!deviceToken) {
        console.warn('Notification skipped: No device token provided.');
        return;
    }

    // Check if the token is a valid Expo push token
    if (!Expo.isExpoPushToken(deviceToken)) {
        console.error(`Push token ${deviceToken} is not a valid Expo push token`);
        return;
    }

    const messages = [];
    messages.push({
        to: deviceToken,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
    });

    try {
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('Notification Ticket Chunk:', ticketChunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending notification chunk:', error);
            }
        }

        // Optional: specific error handling for tickets
        // The tickets contain information whether the push was successfully delivered to Expo service
        tickets.forEach((ticket) => {
            if (ticket.status === 'error') {
                console.error(`Error sending notification: ${ticket.message}`);
                if (ticket.details && ticket.details.error) {
                    console.error(`Error details: ${ticket.details.error}`);
                }
            }
        });

    } catch (error) {
        console.error('Error sending notification:', error.message);
    }
}

module.exports = {
    sendAlertNotification
};
