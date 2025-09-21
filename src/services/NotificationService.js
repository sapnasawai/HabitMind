import notifee, { AndroidImportance, AndroidVisibility, TriggerType } from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.channelId = 'habit-reminders';
    this.initializeChannel();
  }

  async initializeChannel() {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: this.channelId,
        name: 'Habit Reminders',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
        vibration: true,
      });
    }
  }

  async requestPermissions() {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus === 1; // AUTHORIZED
  }

  async scheduleHabitReminder(habit) {
    if (!habit.reminder?.enabled || !habit.reminder?.time) {
      console.log('No reminder settings for habit:', habit.name);
      return;
    }

    const [hours, minutes] = habit.reminder.time.split(':');
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    console.log(`Current time: ${now.toLocaleString()}`);
    console.log(`Requested reminder time: ${reminderTime.toLocaleString()}`);

    // If time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      console.log('Time has passed today, scheduling for tomorrow');
      reminderTime.setDate(reminderTime.getDate() + 1);
    } else {
      console.log('Scheduling for today');
    }

    console.log(`Final scheduled time: ${reminderTime.toLocaleString()}`);
    console.log(`Time difference: ${Math.round((reminderTime - now) / 1000 / 60)} minutes`);

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: reminderTime.getTime(),
      repeatInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds for daily repeat
    };

    try {
      await notifee.createTriggerNotification(
        {
          id: `habit-${habit.id}`,
          title: 'Habit Reminder',
          body: `Time to work on: ${habit.name}`,
          data: {
            habitId: habit.id,
            type: 'habit_reminder',
          },
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
            // Add these for better background notification support
            smallIcon: 'ic_launcher', // Use your app icon
            largeIcon: 'ic_launcher',
            color: '#7C3AED', // Your app's primary color
            // Make notification persistent
            ongoing: false,
            autoCancel: true,
            // Add actions for quick habit completion
            actions: [
              {
                title: 'Mark Complete',
                pressAction: {
                  id: 'complete',
                },
              },
              {
                title: 'Snooze 10min',
                pressAction: {
                  id: 'snooze',
                },
              },
            ],
          },
        },
        trigger
      );
      console.log(`✅ Successfully scheduled notification for ${habit.name}`);
    } catch (error) {
      console.error(`❌ Failed to schedule notification for ${habit.name}:`, error);
      throw error;
    }
  }

  async cancelHabitReminder(habitId) {
    console.log(`Canceling reminder for habit: ${habitId}`);
    await notifee.cancelNotification(`habit-${habitId}`);
  }

  async cancelAllNotifications() {
    console.log('Canceling all notifications');
    await notifee.cancelAllNotifications();
  }

  async getScheduledNotifications() {
    return await notifee.getTriggerNotifications();
  }

  // Debug function to check notification status
  async debugNotificationStatus() {
    try {
      const settings = await notifee.getNotificationSettings();
      const scheduled = await notifee.getTriggerNotifications();
      
      console.log('📱 Notification Settings:', settings);
      console.log('📅 Scheduled Notifications:', scheduled);
      
      return {
        settings,
        scheduled,
        hasPermission: settings.authorizationStatus === 1,
        scheduledCount: scheduled.length
      };
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return { error: error.message };
    }
  }

  // Test notification (for testing purposes)
  async sendTestNotification() {
    await notifee.displayNotification({
      title: 'Test Notification',
      body: 'This is a test notification from HabitMind!',
      data: {
        type: 'test',
      },
      android: {
        channelId: this.channelId,
        importance: AndroidImportance.HIGH,
      },
    });
  }

  // Test background notification (scheduled for 30 seconds from now)
  async sendTestBackgroundNotification() {
    const triggerTime = new Date();
    triggerTime.setSeconds(triggerTime.getSeconds() + 30); // 30 seconds from now

    console.log(`Current time: ${new Date().toLocaleString()}`);
    console.log(`Scheduling test notification for: ${triggerTime.toLocaleString()}`);

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime.getTime(),
    };

    try {
      await notifee.createTriggerNotification(
        {
          id: 'test-background-notification',
          title: 'Background Test Notification',
          body: 'This notification was scheduled and fired in the background!',
          data: {
            type: 'test_background',
          },
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
          },
        },
        trigger
      );

      console.log(`✅ Test background notification scheduled for ${triggerTime.toLocaleString()}`);
    } catch (error) {
      console.error(`❌ Failed to schedule test notification:`, error);
      throw error;
    }
  }

  // Handle notification actions
  async handleNotificationAction(actionId, notificationData) {
    const { habitId, type } = notificationData;
    
    switch (actionId) {
      case 'complete':
        console.log('User marked habit as complete from notification:', habitId);
        // You can add logic here to mark the habit as complete
        // This would require importing your habit store
        break;
        
      case 'snooze':
        console.log('User snoozed habit notification:', habitId);
        // Reschedule notification for 10 minutes later
        await this.snoozeHabitReminder(habitId, 10);
        break;
        
      default:
        console.log('Unknown notification action:', actionId);
    }
  }

  // Snooze a habit reminder for specified minutes
  async snoozeHabitReminder(habitId, minutes) {
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
    
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: snoozeTime.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id: `habit-${habitId}-snooze`,
        title: 'Habit Reminder (Snoozed)',
        body: `Time to work on your habit!`,
        data: {
          habitId: habitId,
          type: 'habit_reminder',
        },
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      },
      trigger
    );
    
    console.log(`Habit ${habitId} snoozed for ${minutes} minutes`);
  }
}

export default new NotificationService();
