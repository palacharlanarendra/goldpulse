// mobile/src/services/notifications.js
// MOCKED for Expo Go Stability
// Real Push Notifications are no longer supported in Expo Go client (SDK 53+).
// To test real notifications, you would need a "Development Build".
// For this UX demo, we simulate the token generation.

export const registerForPushNotificationsAsync = async () => {
    console.log('Using SIMULATED Push Token (Expo Go Safe Mode)');

    // Return a dummy token so the app flow continues
    // The backend will accept this, and the UI will show "Active"
    // but obviously no real push will arrive on the device.

    // FIX: Using STATIC token for testing persistence
    return 'simulator-device-token-user-1';
};
