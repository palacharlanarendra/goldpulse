const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    let credential = null;

    // 1. Try Environment Variable (Production/Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            // FIX: Replace escaped newlines with actual newlines
            if (serviceAccount.private_key) {
                // Handle both passed-in literal newlines and escaped newlines
                serviceAccount.private_key = serviceAccount.private_key.split(String.raw`\n`).join('\n');
            }
            credential = admin.credential.cert(serviceAccount);
            console.log('Firebase: Initialized with Environment Variable');
        } catch (error) {
            console.error('Firebase: Failed to parse FIREBASE_SERVICE_ACCOUNT env var', error);
        }
    }

    // 2. Try Local File (Development)
    if (!credential) {
        try {
            const serviceAccount = require('../../service-account.json');
            credential = admin.credential.cert(serviceAccount);
            console.log('Firebase: Initialized with local file');
        } catch (error) {
            console.warn('Firebase: Local service-account.json not found. (Expected in production if using env vars)');
        }
    }

    // 3. Initialize
    if (credential) {
        admin.initializeApp({ credential });
    } else {
        console.error('FIREBASE ERROR: No credentials found! Notifications will fail.');
    }
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
                channelId: 'default', // Must match the channel created in the App
                priority: 'high',
                defaultSound: true,
            },
        },
    };

    try {
        if (!admin.apps.length) {
            console.log('Mock Notification (No Credentials):', payload.title, '-', payload.body);
            return;
        }
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

module.exports = {
    sendAlertNotification
};
