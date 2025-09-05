import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// User store for profile and authentication state
export const useUserStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    user: null,
    profile: null,
    loading: false,
    error: null,
    lastUpdated: null,

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Set current user
    setUser: (user) => set({ user }),

    // Fetch user profile from Firestore
    fetchUserProfile: async () => {
      const { setLoading, setError, user } = get();
      
      if (!user?.uid) {
        setError('No authenticated user');
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        
        const docSnap = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();

        if (docSnap.exists()) {
          const profile = { id: docSnap.id, ...docSnap.data() };
          set({ 
            profile, 
            lastUpdated: new Date(),
            error: null 
          });
          return profile;
        } else {
          setError('User profile not found');
          return null;
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error.message || 'Failed to fetch user profile');
        return null;
      } finally {
        setLoading(false);
      }
    },

    // Create or update user profile
    updateUserProfile: async (profileData) => {
      const { user, fetchUserProfile } = get();
      
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .set(profileData, { merge: true });

        // Refresh profile to get the latest data
        await fetchUserProfile();
        
        return true;
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    },

    // Update specific profile fields
    updateProfileField: async (field, value) => {
      const { user, fetchUserProfile } = get();
      
      if (!user?.uid) {
        throw new Error('No authenticated user');
      }

      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .update({
            [field]: value,
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          });

        // Refresh profile to get the latest data
        await fetchUserProfile();
        
        return true;
      } catch (error) {
        console.error('Error updating profile field:', error);
        throw error;
      }
    },

    // Get user level info
    getUserLevel: () => {
      const { profile } = get();
      if (!profile) return { level: 1, currentXP: 0, xpToNextLevel: 500 };
      
      const level = profile.level || 1;
      const currentXP = profile.totalXP || 0;
      const xpToNextLevel = level * 500;
      
      return { level, currentXP, xpToNextLevel };
    },

    // Get user stats
    getUserStats: () => {
      const { profile } = get();
      if (!profile) return null;
      
      return {
        totalXP: profile.totalXP || 0,
        level: profile.level || 1,
        currentGlobalStreak: profile.currentGlobalStreak || 0,
        bestGlobalStreak: profile.bestGlobalStreak || 0,
        lastGlobalCompletionDate: profile.lastGlobalCompletionDate,
        createdAt: profile.createdAt,
        lastActive: profile.lastActive,
      };
    },

    // Clear user data (useful for logout)
    clearUserData: () => set({ 
      user: null, 
      profile: null, 
      lastUpdated: null, 
      error: null 
    }),

    // Initialize store with real-time listener
    initializeStore: () => {
      const { user } = get();
      if (!user?.uid) return;

      // Set up real-time listener for user profile
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(
          (docSnap) => {
            if (docSnap.exists()) {
              const profile = { id: docSnap.id, ...docSnap.data() };
              set({ 
                profile, 
                lastUpdated: new Date(),
                error: null 
              });
            }
          },
          (error) => {
            console.error('Error in user profile listener:', error);
            setError(error.message || 'Failed to sync user profile');
          }
        );

      return unsubscribe;
    },
  }))
);


