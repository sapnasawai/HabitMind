import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Clean habit store with real-time listeners and proper selectors
export const useHabitStore = create(
  persist(
    subscribeWithSelector((set, get) => ({
    // State
    habits: [],
    completions: {}, // { habitId: [completions] }
    loading: false,
    error: null,
    lastUpdated: null,
    listeners: [], // Store listener unsubscribers
    // Removed operationLoading - using optimistic updates instead

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    // Removed setOperationLoading - using optimistic updates instead

    // Initialize real-time listeners
    initializeListeners: () => {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.log('⚠️ No user ID, skipping habit listeners initialization');
        return;
      }

      console.log('📡 Setting up habit listeners for user:', userId);

      // Clear existing listeners first
      get().cleanupListeners();

      // Set loading to false immediately to show cached data
      set({ loading: false, error: null });

      // Check if we already have habits data (from persistence)
      const currentHabits = get().habits;
      if (currentHabits.length > 0) {
        console.log('📋 Found cached habits, initializing completion listeners:', currentHabits.length);
        const habitIds = currentHabits.map(habit => habit.id);
        get().initializeCompletionsListeners(habitIds);
      }

      // Habits listener
      const habitsUnsubscribe = firestore()
        .collection('users')
        .doc(userId)
        .collection('habits')
        .orderBy('createdAt', 'asc')
        .onSnapshot(
          (querySnapshot) => {
            console.log('📋 Habits listener triggered, documents:', querySnapshot.size);
            const habits = [];
            querySnapshot.forEach(documentSnapshot => {
              habits.push({
                id: documentSnapshot.id,
                ...documentSnapshot.data(),
              });
            });
            
            console.log('📋 Updating habits in store:', habits.length);
            set({ 
              habits, 
              lastUpdated: new Date(),
              error: null 
            });

            // Initialize completion listeners immediately when habits are loaded
            if (habits.length > 0) {
              const habitIds = habits.map(habit => habit.id);
              console.log('🔄 Initializing completion listeners for habits:', habitIds);
              get().initializeCompletionsListeners(habitIds);
            }
          },
          (error) => {
            console.error('❌ Error in habits listener:', error);
            set({ error: error.message || 'Failed to sync habits' });
          }
        );

      // Store the unsubscriber
      set({ listeners: [habitsUnsubscribe] });
    },

    // Initialize completions listeners for specific habits
    initializeCompletionsListeners: (habitIds) => {
      const userId = auth().currentUser?.uid;
      if (!userId || !habitIds.length) return;

      const currentListeners = get().listeners;
      const newListeners = [...currentListeners];

      // Add completion listeners for each habit
      habitIds.forEach((habitId) => {
        const completionUnsubscribe = firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId)
          .collection('completions')
          .onSnapshot(
            (snapshot) => {
              const habitCompletions = [];
              snapshot.forEach((doc) => {
                habitCompletions.push({
                  id: doc.id,
                  ...doc.data(),
                });
              });

              set((state) => ({
                completions: {
                  ...state.completions,
                  [habitId]: habitCompletions,
                },
                lastUpdated: new Date(),
                error: null,
              }));
            },
            (error) => {
              console.error('Error in completions listener:', error);
              set({ error: error.message || 'Failed to sync completions' });
            }
          );

        newListeners.push(completionUnsubscribe);
      });

      set({ listeners: newListeners });
    },


    // Add new habit with optimistic updates
    addHabit: async (habitData) => {
      const { setError } = get();
      
      try {
        setError(null);
        
        const userId = auth().currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Generate temporary ID for optimistic update
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create optimistic habit data
        const optimisticHabit = {
          id: tempId,
          ...habitData,
          isActive: true,
          habitXP: 0,
          bestStreak: 0,
          currentStreak: 0,
          lastCompletionDate: null,
          createdAt: new Date(), // Use local timestamp for optimistic update
          lastUpdated: new Date(),
          isOptimistic: true, // Mark as optimistic
        };

        // Immediately update local state
        set(state => ({
          habits: [...state.habits, optimisticHabit],
          lastUpdated: new Date(),
          error: null,
        }));

        // Perform Firestore operation in background
        const docRef = await firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .add({
            ...habitData,
            isActive: true,
            habitXP: 0,
            bestStreak: 0,
            currentStreak: 0,
            lastCompletionDate: null,
            createdAt: firestore.FieldValue.serverTimestamp(),
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          });

        // Remove optimistic habit and let real-time listener handle the update
        set(state => ({
          habits: state.habits.filter(habit => habit.id !== tempId),
        }));

        return docRef.id;
      } catch (error) {
        console.error('Error adding habit:', error);
        
        // Revert optimistic update on error
        set(state => ({
          habits: state.habits.filter(habit => habit.id !== tempId),
        }));
        
        setError(error.message || 'Failed to add habit');
        throw error;
      }
    },

    // Update habit with optimistic updates
    updateHabit: async (habitId, updatedData) => {
      const { setError } = get();
      
      try {
        setError(null);
        
        const userId = auth().currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Store original habit data for potential rollback
        const originalHabit = get().habits.find(h => h.id === habitId);
        if (!originalHabit) throw new Error('Habit not found');

        // Optimistic update - immediately update local state
        set(state => ({
          habits: state.habits.map(habit => 
            habit.id === habitId 
              ? { 
                  ...habit, 
                  ...updatedData, 
                  lastUpdated: new Date(),
                  isOptimistic: true 
                }
              : habit
          ),
          lastUpdated: new Date(),
          error: null,
        }));

        // Perform Firestore operation in background
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId)
          .update({
            ...updatedData,
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          });

        return true;
      } catch (error) {
        console.error('Error updating habit:', error);
        
        // Revert optimistic update on error
        const originalHabit = get().habits.find(h => h.id === habitId);
        if (originalHabit) {
          set(state => ({
            habits: state.habits.map(habit => 
              habit.id === habitId ? originalHabit : habit
            ),
          }));
        }
        
        setError(error.message || 'Failed to update habit');
        throw error;
      }
    },

    // Delete habit with optimistic updates
    deleteHabit: async (habitId) => {
      const { setError } = get();
      
      try {
        setError(null);
        
        const userId = auth().currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Store original habit data for potential rollback
        const originalHabit = get().habits.find(h => h.id === habitId);
        if (!originalHabit) throw new Error('Habit not found');

        // Optimistic update - immediately remove from local state
        set(state => ({
          habits: state.habits.filter(habit => habit.id !== habitId),
          completions: {
            ...state.completions,
            [habitId]: undefined, // Remove completions for this habit
          },
          lastUpdated: new Date(),
          error: null,
        }));

        // Perform Firestore operation in background
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId)
          .delete();

        return true;
      } catch (error) {
        console.error('Error deleting habit:', error);
        
        // Revert optimistic update on error
        const originalHabit = get().habits.find(h => h.id === habitId);
        if (originalHabit) {
          set(state => ({
            habits: [...state.habits, originalHabit],
          }));
        }
        
        setError(error.message || 'Failed to delete habit');
        throw error;
      }
    },

    // Log habit completion with optimistic updates
    logCompletion: async (habitId, date, value = 1, notes = '', xpEarned = 10) => {
      const { setError } = get();
      const userId = auth().currentUser?.uid;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      try {
        setError(null);

        // Optimistic update - immediately update local state
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        
        // Create optimistic completion record
        const tempCompletionId = `temp_${Date.now()}`;
        const optimisticCompletion = {
          id: tempCompletionId,
          date: firestore.Timestamp.fromDate(normalizedDate),
          value,
          isSkipped: false,
          notes,
          xpEarned,
          createdAt: firestore.FieldValue.serverTimestamp(),
          isOptimistic: true, // Mark as optimistic
        };

        // Update local completions immediately
        set(state => ({
          completions: {
            ...state.completions,
            [habitId]: [...(state.completions[habitId] || []), optimisticCompletion]
          }
        }));

        // Perform network operation in background
        const habitRef = firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId);

        const userRef = firestore().collection('users').doc(userId);

        // Add completion record
        const completionRef = await habitRef.collection('completions').add({
          date: firestore.Timestamp.fromDate(normalizedDate),
          value,
          isSkipped: false,
          notes,
          xpEarned,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

        // Fetch habit data for streak calculation
        const habitSnap = await habitRef.get();
        const habitData = habitSnap.data();

        // Calculate per-habit streak
        let newCurrentStreak = habitData?.currentStreak || 0;
        let bestStreak = habitData?.bestStreak || 0;
        let lastCompletionDate = habitData?.lastCompletionDate?.toDate?.() || null;

        if (!lastCompletionDate) {
          newCurrentStreak = 1;
        } else {
          const diffDays = Math.floor(
            (normalizedDate - lastCompletionDate) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 1) {
            newCurrentStreak += 1;
          } else if (diffDays > 1) {
            newCurrentStreak = 1; // reset
          }
        }

        bestStreak = Math.max(bestStreak, newCurrentStreak);

        // Update habit XP and streaks
        await habitRef.update({
          habitXP: firestore.FieldValue.increment(xpEarned),
          currentStreak: newCurrentStreak,
          bestStreak,
          lastCompletionDate: firestore.Timestamp.fromDate(normalizedDate),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        });

        // Calculate global streak
        const userSnap = await userRef.get();
        const userData = userSnap.data();
        let globalCurrentStreak = userData?.currentGlobalStreak || 0;
        let bestGlobalStreak = userData?.bestGlobalStreak || 0;
        let lastGlobalCompletionDate = userData?.lastGlobalCompletionDate?.toDate?.() || null;

        if (!lastGlobalCompletionDate) {
          globalCurrentStreak = 1;
        } else {
          const diffDays = Math.floor(
            (normalizedDate - lastGlobalCompletionDate) / (1000 * 60 * 60 * 24)
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
          totalXP: newTotalXP,
          level: newLevel,
          currentGlobalStreak: globalCurrentStreak,
          bestGlobalStreak,
          lastGlobalCompletionDate: firestore.Timestamp.fromDate(normalizedDate),
        });

        // Remove optimistic completion and let real-time listener handle the update
        set(state => ({
          completions: {
            ...state.completions,
            [habitId]: (state.completions[habitId] || []).filter(comp => comp.id !== tempCompletionId)
          }
        }));

        return completionRef.id;
      } catch (error) {
        console.error('Error logging completion:', error);
        
        // Revert optimistic update on error
        set(state => ({
          completions: {
            ...state.completions,
            [habitId]: (state.completions[habitId] || []).filter(comp => comp.id !== tempCompletionId)
          }
        }));
        
        setError(error.message || 'Failed to log completion');
        throw error;
      }
    },

    // Delete completion with optimistic updates
    deleteCompletion: async (habitId, completionId, xpEarned = 10) => {
      const { setError } = get();
      const userId = auth().currentUser?.uid;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      try {
        setError(null);

        // Optimistic update - immediately remove from local state
        set(state => ({
          completions: {
            ...state.completions,
            [habitId]: (state.completions[habitId] || []).filter(comp => comp.id !== completionId)
          }
        }));

        await firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId)
          .collection('completions')
          .doc(completionId)
          .delete();

        // Update user XP
        await firestore()
          .collection('users')
          .doc(userId)
          .update({
            totalXP: firestore.FieldValue.increment(-xpEarned),
          });

        return true;
      } catch (error) {
        console.error('Error deleting completion:', error);
        
        // Revert optimistic update on error - re-add the completion
        // Note: This is a simplified revert - in a real app you'd want to store the original completion
        setError(error.message || 'Failed to delete completion');
        throw error;
      }
    },

    // Cleanup all listeners
    cleanupListeners: () => {
      const { listeners } = get();
      listeners.forEach(unsubscribe => unsubscribe());
      set({ listeners: [] });
    },

    // Clear all data (useful for logout)
    clearAllData: () => {
      console.log('🧹 Clearing all habit store data');
      get().cleanupListeners();
      set({ 
        habits: [], 
        completions: {},
        lastUpdated: null, 
        error: null,
        listeners: []
      });
    },

    // Check if store is properly initialized
    isInitialized: () => {
      const state = get();
      return {
        hasUser: !!auth().currentUser?.uid,
        hasHabits: state.habits.length > 0,
        hasListeners: state.listeners.length > 0,
        hasError: !!state.error,
        lastUpdated: state.lastUpdated,
      };
    },

    // Force reinitialize listeners (useful for debugging)
    forceReinitialize: () => {
      console.log('🔄 Force reinitializing listeners...');
      const state = get();
      console.log('Current state:', state.isInitialized());
      get().cleanupListeners();
      get().initializeListeners();
    },

    // Check if habit is completed today
    isCompletedToday: (habitId) => {
      const todayCompletions = get().getTodayCompletions();
      return !!todayCompletions[habitId];
    },

    // Get completion count for a habit in a date range
    getCompletionCount: (habitId, startDate, endDate) => {
      const { completions } = get();
      const habitCompletions = completions[habitId] || [];
      
      return habitCompletions.filter((completion) => {
        const completionDate = completion.date.toDate ? completion.date.toDate() : completion.date;
        return completionDate >= startDate && completionDate <= endDate;
      }).length;
    },

    // Get today's completions computed from completions data
    getTodayCompletions: () => {
      const { completions } = get();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setDate(today.getDate() + 1);

      const todayCompletions = {};
      
      Object.keys(completions).forEach(habitId => {
        const habitCompletions = completions[habitId] || [];
        const todayCompletion = habitCompletions.find(completion => {
          const completionDate = completion.date.toDate ? completion.date.toDate() : completion.date;
          return completionDate >= today && completionDate < endOfDay;
        });
        
        if (todayCompletion) {
          todayCompletions[habitId] = todayCompletion.id;
        }
      });

      return todayCompletions;
    },
  })),
  {
    name: 'habit-store', // unique name for the storage key
    partialize: (state) => ({ 
      habits: state.habits,
      completions: state.completions,
      lastUpdated: state.lastUpdated,
      // Don't persist listeners, loading, or error states
    }),
  }
));
