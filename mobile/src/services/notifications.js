import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission denied');
            // return; // Optional: handle denial
        }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);

        // Get the token
        try {
            token = await messaging().getToken();
            console.log("FCM Token:", token);
        } catch (error) {
            console.error("Error fetching FCM token:", error);
            alert(`FCM Error: ${error.message}`);
        }
    } else {
        console.log('User declined messaging permissions');
        alert('Permission required for notifications');
    }

    return token;
};

// Optional: specific listeners can be added here or in App.js
export const setupNotificationListeners = () => {
    // Foreground message handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
        // You can show a local notification here if needed using a library like notifee or keeping expo-notifications for local display only
        alert(`New Price Alert!\n${remoteMessage.notification?.title}\n${remoteMessage.notification?.body}`);
    });

    return unsubscribe;
};
