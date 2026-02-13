import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Alert, View, ActivityIndicator } from 'react-native';
import HomeScreen from './src/components/HomeScreen';
import SetAlertScreen from './src/components/SetAlertScreen';
import { getLatestPrice, createAlert, getAlerts, deleteAlert } from './src/services/api';
import { requestUserPermission, getFCMToken, createNotificationListeners } from './src/services/notifications';

import CustomAlert from './src/components/CustomAlert';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [priceData, setPriceData] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState(null);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const init = useCallback(async () => {
    setLoading(true);
    try {
      await requestUserPermission();
      const token = await getFCMToken();
      setDeviceToken(token);
      await fetchData(token);
    } catch (error) {
      console.error("Init error:", error);
      showAlert("Error", "Failed to initialize app. Please check your connection.", 'error');
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
    const unsubscribe = createNotificationListeners();
    return () => {
      unsubscribe();
    };
  }, [init]);

  const handleCreateAlert = async (targetPrice, direction) => {
    if (!deviceToken) {
      showAlert("Error", "Notification permission required to set alerts.", 'error');
      return;
    }

    setLoading(true);
    try {
      await createAlert(targetPrice, deviceToken, direction);
      await fetchData();
      setCurrentScreen('HOME');
      showAlert("Success", "Price alert created!", 'success');
    } catch (error) {
      showAlert("Error", "Failed to create alert. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAlert = async (alertId) => {
    if (!deviceToken || !alertId) return;

    setLoading(true);
    try {
      await deleteAlert(alertId, deviceToken);
      setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
      // Removed "Alert removed" success message as per request to make it simple/frictionless
      // or we can keep it but user wanted "Remove" checks
      // Let's keep it but make it non-intrusive? 
      // User said "Notifications / errors we were getting in grey color model , instead of that make sure it matches with app UI"
      // If I show a success modal for every remove, it might be annoying.
      // But let's follow the standard pattern for now.
      await fetchData();
    } catch (error) {
      showAlert("Error", "Failed to remove alert.", 'error');
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

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
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
