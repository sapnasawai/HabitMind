import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useHabitStore } from '../stores/habitStore';
import NotificationService from '../services/NotificationService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const NotificationTestScreen = () => {
  const { habits, rescheduleAllNotifications } = useHabitStore();
  const [loading, setLoading] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadScheduledNotifications();
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const info = await NotificationService.debugNotificationStatus();
      setDebugInfo(info);
    } catch (error) {
      console.error('Error loading debug info:', error);
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      await NotificationService.sendTestNotification();
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const sendTestBackgroundNotification = async () => {
    try {
      setLoading(true);
      await NotificationService.sendTestBackgroundNotification();
      Alert.alert('Success', 'Background test notification scheduled for 30 seconds from now! Close the app to test background notifications.');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule background test notification');
    } finally {
      setLoading(false);
    }
  };

  const rescheduleAll = async () => {
    try {
      setLoading(true);
      await rescheduleAllNotifications();
      await loadScheduledNotifications();
      Alert.alert('Success', 'All notifications rescheduled!');
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule notifications');
    } finally {
      setLoading(false);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      setLoading(true);
      await NotificationService.cancelAllNotifications();
      await loadScheduledNotifications();
      Alert.alert('Success', 'All notifications canceled!');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel notifications');
    } finally {
      setLoading(false);
    }
  };

  const habitsWithReminders = habits.filter(habit => habit.reminder?.enabled);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <Text className="text-3xl font-bold text-gray-800 mb-6">
          Notification Test
        </Text>

        {/* Test Notification Button */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Test Notification
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Send a test notification to verify notifications are working
          </Text>
          <TouchableOpacity
            className="bg-blue-500 py-3 rounded-lg items-center"
            onPress={sendTestNotification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Send Test Notification
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Test Background Notification Button */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Test Background Notification
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Schedule a notification for 30 seconds from now. Close the app to test background notifications.
          </Text>
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-lg items-center"
            onPress={sendTestBackgroundNotification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Schedule Background Test
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Reschedule All Notifications */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Reschedule All Notifications
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Reschedule notifications for all habits with reminders enabled
          </Text>
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-lg items-center"
            onPress={rescheduleAll}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Reschedule All ({habitsWithReminders.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Cancel All Notifications */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Cancel All Notifications
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Cancel all scheduled notifications
          </Text>
          <TouchableOpacity
            className="bg-red-500 py-3 rounded-lg items-center"
            onPress={cancelAllNotifications}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Cancel All
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Habits with Reminders */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Habits with Reminders
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            {habitsWithReminders.length} habits have reminders enabled
          </Text>
          {habitsWithReminders.map((habit) => (
            <View key={habit.id} className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">
                  {habit.name}
                </Text>
                <Text className="text-sm text-gray-600">
                  {habit.reminder?.time}
                </Text>
              </View>
              <Ionicons name="notifications" size={20} color="#6B46C1" />
            </View>
          ))}
        </View>

        {/* Debug Information */}
        <View className="bg-yellow-50 rounded-lg p-4 mb-4 shadow-sm border border-yellow-200">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Debug Information
          </Text>
          <TouchableOpacity 
            className="mb-3"
            onPress={loadDebugInfo}
          >
            <Ionicons name="refresh" size={20} color="#6B46C1" />
          </TouchableOpacity>
          
          {debugInfo && (
            <View>
              <Text className="text-sm text-gray-700 mb-2">
                <Text className="font-semibold">Permission Status:</Text> {debugInfo.hasPermission ? '✅ Granted' : '❌ Denied'}
              </Text>
              <Text className="text-sm text-gray-700 mb-2">
                <Text className="font-semibold">Scheduled Count:</Text> {debugInfo.scheduledCount}
              </Text>
              {debugInfo.settings && (
                <Text className="text-sm text-gray-700 mb-2">
                  <Text className="font-semibold">Authorization:</Text> {debugInfo.settings.authorizationStatus}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Scheduled Notifications */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold text-gray-800">
              Scheduled Notifications
            </Text>
            <TouchableOpacity onPress={loadScheduledNotifications}>
              <Ionicons name="refresh" size={20} color="#6B46C1" />
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-600 mb-4">
            {scheduledNotifications.length} notifications scheduled
          </Text>
          {scheduledNotifications.map((notification, index) => (
            <View key={index} className="py-2 border-b border-gray-100">
              <Text className="text-base font-medium text-gray-800">
                {notification.notification.title}
              </Text>
              <Text className="text-sm text-gray-600">
                {notification.notification.body}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                ID: {notification.notification.id}
              </Text>
              <Text className="text-xs text-gray-500">
                Trigger: {new Date(notification.trigger.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationTestScreen;
