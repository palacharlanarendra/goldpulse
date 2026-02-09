require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json'); // Path relative to root
const db = require('./src/db');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function testPush() {
    try {
        console.log("Fetching latest device token from DB...");
        const res = await db.query('SELECT device_token FROM users ORDER BY created_at DESC LIMIT 1');

        if (res.rows.length === 0) {
            console.error("No users found in DB!");
            return;
        }

        const TOKEN = res.rows[0].device_token;
        console.log(`Found Token: ${TOKEN}`);

        // Define the message payload
        const message = {
            token: TOKEN,
            notification: {
                title: 'Native Firebase Test',
                body: 'If you see this, FCM is working perfectly!',
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

        console.log("Sending message to FCM...");
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);

    } catch (error) {
        console.error('Error sending message:', error);
    } finally {
        process.exit();
    }
}

testPush();
