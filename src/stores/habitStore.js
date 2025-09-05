import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Clean habit store with real-time listeners and proper selectors
export const useHabitStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    habits: [],
    completions: {}, // { habitId: [completions] }
    todayCompletions: {}, // { habitId: completionId }
    loading: false,
    error: null,
    lastUpdated: null,
    listeners: [], // Store listener unsubscribers

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Initialize real-time listeners
    initializeListeners: () => {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      // Clear existing listeners
      get().cleanupListeners();

      // Habits listener
      const habitsUnsubscribe = firestore()
        .collection('users')
        .doc(userId)
        .collection('habits')
        .orderBy('createdAt', 'asc')
        .onSnapshot(
          (querySnapshot) => {
            const habits = [];
            querySnapshot.forEach(documentSnapshot => {
              habits.push({
                id: documentSnapshot.id,
                ...documentSnapshot.data(),
              });
            });
            
            set({ 
              habits, 
              lastUpdated: new Date(),
              error: null 
            });
          },
          (error) => {
            console.error('Error in habits listener:', error);
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

    // Fetch today's completions
    fetchTodayCompletions: async (habitIds = []) => {
      const { setLoading, setError } = get();
      const userId = auth().currentUser?.uid;
      
      if (!userId) {
        setError('No authenticated user');
        return {};
      }

      try {
        setLoading(true);
        setError(null);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setDate(today.getDate() + 1);

        const todayCompletionsMap = {};

        for (const habitId of habitIds) {
          const completionsRef = firestore()
            .collection('users')
            .doc(userId)
            .collection('habits')
            .doc(habitId)
            .collection('completions');

          const querySnapshot = await completionsRef
            .where('date', '>=', firestore.Timestamp.fromDate(today))
            .where('date', '<', firestore.Timestamp.fromDate(endOfDay))
            .get();

          if (!querySnapshot.empty) {
            todayCompletionsMap[habitId] = querySnapshot.docs[0].id;
          }
        }

        set({ 
          todayCompletions: todayCompletionsMap,
          lastUpdated: new Date(),
          error: null 
        });

        return todayCompletionsMap;
      } catch (error) {
        console.error('Error fetching today\'s completions:', error);
        setError(error.message || 'Failed to fetch today\'s completions');
        return {};
      } finally {
        setLoading(false);
      }
    },

    // Add new habit
    addHabit: async (habitData) => {
      const { setLoading, setError } = get();
      
      try {
        setLoading(true);
        setError(null);
        
        const userId = auth().currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

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

        return docRef.id;
      } catch (error) {
        console.error('Error adding habit:', error);
        setError(error.message || 'Failed to add habit');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // Update habit
    updateHabit: async (habitId, updatedData) => {
      const { setLoading, setError } = get();
      
      try {
        setLoading(true);
        setError(null);
        
        const userId = auth().currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

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
        setError(error.message || 'Failed to update habit');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // Delete habit
    deleteHabit: async (habitId) => {
      const { setLoading, setError } = get();
      
      try {
        setLoading(true);
        setError(null);
        
        const userId = auth().currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        await firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId)
          .delete();

        return true;
      } catch (error) {
        console.error('Error deleting habit:', error);
        setError(error.message || 'Failed to delete habit');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // Log habit completion
    logCompletion: async (habitId, date, value = 1, notes = '', xpEarned = 10) => {
      const { setLoading, setError } = get();
      const userId = auth().currentUser?.uid;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      try {
        setLoading(true);
        setError(null);

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

        return completionRef.id;
      } catch (error) {
        console.error('Error logging completion:', error);
        setError(error.message || 'Failed to log completion');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // Delete completion
    deleteCompletion: async (habitId, completionId, xpEarned = 10) => {
      const { setLoading, setError } = get();
      const userId = auth().currentUser?.uid;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      try {
        setLoading(true);
        setError(null);

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
        setError(error.message || 'Failed to delete completion');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // Cleanup all listeners
    cleanupListeners: () => {
      const { listeners } = get();
      listeners.forEach(unsubscribe => unsubscribe());
      set({ listeners: [] });
    },

    // Clear all data (useful for logout)
    clearAllData: () => set({ 
      habits: [], 
      completions: {},
      todayCompletions: {},
      lastUpdated: null, 
      error: null,
      listeners: []
    }),

    // Check if habit is completed today
    isCompletedToday: (habitId) => {
      const { todayCompletions } = get();
      return !!todayCompletions[habitId];
    },

    // Get completion count for a habit in a date range
    getCompletionCount: (habitId, startDate, endDate) => {
      const { completions } = get();
      const habitCompletions = completions[habitId] || [];
      
      return habitCompletions.filter((completion) => {
        const completionDate = completion.date.toDate();
        return completionDate >= startDate && completionDate <= endDate;
      }).length;
    },
  }))
);
