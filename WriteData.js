// Import necessary Firebase modules
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'; // For getting the current user's UID
import {getCurrentUserId} from './ReadData';
import {Alert} from 'react-native';

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
          currentGlobalStreak: 0,
          bestGlobalStreak: 0,
          lastGlobalCompletionDate: null,
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
        isActive: true,
        habitXP: 0,
        bestStreak: 0,
        currentStreak: 0,
        lastCompletionDate: null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });
    console.log('New habit added with ID:', docRef.id);
    return docRef.id; // Return the new habit's ID
  } catch (error) {
    console.error('Error adding new habit:', error);
  }
};

// --- NEW: Update an Existing Habit ---
export const updateHabit = async (habitId, updatedData) => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('habits')
      .doc(habitId)
      .update({
        ...updatedData,
        lastUpdated: firestore.FieldValue.serverTimestamp(), // Update last updated timestamp
      });
    console.log(`Habit ${habitId} updated successfully!`);
    return true;
  } catch (error) {
    console.error(`Error updating habit ${habitId}:`, error);
    Alert.alert('Error', 'Failed to update habit. Please try again.');
    return false;
  }
};

// --- NEW: Delete a Habit ---
export const deleteHabit = async habitId => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  try {
    // IMPORTANT: For production, consider using a Firebase Cloud Function
    // to recursively delete subcollections (completions, reminders)
    // when a habit is deleted, as client-side deletion of subcollections
    // can be unreliable.

    await firestore()
      .collection('users')
      .doc(userId)
      .collection('habits')
      .doc(habitId)
      .delete();
    console.log(`Habit ${habitId} deleted successfully!`);
    return true;
  } catch (error) {
    console.error(`Error deleting habit ${habitId}:`, error);
    Alert.alert('Error', 'Failed to delete habit. Please try again.');
    return false;
  }
};

export const logHabitCompletion = async (
  habitId,
  date,
  value = 1,
  notes = '',
  xpEarned = 10,
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    // Normalize date
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const habitRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('habits')
      .doc(habitId);

    const userRef = firestore().collection('users').doc(userId);

    // Add completion record
    await habitRef.collection('completions').add({
      date: firestore.Timestamp.fromDate(normalizedDate),
      value,
      isSkipped: false,
      notes,
      xpEarned,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Fetch habit data
    const habitSnap = await habitRef.get();
    const habitData = habitSnap.data();

    // --- PER HABIT STREAK CALC ---
    let newCurrentStreak = habitData?.currentStreak || 0;
    let bestStreak = habitData?.bestStreak || 0;
    let lastCompletionDate = habitData?.lastCompletionDate?.toDate?.() || null;

    if (!lastCompletionDate) {
      newCurrentStreak = 1;
    } else {
      const diffDays = Math.floor(
        (normalizedDate - lastCompletionDate) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        newCurrentStreak += 1;
      } else if (diffDays > 1) {
        newCurrentStreak = 1; // reset
      }
    }

    bestStreak = Math.max(bestStreak, newCurrentStreak);

    // Update habit XP + streaks
    await habitRef.update({
      habitXP: firestore.FieldValue.increment(xpEarned),
      currentStreak: newCurrentStreak,
      bestStreak,
      lastCompletionDate: firestore.Timestamp.fromDate(normalizedDate),
      lastUpdated: firestore.FieldValue.serverTimestamp(),
    });

    // --- GLOBAL STREAK CALC ---
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    let globalCurrentStreak = userData?.currentGlobalStreak || 0;
    let bestGlobalStreak = userData?.bestGlobalStreak || 0;
    let lastGlobalCompletionDate =
      userData?.lastGlobalCompletionDate?.toDate?.() || null;

    if (!lastGlobalCompletionDate) {
      globalCurrentStreak = 1;
    } else {
      const diffDays = Math.floor(
        (normalizedDate - lastGlobalCompletionDate) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        globalCurrentStreak += 1;
      } else if (diffDays > 1) {
        globalCurrentStreak = 1;
      }
    }

    bestGlobalStreak = Math.max(bestGlobalStreak, globalCurrentStreak);

    // Update total XP, level, global streaks
    const newTotalXP = (userData?.totalXP || 0) + xpEarned;
    const newLevel = Math.floor(newTotalXP / 500) + 1;

    await userRef.update({
      totalXP: firestore.FieldValue.increment(xpEarned),
      level: newLevel,
      currentGlobalStreak: globalCurrentStreak,
      bestGlobalStreak,
      lastGlobalCompletionDate: firestore.Timestamp.fromDate(normalizedDate),
    });

    console.log(
      `Completion logged for habit ${habitId}. Habit streak: ${newCurrentStreak}, Global streak: ${globalCurrentStreak}`,
    );
  } catch (error) {
    console.error('Error logging habit completion:', error);
    Alert.alert('Error', 'Failed to log habit completion.');
  }
};

export const deleteCompletionFromFirestore = async (
  habitId,
  completionId,
  xpEarned = 10,
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
      .doc(completionId) // Directly target the document by its ID
      .delete();
    console.log(`Completion with ID ${completionId} deleted.`);

    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        totalXP: firestore.FieldValue.increment(-xpEarned),
      });
  } catch (error) {
    console.error('Error deleting habit completion:', error);
  }
};
