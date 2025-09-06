import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Clean user store for authentication and user data
export const useUserStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    user: null,
    profile: null,
    loading: false,
    error: null,
    lastUpdated: null,

    // Actions
    setUser: user => set({user}),
    setLoading: loading => set({loading}),
    setError: error => set({error}),
    clearError: () => set({error: null}),

    // Fetch user profile
    fetchUserProfile: async () => {
      const {setLoading, setError} = get();
      const userId = auth().currentUser?.uid;

      if (!userId) {
        setError('No authenticated user');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const userDoc = await firestore().collection('users').doc(userId).get();

        if (userDoc.exists) {
          const profile = {
            id: userDoc.id,
            ...userDoc.data(),
          };

          set({
            profile,
            lastUpdated: new Date(),
            error: null,
          });

          return profile;
        } else {
          // Create user profile if it doesn't exist
          const newProfile = {
            id: userId,
            email: auth().currentUser?.email,
            displayName: auth().currentUser?.displayName,
            totalXP: 0,
            level: 1,
            currentGlobalStreak: 0,
            bestGlobalStreak: 0,
            lastGlobalCompletionDate: null,
            createdAt: firestore.FieldValue.serverTimestamp(),
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          };

          await firestore().collection('users').doc(userId).set(newProfile);

          set({
            profile: newProfile,
            lastUpdated: new Date(),
            error: null,
          });

          return newProfile;
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error.message || 'Failed to fetch user profile');
        return null;
      } finally {
        setLoading(false);
      }
    },

    // Update user profile
    updateUserProfile: async updatedData => {
      const {setLoading, setError} = get();
      const userId = auth().currentUser?.uid;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      try {
        setLoading(true);
        setError(null);

        await firestore()
          .collection('users')
          .doc(userId)
          .update({
            ...updatedData,
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          });

        // Refresh profile data
        await get().fetchUserProfile();

        return true;
      } catch (error) {
        console.error('Error updating user profile:', error);
        setError(error.message || 'Failed to update user profile');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // Clear user data (useful for logout)
    clearUserData: () =>
      set({
        user: null,
        profile: null,
        lastUpdated: null,
        error: null,
      }),

    // Get user stats
    getUserStats: () => {
      const {profile} = get();
      if (!profile) return null;

      return {
        level: profile.level || 1,
        totalXP: profile.totalXP || 0,
        currentGlobalStreak: profile.currentGlobalStreak || 0,
        bestGlobalStreak: profile.bestGlobalStreak || 0,
        progressPercentage: ((profile.totalXP || 0) % 500) / 5, // Progress to next level
      };
    },
  })),
);
