import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { Platform } from 'react-native';

class FirebaseMessagingService {
  constructor() {
    this.isInitialized = false;
    this.fcmToken = null;
  }

  /**
   * Initialize Firebase Messaging
   */
  async initialize() {
    try {
      console.log('🔥 Initializing Firebase Messaging...');
      console.log('🔥 Platform:', Platform.OS);
      
      // Request permission for iOS
      if (Platform.OS === 'ios') {
        console.log('🍎 Requesting iOS notification permission...');
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
          console.log('✅ iOS notification permission granted');
        } else {
          console.log('❌ iOS notification permission denied');
          return false;
        }
      } else {
        console.log('🤖 Android platform - no permission request needed');
      }

      // Get FCM token
      console.log('🔄 Getting FCM token...');
      const token = await this.getFCMToken();
      if (token) {
        console.log('✅ FCM token obtained successfully');
      } else {
        console.log('❌ Failed to get FCM token');
        return false;
      }
      
      // Set up message handlers
      console.log('🔄 Setting up message handlers...');
      this.setupMessageHandlers();
      console.log('✅ Message handlers set up');
      
      this.isInitialized = true;
      console.log('✅ Firebase Messaging initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Messaging:', error);
      console.error('❌ Error stack:', error.stack);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken() {
    try {
      console.log('🔄 Getting FCM token...');
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log('📱 FCM Token retrieved successfully:', token);
      console.log('📱 Token length:', token ? token.length : 0);
      
      // Store token in your backend or local storage
      // You can send this to your server to send targeted notifications
      await this.storeFCMToken(token);
      
      return token;
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
      console.error('❌ Error details:', error.message);
      return null;
    }
  }

  /**
   * Store FCM token (implement based on your needs)
   */
  async storeFCMToken(token) {
    try {
      // TODO: Store token in your backend/database
      // Example: await api.updateUserFCMToken({ fcmToken: token });
      console.log('💾 FCM token stored:', token);
    } catch (error) {
      console.error('❌ Failed to store FCM token:', error);
    }
  }

  /**
   * Set up message handlers
   */
  setupMessageHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📱 Background message received:', remoteMessage);
      
      // Display notification using Notifee
      await this.displayNotification(remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('📱 Foreground message received:', remoteMessage);
      
      // Display notification using Notifee
      await this.displayNotification(remoteMessage);
    });

    // Handle notification taps
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 Notification opened app:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Handle notification tap when app is killed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📱 App opened from notification:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  /**
   * Display notification using Notifee
   */
  async displayNotification(remoteMessage) {
    try {
      const { notification, data } = remoteMessage;
      
      if (!notification) return;

      // Create notification channel for Android
      const channelId = await notifee.createChannel({
        id: 'firebase-messages',
        name: 'Firebase Messages',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
      });

      // Display notification
      await notifee.displayNotification({
        title: notification.title || 'HabitMind',
        body: notification.body || 'You have a new notification',
        data: data || {},
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher',
          color: '#7C3AED',
          ongoing: false,
          autoCancel: true,
          actions: [
            { title: 'View', pressAction: { id: 'view' } },
            { title: 'Dismiss', pressAction: { id: 'dismiss' } },
          ],
        },
      });

      console.log('✅ Firebase notification displayed');
    } catch (error) {
      console.error('❌ Failed to display Firebase notification:', error);
    }
  }

  /**
   * Handle notification press
   */
  handleNotificationPress(remoteMessage) {
    const { data } = remoteMessage;
    
    if (data) {
      // Handle different notification types
      switch (data.type) {
        case 'habit_reminder':
          console.log('📱 Habit reminder notification pressed');
          // Navigate to habits screen or specific habit
          break;
        case 'motivational':
          console.log('📱 Motivational notification pressed');
          // Navigate to progress screen
          break;
        case 'achievement':
          console.log('📱 Achievement notification pressed');
          // Navigate to badges screen
          break;
        default:
          console.log('📱 General notification pressed');
          // Navigate to main screen
      }
    }
  }

  /**
   * Subscribe to topic
   */
  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`✅ Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`✅ Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from topic ${topic}:`, error);
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken() {
    return this.fcmToken;
  }

  /**
   * Check if initialized
   */
  isServiceInitialized() {
    return this.isInitialized;
  }
}

export default new FirebaseMessagingService();
