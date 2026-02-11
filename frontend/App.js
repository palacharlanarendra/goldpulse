import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Alert, View, ActivityIndicator } from 'react-native';
import HomeScreen from './src/components/HomeScreen';
import SetAlertScreen from './src/components/SetAlertScreen';
import { getLatestPrice, createAlert, getAlerts, deleteAlert } from './src/services/api';
import { requestUserPermission, getFCMToken, onMessageListener } from './src/services/notifications';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('HOME'); // HOME, SET_ALERT
  const [priceData, setPriceData] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState(null);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Setup Notifications
      await requestUserPermission();
      const token = await getFCMToken();
      setDeviceToken(token);

      // 2. Fetch Data
      await fetchData(token);
    } catch (error) {
      console.error("Init error:", error);
      Alert.alert("Error", "Failed to initialize app. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = async (token = deviceToken) => {
    try {
      const price = await getLatestPrice();
      setPriceData(price);

      if (token) {
        const alerts = await getAlerts(token);
        // Backend now allows multiple alerts
        if (alerts) {
          setActiveAlerts(alerts);
        } else {
          setActiveAlerts([]);
        }
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    }
  };

  useEffect(() => {
    init();
    const unsubscribe = onMessageListener();
    return () => {
      unsubscribe();
    };
  }, [init]);

  const handleCreateAlert = async (targetPrice, direction) => {
    if (!deviceToken) {
      Alert.alert("Error", "Notification permission required to set alerts.");
      return;
    }

    setLoading(true);
    try {
      await createAlert(targetPrice, deviceToken, direction);
      await fetchData(); // Refresh to get the new alert
      setCurrentScreen('HOME');
      Alert.alert("Success", "Price alert created!");
    } catch (error) {
      Alert.alert("Error", "Failed to create alert. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAlert = async (alertId) => {
    if (!deviceToken || !alertId) return;

    setLoading(true);
    try {
      await deleteAlert(alertId, deviceToken);
      // Optimistically update or re-fetch
      setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
      Alert.alert("Success", "Alert removed.");
      await fetchData(); // Refresh to be sure
    } catch (error) {
      Alert.alert("Error", "Failed to remove alert.");
    } finally {
      setLoading(false);
    }
  };

  const renderScreen = () => {
    if (loading && !priceData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      );
    }

    switch (currentScreen) {
      case 'HOME':
        return (
          <HomeScreen
            priceData={priceData}
            activeAlerts={activeAlerts}
            loading={loading}
            onRefresh={() => fetchData()}
            onSetAlert={() => setCurrentScreen('SET_ALERT')}
            onCancelAlert={handleCancelAlert}
          />
        );
      case 'SET_ALERT':
        return (
          <SetAlertScreen
            currentPrice={priceData?.price || 0}
            onSubmit={handleCreateAlert}
            onCancel={() => setCurrentScreen('HOME')}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default App;
