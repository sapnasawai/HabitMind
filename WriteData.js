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


