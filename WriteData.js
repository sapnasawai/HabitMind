// Import necessary Firebase modules
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'; // For getting the current user's UID
import { getCurrentUserId } from './ReadData';


export const createUserProfile = async (
  displayName,
  email,
  photoURL = null,
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .set(
        {
          displayName: displayName,
          email: email,
          photoURL: photoURL,
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastSignInTime: firestore.FieldValue.serverTimestamp(),
          totalXP: 0,
          level: 1,
          lastActive: firestore.FieldValue.serverTimestamp(),
          settings: {theme: 'light', notificationsEnabled: true},
          aiPreferences: {tone: 'neutral', dailyInsight: true},
        },
        {merge: true},
      ); // Use merge to update existing fields or create if not present
    console.log('User profile created/updated successfully!');
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    // You might want to show an alert to the user here
  }
};

// --- 2. Add a New Habit ---
// This would be called from your AddHabitScreen.
export const addNewHabit = async habitData => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    const docRef = await firestore()
      .collection('users')
      .doc(userId)
      .collection('habits')
      .add({
        ...habitData, // Contains name, description, type, goal, unit, frequency, startDate, etc.
        isActive: true, // New habits are active by default
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });
    console.log('New habit added with ID:', docRef.id);
    return docRef.id; // Return the new habit's ID
  } catch (error) {
    console.error('Error adding new habit:', error);
  }
};

// Example habitData structure for addNewHabit:
/*
const newHabitExample = {
  name: "Read 30 mins",
  description: "Read a book for 30 minutes every day.",
  type: "counter", // or "daily", "weekly"
  goal: 30,
  unit: "minutes",
  frequency: ["daily"],
  startDate: firestore.Timestamp.now(), // Or a specific date
  category: "Personal Growth",
  icon: "book-outline",
  color: "#FFD700",
};
*/

// --- 3. Log a Habit Completion ---
// This would be called when a user marks a habit as complete on their HabbitsScreen.
// Note: Updating `progressSummaries` (daily/monthly) should ideally be handled by
// a Cloud Function triggered by `completions` writes to ensure consistency and prevent client-side manipulation.
const logHabitCompletion = async (
  habitId,
  value = 1,
  notes = '',
  xpEarned = 0,
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('habits')
      .doc(habitId)
      .collection('completions')
      .add({
        date: firestore.Timestamp.fromDate(new Date()), // Date of completion (start of the day is often preferred)
        value: value,
        isSkipped: false,
        notes: notes,
        xpEarned: xpEarned,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    console.log(`Completion logged for habit ${habitId}`);

    // Optionally, update user's total XP directly from client (less robust than Cloud Function)
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        totalXP: firestore.FieldValue.increment(xpEarned),
        // You'd also need logic to update 'level' based on XP in your app or a Cloud Function
      });
  } catch (error) {
    console.error('Error logging habit completion:', error);
  }
};

// --- 4. Add a Reminder for a Habit ---
// Called from habit detail/edit screen.
const addHabitReminder = async (habitId, time, days, message) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('habits')
      .doc(habitId)
      .collection('reminders')
      .add({
        time: time, // e.g., "08:00"
        days: days, // e.g., ["Monday", "Wednesday", "Friday"]
        message: message,
        isEnabled: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    console.log('Reminder added successfully!');
  } catch (error) {
    console.error('Error adding reminder:', error);
  }
};

// --- 5. Send an AI Chat Message ---
// Called from your AI Chat screen.
const sendAIChatMessage = async (message, sender = 'user', context = {}) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('aiChatHistory')
      .add({
        sender: sender,
        message: message,
        timestamp: firestore.FieldValue.serverTimestamp(),
        context: context, // Store any relevant AI context for continuity
      });
    console.log('AI chat message sent!');
  } catch (error) {
    console.error('Error sending AI chat message:', error);
  }
};

// --- 6. Earn a Badge ---
// This would typically be triggered by a Cloud Function when a user meets badge criteria,
// but for client-side testing or simple badges, you could add it directly.
const earnBadge = async (badgeId, name, description, imageUrl) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    // Using setDoc to ensure each badgeId is unique per user, and it won't create duplicates
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('badges')
      .doc(badgeId) // Use badgeId as document ID for easy lookup
      .set({
        name: name,
        description: description,
        imageUrl: imageUrl,
        earnedAt: firestore.FieldValue.serverTimestamp(),
        // progress: { currentValue: 0, targetValue: 0 } // For multi-stage badges, if applicable
      });
    console.log(`Badge '${name}' earned by user ${userId}!`);
  } catch (error) {
    console.error('Error earning badge:', error);
  }
};

