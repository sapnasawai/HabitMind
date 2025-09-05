import { useEffect, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import { useHabitStore, useUserStore, useCompletionStore } from '../stores';

export const useStoreInitialization = () => {
  const unsubscribeRef = useRef(null);
  const { setUser, initializeStore: initializeUserStore } = useUserStore();
  const { initializeStore: initializeHabitStore } = useHabitStore();
  const { initializeStore: initializeCompletionStore } = useCompletionStore();

  useEffect(() => {
    const authUnsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);        
        try {
          const userUnsubscribe = initializeUserStore();
          await useUserStore.getState().fetchUserProfile();
          await useHabitStore.getState().fetchHabits();
          const habits = useHabitStore.getState().habits;
          const habitIds = habits.map(habit => habit.id);
          
          if (habitIds.length > 0) {
            const completionUnsubscribe = initializeCompletionStore(habitIds);
            
            await useCompletionStore.getState().fetchTodayCompletions(habitIds);
            
            console.log('Fetching completions for habits:', habitIds);
            for (const habitId of habitIds) {
              try {
                await useCompletionStore.getState().fetchCompletionsForHabit(habitId);
                console.log('Fetched completions for habit:', habitId);
              } catch (error) {
                console.error('Error fetching completions for habit:', habitId, error);
              }
            }
            
            unsubscribeRef.current = () => {
              if (userUnsubscribe) userUnsubscribe();
              if (completionUnsubscribe) completionUnsubscribe();
            };
          }
        } catch (error) {
          console.error('Error during store initialization:', error);
        }
        
      } else {
        // User is signed out
        setUser(null);
        
        // Clear all stores
        useUserStore.getState().clearUserData();
        useHabitStore.getState().clearHabits();
        useCompletionStore.getState().clearCompletions();
        
        // Clean up listeners
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      }
    });

    // Cleanup function
    return () => {
      authUnsubscribe();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Return a function to manually refresh all data
  const refreshAllData = async () => {
    try {
      await Promise.all([
        useUserStore.getState().fetchUserProfile(),
        useHabitStore.getState().fetchHabits(),
      ]);
      
      const habits = useHabitStore.getState().habits;
      const habitIds = habits.map(habit => habit.id);
      
      if (habitIds.length > 0) {
        await useCompletionStore.getState().fetchTodayCompletions(habitIds);
        
        // Fetch completions for all habits
        for (const habitId of habitIds) {
          try {
            await useCompletionStore.getState().fetchCompletionsForHabit(habitId);
          } catch (error) {
            console.error('Error refreshing completions for habit:', habitId, error);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  return { refreshAllData };
};

