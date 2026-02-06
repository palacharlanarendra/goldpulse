const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
// Uses 'GOOGLE_APPLICATION_CREDENTIALS' env var or explicit service account path/json
try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        // Option 1: JSON content in ENV
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Option 2: File path in ENV (Explicitly load it to sanitize key)
        const path = require('path');
        // Resolve path relative to CWD
        const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        serviceAccount = require(credPath);
    }

    if (serviceAccount) {
        // SANITIZATION: Fix private_key formatting if needed
        // Sometimes \\n comes in as literal characters instead of newlines
        if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin Initialized (with credentials)');
    } else {
        // Option 3: Default ADC (Application Default Credentials)
        admin.initializeApp();
        console.log('Firebase Admin Initialized (ADC)');
    }
} catch (error) {
    console.error('Firebase Initialization Error:', error.message);
}

/**
 * Send a push notification to a specific device
 * @param {string} deviceToken 
 * @param {object} payload { title, body }
 */
async function sendAlertNotification(deviceToken, payload) {
    if (!deviceToken) {
        console.warn('Notification skipped: No device token provided.');
        return;
    }

    const message = {
        token: deviceToken,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        android: {
            priority: 'high',
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                },
            },
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Notification sent successfully:', response);
    } catch (error) {
        // Fail silently as per requirements "Fail silently if notification fails"
        console.error('Error sending notification:', error.message);
    }
}

module.exports = {
    sendAlertNotification
};
