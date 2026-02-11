import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const requestUserPermission = async () => {
    if (Platform.OS === 'android') {
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }
    return enabled;
};

export const getFCMToken = async () => {
    try {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error("Error getting FCM token:", error);
        return null;
    }
};

export const createNotificationListeners = () => {
    // 1. Foreground Message Handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('Foreground Message:', JSON.stringify(remoteMessage));
        Alert.alert(
            remoteMessage.notification?.title || 'New Alert',
            remoteMessage.notification?.body || '',
            [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
        );
    });

    // 2. Background -> Open App Handler
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('App opened from Background:', remoteMessage.notification);
        Alert.alert(
            remoteMessage.notification?.title || 'GoldPulse Alert',
            remoteMessage.notification?.body || ''
        );
    });

    // 3. Quit -> Open App Handler (Cold Start)
    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log('App opened from Quit state:', remoteMessage.notification);
                Alert.alert(
                    remoteMessage.notification?.title || 'GoldPulse Alert',
                    remoteMessage.notification?.body || ''
                );
            }
        });

    return unsubscribe;
};
