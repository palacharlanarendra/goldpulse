require('dotenv').config();
const admin = require('firebase-admin');
const db = require('./src/db'); // Correct path

// Initialize Firebase Admin using Environment Variable
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        // Apply the same fix as in notificationService.js
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin Initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        process.exit(1);
    }
}

async function testPush() {
    try {
        console.log("Fetching latest device token from DB...");
        // Get the most recently created user
        const res = await db.query('SELECT device_token, id FROM users ORDER BY created_at DESC LIMIT 1');

        if (res.rows.length === 0) {
            console.error("❌ No users found in DB! Open the app to register a token.");
            process.exit(1);
        }

        const user = res.rows[0];
        console.log(`Found User ID: ${user.id}`);
        console.log(`Device Token: ${user.device_token.substring(0, 20)}...`);

        // Define the message payload
        const message = {
            token: user.device_token,
            notification: {
                title: '🔔 GoldPulse Test',
                body: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
            },
            data: { test: 'true' },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
        };

        console.log("Sending test message...");
        const response = await admin.messaging().send(message);
        console.log('✅ Successfully sent message:', response);

    } catch (error) {
        console.error('❌ Error sending message:', error);
    } finally {
        // We need to wait a moment for the event loop? No, process.exit is fine for a script.
        setTimeout(() => process.exit(0), 500);
    }
}

testPush();