// --- 7. Join a Challenge ---
// Called when a user joins a challenge from a challenges list.
const joinChallenge = async challengeData => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    // The challengeId here would likely come from a globalChallenges document
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('challenges')
      .doc(challengeData.challengeId) // Use the global challenge ID as the document ID
      .set({
        name: challengeData.name,
        description: challengeData.description,
        startDate: challengeData.startDate,
        endDate: challengeData.endDate,
        progress: 0, // Initial progress
        status: 'active',
        reward: challengeData.reward,
        habitsInChallenge: challengeData.habitsInChallenge, // Array of habit IDs related to this challenge
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });

    // Optionally, update the global challenge's participatingUsersCount
    await firestore()
      .collection('globalChallenges')
      .doc(challengeData.challengeId)
      .update({
        participatingUsersCount: firestore.FieldValue.increment(1),
      });

    console.log(`User ${userId} joined challenge ${challengeData.name}!`);
  } catch (error) {
    console.error('Error joining challenge:', error);
  }
};

const acceptFriendRequest = async friendUserId => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return;

  try {
    // Update status in current user's friends subcollection
    await firestore()
      .collection('users')
      .doc(currentUserId)
      .collection('friends')
      .doc(friendUserId)
      .update({
        status: 'accepted',
        acceptedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Update status in friend's friends subcollection (reciprocal)
    await firestore()
      .collection('users')
      .doc(friendUserId)
      .collection('friends')
      .doc(currentUserId)
      .update({
        status: 'accepted',
        acceptedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Add a notification for the friend who sent the request
    await addNotification(
      friendUserId,
      'friend_accepted',
      `${auth().currentUser.displayName} accepted your friend request!`,
      currentUserId,
      'friend',
    );

    console.log(
      `Friend request accepted between ${currentUserId} and ${friendUserId}`,
    );
  } catch (error) {
    console.error('Error accepting friend request:', error);
  }
};

// --- 9. Add a Notification for a User ---
// This can be called from various parts of your app or from Cloud Functions.
const addNotification = async (
  targetUserId,
  type,
  message,
  relatedEntityId = null,
  relatedEntityType = null,
) => {
  try {
    await firestore()
      .collection('users')
      .doc(targetUserId)
      .collection('notifications')
      .add({
        type: type,
        message: message,
        timestamp: firestore.FieldValue.serverTimestamp(),
        isRead: false,
        relatedEntityId: relatedEntityId,
        relatedEntityType: relatedEntityType,
      });
    console.log(`Notification added for user ${targetUserId}`);
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};

// --- Example of a Cloud Function Trigger (Conceptual, not client-side code) ---
/*
// This is conceptual code for a Firebase Cloud Function, not for your React Native app.
// It demonstrates how `progressSummaries` would be updated automatically.

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateDailyProgressOnCompletion = functions.firestore
  .document('users/{userId}/habits/{habitId}/completions/{completionId}')
  .onCreate(async (snap, context) => {
    const { userId, habitId } = context.params;
    const completionData = snap.data();
    const completionDate = completionData.date.toDate(); // Convert Timestamp to Date
    const dateString = completionDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const userRef = admin.firestore().collection('users').doc(userId);
    const dailyProgressRef = userRef.collection('progressSummaries').doc('daily').collection(dateString).doc('summary'); // Or just doc(dateString) if summary is the only doc

    // Get the habit details to know if it's a "total" habit or simple check
    const habitRef = userRef.collection('habits').doc(habitId);
    const habitSnap = await habitRef.get();
    const habitData = habitSnap.data();

    // Atomically update daily summary
    await dailyProgressRef.set({
      totalHabits: admin.firestore.FieldValue.increment(0), // Adjust if you track total habits *defined* for the day
      completedHabits: admin.firestore.FieldValue.increment(completionData.isSkipped ? 0 : 1),
      totalXP: admin.firestore.FieldValue.increment(completionData.xpEarned),
      [`habitsCompleted.${habitId}`]: !completionData.isSkipped, // Set true/false for specific habit
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      // Streak logic would be more complex, potentially needing a separate function or more advanced aggregation
    }, { merge: true });

    // Update monthly summary similarly
    const monthString = dateString.substring(0, 7); // YYYY-MM
    const monthlyProgressRef = userRef.collection('progressSummaries').doc('monthly').collection(monthString).doc('summary');

    await monthlyProgressRef.set({
      totalHabitsCompleted: admin.firestore.FieldValue.increment(completionData.isSkipped ? 0 : 1),
      totalXP: admin.firestore.FieldValue.increment(completionData.xpEarned),
      completionRate: admin.firestore.FieldValue.increment(0), // This would need more complex calculation
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      [`habitBreakdown.${habitId}.completed`]: admin.firestore.FieldValue.increment(completionData.isSkipped ? 0 : 1),
      [`habitBreakdown.${habitId}.total`]: admin.firestore.FieldValue.increment(1), // Assuming each completion attempt adds to total
    }, { merge: true });

    console.log(`Daily and Monthly progress updated for user ${userId} on ${dateString}`);
    return null;
  });
*/
