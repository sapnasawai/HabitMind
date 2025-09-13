import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Completion store for tracking habit completions
export const useCompletionStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    completions: {}, // { habitId: [completions] }
    todayCompletions: {}, // { habitId: completionId }
    loading: false,
    error: null,
    lastUpdated: null,

    // Actions
    setLoading: loading => set({loading}),
    setError: error => set({error}),
    clearError: () => set({error: null}),

    // Fetch completions for a specific habit
    fetchCompletionsForHabit: async (
      habitId,
      startDate = null,
      endDate = null,
    ) => {
      const {setLoading, setError} = get();
      const userId = auth().currentUser?.uid;

      if (!userId) {
        setError('No authenticated user');
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        let query = firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId)
          .collection('completions');

        // Add date filters if provided
        if (startDate && endDate) {
          query = query
            .where('date', '>=', firestore.Timestamp.fromDate(startDate))
            .where('date', '<', firestore.Timestamp.fromDate(endDate));
        }

        const querySnapshot = await query.orderBy('date', 'desc').get();
        const habitCompletions = [];

        querySnapshot.forEach(doc => {
          habitCompletions.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Update completions state
        set(state => ({
          completions: {
            ...state.completions,
            [habitId]: habitCompletions,
          },
          lastUpdated: new Date(),
          error: null,
        }));

        return habitCompletions;
      } catch (error) {
        console.error('Error fetching completions for habit:', error);
        setError(error.message || 'Failed to fetch completions');
        return [];
      } finally {
        setLoading(false);
      }
    },

    // Fetch today's completions for all habits
    fetchTodayCompletions: async (habitIds = []) => {
      const {setLoading, setError} = get();
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
          error: null,
        });

        return todayCompletionsMap;
      } catch (error) {
        console.error("Error fetching today's completions:", error);
        setError(error.message || "Failed to fetch today's completions");
        return {};
      } finally {
        setLoading(false);
      }
    },

    // Log habit completion with optimistic updates
    logCompletion: async (
      habitId,
      date,
      value = 1,
      notes = '',
      xpEarned = 10,
    ) => {
      const {setError} = get();
      const userId = auth().currentUser?.uid;

      if (!userId) {
        throw new Error('No authenticated user');
      }

      try {
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
        let lastCompletionDate =
          habitData?.lastCompletionDate?.toDate?.() || null;

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
          totalXP: newTotalXP,
          level: newLevel,
          currentGlobalStreak: globalCurrentStreak,
          bestGlobalStreak,
          lastGlobalCompletionDate:
            firestore.Timestamp.fromDate(normalizedDate),
        });

        // Update local state
        const completion = {
          id: completionRef.id,
          date: firestore.Timestamp.fromDate(normalizedDate),
          value,
          isSkipped: false,
          notes,
          xpEarned,
          createdAt: firestore.FieldValue.serverTimestamp(),
        };

        set(state => ({
          completions: {
            ...state.completions,
            [habitId]: [completion, ...(state.completions[habitId] || [])],
          },
          todayCompletions: {
            ...state.todayCompletions,
            [habitId]: completionRef.id,
          },
          lastUpdated: new Date(),
          error: null,
        }));

        return completionRef.id;
      } catch (error) {
        console.error('Error logging completion:', error);
        setError(error.message || 'Failed to log completion');
        throw error;
      }
    },

    // Delete completion with optimistic updates
    deleteCompletion: async (habitId, completionId, xpEarned = 10) => {
      const {setError} = get();
      const userId = auth().currentUser?.uid;

      if (!userId) {
        throw new Error('No authenticated user');
      }

      try {
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

        // Update local state
        set(state => ({
          completions: {
            ...state.completions,
            [habitId]: (state.completions[habitId] || []).filter(
              comp => comp.id !== completionId,
            ),
          },
          todayCompletions: {
            ...state.todayCompletions,
            [habitId]: undefined,
          },
          lastUpdated: new Date(),
          error: null,
        }));

        return true;
      } catch (error) {
        console.error('Error deleting completion:', error);
        setError(error.message || 'Failed to delete completion');
        throw error;
      }
    },

    // Check if habit is completed today
    isCompletedToday: habitId => {
      const {todayCompletions} = get();
      return !!todayCompletions[habitId];
    },

    // Get completion count for a habit in a date range
    getCompletionCount: (habitId, startDate, endDate) => {
      const {completions} = get();
      const habitCompletions = completions[habitId] || [];

      return habitCompletions.filter(completion => {
        const completionDate = completion.date.toDate ? completion.date.toDate() : completion.date;
        return completionDate >= startDate && completionDate <= endDate;
      }).length;
    },

    // Clear all completions (useful for logout)
    clearCompletions: () =>
      set({
        completions: {},
        todayCompletions: {},
        lastUpdated: null,
        error: null,
      }),

    // Initialize store with real-time listeners
    initializeStore: (habitIds = []) => {
      const userId = auth().currentUser?.uid;
      if (!userId || habitIds.length === 0) return;

      const unsubscribers = [];

      // Set up real-time listeners for each habit's completions
      habitIds.forEach(habitId => {
        const unsubscribe = firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId)
          .collection('completions')
          .onSnapshot(
            snapshot => {
              const habitCompletions = [];
              snapshot.forEach(doc => {
                habitCompletions.push({
                  id: doc.id,
                  ...doc.data(),
                });
              });

              set(state => ({
                completions: {
                  ...state.completions,
                  [habitId]: habitCompletions,
                },
                lastUpdated: new Date(),
                error: null,
              }));
            },
            error => {
              console.error('Error in completions listener:', error);
              setError(error.message || 'Failed to sync completions');
            },
          );

        unsubscribers.push(unsubscribe);
      });

      return () => unsubscribers.forEach(unsub => unsub());
    },
  })),
);
