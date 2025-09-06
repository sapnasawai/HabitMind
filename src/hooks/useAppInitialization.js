import { useEffect, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import { useHabitStore, useUserStore } from '../stores';

// Simple initialization hook that doesn't cause re-renders
export const useAppInitialization = (user) => {
  const initializedRef = useRef(false);
  const { initializeListeners, initializeCompletionsListeners, clearAllData } = useHabitStore();
  const { setUser, fetchUserProfile, clearUserData } = useUserStore();

  useEffect(() => {
    if (user && !initializedRef.current) {
      // User is signed in - initialize stores
      initializedRef.current = true;
      
      const initializeApp = async () => {
        try {
          console.log('🚀 Initializing app for user:', user.uid);
          
          // Set user in store
          setUser(user);
          
          // Fetch user profile
          await fetchUserProfile();
          
          // Initialize habit listeners
          console.log('📡 Initializing habit listeners...');
          initializeListeners();
          
          // Wait a bit for habits to load, then initialize completions
          setTimeout(() => {
            const habits = useHabitStore.getState().habits;
            console.log('📋 Current habits count:', habits.length);
            
            if (habits.length > 0) {
              const habitIds = habits.map(habit => habit.id);
              console.log('🔄 Initializing completion listeners for habits:', habitIds);
              
              // Initialize completion listeners
              initializeCompletionsListeners(habitIds);
            } else {
              console.log('⚠️ No habits found, skipping completion listeners');
            }
          }, 1000); // Wait 1 second for habits to load
          
        } catch (error) {
          console.error('❌ Error during app initialization:', error);
        }
      };

      initializeApp();
        
    } else if (!user && initializedRef.current) {
      // User is signed out - clear stores
      console.log('👋 User signed out, clearing stores');
      initializedRef.current = false;
      setUser(null);
      clearUserData();
      clearAllData();
    }

    // Cleanup function
    return () => {
      // Only clear data if user is actually null (not just undefined during initialization)
      if (user === null) {
        console.log('🧹 Cleanup: clearing data due to null user');
        clearAllData();
      }
    };
  }, [user]); // Only depend on user changes
};
