# Firebase Messaging Setup Guide

## ✅ What's Been Implemented

### 1. **Firebase Messaging Service** (`src/services/FirebaseMessagingService.js`)
- FCM token management
- Background and foreground message handling
- Topic subscription/unsubscription
- Integration with Notifee for display

### 2. **Android Configuration**
- Added Firebase Messaging permissions to `AndroidManifest.xml`
- Added Firebase Messaging services
- Configured for background message handling

### 3. **App Integration**
- Firebase Messaging initialized in `App.tsx`
- Test screen added to navigation
- Profile screen updated with test buttons

## 🚀 How to Test

### Step 1: Build and Run the App
```bash
cd /Users/dev/HabitMind
npx react-native run-android
```

### Step 2: Get FCM Token
1. Open the app
2. Go to Profile tab
3. Tap "Test Firebase Messaging"
4. Copy the FCM token displayed

### Step 3: Test from Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `habitmind-8f0af`
3. Navigate to "Cloud Messaging" in the left sidebar
4. Click "Send your first message"
5. Enter:
   - **Title**: "Test Notification"
   - **Message**: "This is a test from Firebase!"
6. Click "Send test message"
7. Enter your FCM token
8. Click "Test"

### Step 4: Test Different Scenarios
- **App in foreground**: Should show notification via Notifee
- **App in background**: Should show system notification
- **App closed**: Should show system notification

## 📱 Notification Types Supported

### 1. **General Notifications**
- Topic: `general`
- Use case: App updates, general announcements

### 2. **Habit Reminders**
- Topic: `habit_reminders`
- Use case: Custom habit reminder notifications

### 3. **Motivational Messages**
- Topic: `motivational`
- Use case: Inspiring messages, achievement notifications

## 🔧 Advanced Testing

### Send to Topics
1. In Firebase Console, go to Cloud Messaging
2. Click "New Campaign" → "Notification"
3. Enter title and message
4. In "Target" section, select "Topic"
5. Enter topic name (e.g., `general`, `habit_reminders`, `motivational`)
6. Send the notification

### Custom Data Payload
You can send custom data with notifications:
```json
{
  "notification": {
    "title": "Habit Reminder",
    "body": "Time to work on your morning routine!"
  },
  "data": {
    "type": "habit_reminder",
    "habitId": "123",
    "action": "complete"
  }
}
```

## 🛠️ Integration with Your App

### Store FCM Token
Update the `storeFCMToken` method in `FirebaseMessagingService.js` to save the token to your backend:

```javascript
async storeFCMToken(token) {
  try {
    // Example: Save to Firestore
    await firestore()
      .collection('users')
      .doc(currentUser.uid)
      .update({ fcmToken: token });
    
    console.log('💾 FCM token stored in Firestore');
  } catch (error) {
    console.error('❌ Failed to store FCM token:', error);
  }
}
```

### Handle Notification Navigation
Update the `handleNotificationPress` method to navigate to specific screens:

```javascript
handleNotificationPress(remoteMessage) {
  const { data } = remoteMessage;
  
  if (data?.type === 'habit_reminder' && data?.habitId) {
    // Navigate to specific habit
    navigation.navigate('HabitDetail', { 
      habitId: data.habitId 
    });
  } else if (data?.type === 'motivational') {
    // Navigate to progress screen
    navigation.navigate('Progress');
  }
}
```

## 📋 Next Steps

### 1. **iOS Configuration** (if needed)
- Add iOS push notification capabilities
- Configure APNs certificates in Firebase Console

### 2. **Backend Integration**
- Create API endpoints to send notifications
- Implement notification scheduling
- Add user preference management

### 3. **Advanced Features**
- Rich notifications with images
- Action buttons in notifications
- Notification analytics
- A/B testing for notifications

## 🐛 Troubleshooting

### Common Issues

1. **No notifications received**
   - Check if FCM token is valid
   - Verify internet connection
   - Check notification permissions

2. **Notifications not showing in foreground**
   - This is expected behavior
   - Notifications are handled by `onMessage` and displayed via Notifee

3. **Token not generated**
   - Check if Firebase is properly configured
   - Verify `google-services.json` is in the correct location
   - Check console logs for errors

### Debug Commands
```bash
# Check if Firebase is working
npx react-native run-android --verbose

# Check logs
npx react-native log-android
```

## 🎯 Ready to Use!

Your Firebase Messaging setup is complete and ready for testing. The integration with Notifee ensures consistent notification display across all scenarios.
