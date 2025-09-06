import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Habit store for managing all habit-related state
export const useHabitStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    habits: [],
    loading: false,
    error: null,
    lastUpdated: null,

    // Actions
    setLoading: loading => set({loading}),
    setError: error => set({error}),
    clearError: () => set({error: null}),

    // Fetch habits from Firestore
    fetchHabits: async () => {
      const {setLoading, setError} = get();

      try {
        setLoading(true);
        setError(null);

        const userId = auth().currentUser?.uid;
        if (!userId) {
          setError('No authenticated user');
          return [];
        }

        const habitsRef = firestore()
          .collection('users')
          .doc(userId)
          .collection('habits');

        const querySnapshot = await habitsRef.get();
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
          error: null,
        });

        return habits;
      } catch (error) {
        console.error('Error fetching habits:', error);
        setError(error.message || 'Failed to fetch habits');
        return [];
      } finally {
        setLoading(false);
      }
    },

    // Add new habit
    addHabit: async habitData => {
      const {habits, fetchHabits} = get();

      try {
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

        // Refresh habits to get the latest data
        await fetchHabits();

        return docRef.id;
      } catch (error) {
        console.error('Error adding habit:', error);
        throw error;
      }
    },

    // Update habit
    updateHabit: async (habitId, updatedData) => {
      const {habits, fetchHabits} = get();

      try {
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

        // Refresh habits to get the latest data
        await fetchHabits();

        return true;
      } catch (error) {
        console.error('Error updating habit:', error);
        throw error;
      }
    },

    // Delete habit
    deleteHabit: async habitId => {
      const {habits, fetchHabits} = get();

      try {
        const userId = auth().currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        await firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habitId)
          .delete();

        // Refresh habits to get the latest data
        await fetchHabits();

        return true;
      } catch (error) {
        console.error('Error deleting habit:', error);
        throw error;
      }
    },

    // Toggle habit status
    toggleHabitStatus: async (habitId, newStatus) => {
      return get().updateHabit(habitId, {isActive: newStatus === 'active'});
    },

    // Get habit by ID
    getHabitById: habitId => {
      const {habits} = get();
      return habits.find(habit => habit.id === habitId);
    },

    // Get active habits
    getActiveHabits: () => {
      const {habits} = get();
      return habits.filter(habit => habit.isActive);
    },

    // Get habits by type
    getHabitsByType: type => {
      const {habits} = get();
      return habits.filter(habit => habit.type === type);
    },

    // Get total habits count
    getTotalHabitsCount: () => {
      const {habits} = get();
      return habits.length;
    },

    // Get active habits count
    getActiveHabitsCount: () => {
      const {habits} = get();
      return habits.filter(habit => habit.isActive).length;
    },

    // Clear all habits (useful for logout)
    clearHabits: () => set({habits: [], lastUpdated: null, error: null}),

    // Initialize store with real-time listener
    initializeStore: () => {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      // Set up real-time listener for habits
      const unsubscribe = firestore()
        .collection('users')
        .doc(userId)
        .collection('habits')
        .orderBy('createdAt', 'asc')
        .onSnapshot(
          querySnapshot => {
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
              error: null,
            });
          },
          error => {
            console.error('Error in habits listener:', error);
            setError(error.message || 'Failed to sync habits');
          },
        );

      return unsubscribe;
    },
  })),
);
