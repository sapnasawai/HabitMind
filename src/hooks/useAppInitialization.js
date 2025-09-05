import { useEffect, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import { useHabitStore, useUserStore } from '../stores';

// Simple initialization hook that doesn't cause re-renders
export const useAppInitialization = (user) => {
  const initializedRef = useRef(false);
  const { initializeListeners, initializeCompletionsListeners, fetchTodayCompletions, clearAllData } = useHabitStore();
  const { setUser, fetchUserProfile, clearUserData } = useUserStore();

  useEffect(() => {
    if (user && !initializedRef.current) {
      // User is signed in - initialize stores
      initializedRef.current = true;
      
      const initializeApp = async () => {
        try {
          // Set user in store
          setUser(user);
          
          // Fetch user profile
          await fetchUserProfile();
          
          // Initialize habit listeners
          initializeListeners();
          
          // Wait a bit for habits to load, then initialize completions
          setTimeout(async () => {
            const habits = useHabitStore.getState().habits;
            if (habits.length > 0) {
              const habitIds = habits.map(habit => habit.id);
              
              // Initialize completion listeners
              initializeCompletionsListeners(habitIds);
              
              // Fetch today's completions
              await fetchTodayCompletions(habitIds);
            }
          }, 1000); // Wait 1 second for habits to load
          
        } catch (error) {
          console.error('Error during app initialization:', error);
        }
      };

      initializeApp();
        
    } else if (!user && initializedRef.current) {
      // User is signed out - clear stores
      initializedRef.current = false;
      setUser(null);
      clearUserData();
      clearAllData();
    }

    // Cleanup function
    return () => {
      if (!user) {
        clearAllData();
      }
    };
  }, [user]); // Only depend on user changes
};
