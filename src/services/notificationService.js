const admin = require('firebase-admin');
const serviceAccount = require('../../service-account.json');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

/**
 * Send a push notification to a specific device using FCM
 * @param {string} deviceToken 
 * @param {object} payload { title, body, data }
 */
async function sendAlertNotification(deviceToken, payload) {
    if (!deviceToken) {
        console.warn('Notification skipped: No device token provided.');
        return;
    }

    // Prepare the message for FCM
    const message = {
        token: deviceToken,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: payload.data || {},
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                channelId: 'default',
            },
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

module.exports = {
    sendAlertNotification
};
