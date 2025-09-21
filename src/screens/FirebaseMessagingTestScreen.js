import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FirebaseMessagingService from '../services/FirebaseMessagingService';

const FirebaseMessagingTestScreen = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    checkInitializationStatus();
    getCurrentToken();
    // Also try to get token asynchronously
    refreshToken();
  }, []);

  const checkInitializationStatus = () => {
    const initialized = FirebaseMessagingService.isServiceInitialized();
    setIsInitialized(initialized);
  };

  const getCurrentToken = () => {
    const token = FirebaseMessagingService.getCurrentToken();
    setFcmToken(token);
  };

  const refreshToken = async () => {
    setLoading(true);
    console.log('🔄 Refreshing FCM token...');
    try {
      const token = await FirebaseMessagingService.getFCMToken();
      console.log('📱 Token received in test screen:', token);
      setFcmToken(token);
      Alert.alert('Success', 'FCM Token refreshed successfully!');
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      Alert.alert('Error', `Failed to refresh token: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (fcmToken) {
      // You can use Clipboard from @react-native-clipboard/clipboard if needed
      Alert.alert(
        'FCM Token',
        fcmToken,
        [
          { text: 'Copy', onPress: () => console.log('Token copied:', fcmToken) },
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert('No Token', 'FCM token is not available');
    }
  };

  const subscribeToGeneralTopic = async () => {
    setLoading(true);
    try {
      await FirebaseMessagingService.subscribeToTopic('general');
      Alert.alert('Success', 'Subscribed to general topic!');
    } catch (error) {
      Alert.alert('Error', `Failed to subscribe: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToHabitReminders = async () => {
    setLoading(true);
    try {
      await FirebaseMessagingService.subscribeToTopic('habit_reminders');
      Alert.alert('Success', 'Subscribed to habit reminders topic!');
    } catch (error) {
      Alert.alert('Error', `Failed to subscribe: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMotivational = async () => {
    setLoading(true);
    try {
      await FirebaseMessagingService.subscribeToTopic('motivational');
      Alert.alert('Success', 'Subscribed to motivational topic!');
    } catch (error) {
      Alert.alert('Error', `Failed to subscribe: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testNotificationInstructions = () => {
    Alert.alert(
      'Test Remote Notifications',
      `To test remote notifications:

1. Go to Firebase Console
2. Navigate to Cloud Messaging
3. Click "Send your first message"
4. Enter title and message
5. Click "Send test message"
6. Enter this FCM token:
${fcmToken || 'No token available'}

Or use the Firebase Console to send to topics:
- general
- habit_reminders  
- motivational`,
      [{ text: 'OK' }]
    );
  };

  const manualInitialize = async () => {
    setLoading(true);
    console.log('🔄 Manually initializing Firebase Messaging...');
    try {
      const result = await FirebaseMessagingService.initialize();
      console.log('📱 Manual initialization result:', result);
      checkInitializationStatus();
      if (result) {
        Alert.alert('Success', 'Firebase Messaging initialized successfully!');
        // Try to get token after initialization
        setTimeout(() => {
          refreshToken();
        }, 1000);
      } else {
        Alert.alert('Error', 'Failed to initialize Firebase Messaging');
      }
    } catch (error) {
      console.error('❌ Manual initialization error:', error);
      Alert.alert('Error', `Initialization failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logTokenToConsole = async () => {
    console.log('🔥🔥🔥 GETTING FCM TOKEN FOR CONSOLE 🔥🔥🔥');
    try {
      const token = await FirebaseMessagingService.getFCMToken();
      if (token) {
        console.log('🔥🔥🔥 FCM TOKEN FOR COPYING 🔥🔥🔥');
        console.log('📱 COPY THIS TOKEN:');
        console.log(token);
        console.log('🔥🔥🔥 END FCM TOKEN 🔥🔥🔥');
        Alert.alert('Token Logged', 'FCM token has been logged to console! Check your terminal.');
      } else {
        console.log('❌ No FCM token available');
        Alert.alert('No Token', 'FCM token is not available');
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      Alert.alert('Error', `Failed to get token: ${error.message}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Firebase Messaging Status
          </Text>
          <View className="flex-row items-center space-x-2 mb-2">
            <Icon 
              name={isInitialized ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={isInitialized ? "#10B981" : "#EF4444"} 
            />
            <Text className="text-base text-gray-700">
              {isInitialized ? 'Initialized' : 'Not Initialized'}
            </Text>
          </View>
          <View className="flex-row space-x-2 mt-2">
            <TouchableOpacity
              onPress={checkInitializationStatus}
              className="bg-blue-500 py-2 px-4 rounded-lg flex-1 items-center"
            >
              <Text className="text-white text-sm font-semibold">Refresh Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={manualInitialize}
              className="bg-orange-500 py-2 px-4 rounded-lg flex-1 items-center"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-sm font-semibold">Manual Init</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            FCM Token
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            {fcmToken ? 'Token available' : 'No token available'}
          </Text>
          {fcmToken && (
            <View className="bg-gray-100 p-3 rounded-lg mb-3">
              <Text className="text-xs text-gray-700 font-mono" numberOfLines={3}>
                {fcmToken}
              </Text>
            </View>
          )}
          <View className="flex-row space-x-2 mb-2">
            <TouchableOpacity
              onPress={refreshToken}
              className="bg-green-500 py-2 px-4 rounded-lg flex-1 items-center"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white text-sm font-semibold">Refresh Token</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={copyTokenToClipboard}
              className="bg-blue-500 py-2 px-4 rounded-lg flex-1 items-center"
            >
              <Text className="text-white text-sm font-semibold">Copy Token</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              console.log('🔍 Debug: Current token state:', fcmToken);
              console.log('🔍 Debug: Service initialized:', FirebaseMessagingService.isServiceInitialized());
              console.log('🔍 Debug: Service token:', FirebaseMessagingService.getCurrentToken());
            }}
            className="bg-gray-500 py-2 px-4 rounded-lg items-center"
          >
            <Text className="text-white text-sm font-semibold">Debug Logs</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Subscribe to Topics
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Subscribe to different notification topics
          </Text>
          
          <TouchableOpacity
            onPress={subscribeToGeneralTopic}
            className="bg-purple-500 py-3 rounded-lg items-center mb-2"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Subscribe to General
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={subscribeToHabitReminders}
            className="bg-orange-500 py-3 rounded-lg items-center mb-2"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Subscribe to Habit Reminders
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={subscribeToMotivational}
            className="bg-pink-500 py-3 rounded-lg items-center mb-2"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Subscribe to Motivational
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Test Notifications
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Instructions for testing remote notifications
          </Text>
          <TouchableOpacity
            onPress={testNotificationInstructions}
            className="bg-indigo-500 py-3 rounded-lg items-center mb-3"
          >
            <Text className="text-white text-base font-semibold">
              Show Test Instructions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={logTokenToConsole}
            className="bg-red-500 py-4 rounded-lg items-center"
          >
            <Text className="text-white text-lg font-bold">
              🔥 LOG FCM TOKEN TO CONSOLE 🔥
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <Text className="text-sm text-yellow-800">
            <Text className="font-semibold">Note:</Text> Make sure your app is running and 
            you have internet connection to receive remote notifications. 
            Test notifications work best when the app is in the background or closed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FirebaseMessagingTestScreen;
