import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export const getCurrentUserId = () => {
  const user = auth().currentUser;
  if (user) {
    return user.uid;
  }
  console.error("No authenticated user found. Cannot perform Firestore read.");
  return null;
};

export const getAllUserHabits = async () => {
  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }

  try {
    // Reference the 'habits' subcollection for the current user
    const habitsRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('habits');

    // Fetch the documents
    const querySnapshot = await habitsRef.get();

    const habits = [];
    querySnapshot.forEach(documentSnapshot => {
      habits.push({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      });
    });

    console.log('Fetched all habits:', habits);
    return habits;
  } catch (error) {
    console.error('Error fetching all user habits:', error);
    return [];
  }
};

// --- 2. Get a Specific Habit for the Current User (One-Time Fetch) ---
// This function fetches a single habit document by its ID.
const getSpecificUserHabit = async (habitId) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return null; // Return null if no user is logged in
  }

  try {
    // Reference the specific habit document
    const habitRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('habits')
      .doc(habitId);

    // Fetch the document
    const documentSnapshot = await habitRef.get();

    if (documentSnapshot.exists) {
      console.log(`Fetched habit '${habitId}':`, documentSnapshot.data());
      return {
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      };
    } else {
      console.log(`Habit with ID '${habitId}' does not exist.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching habit '${habitId}':`, error);
    return null;
  }
};

// --- 3. Listen for Real-time Updates to All Habits for the Current User ---
// This function sets up a real-time listener. It's ideal for displaying
// the user's habit list on a dashboard, as it automatically updates
// when changes occur in Firestore.
// It returns an unsubscribe function that you MUST call when the component unmounts
// to prevent memory leaks.
const subscribeToUserHabits = (callback) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.warn("No user ID available for habit subscription.");
    // Provide an empty array immediately if no user to avoid initial errors
    callback([]);
    return () => {}; // Return a no-op unsubscribe function
  }

  // Reference the 'habits' subcollection
  const habitsRef = firestore()
    .collection('users')
    .doc(userId)
    .collection('habits')
    .orderBy('createdAt', 'asc'); // Order by creation date, or any other relevant field

  // Set up the real-time listener
  const unsubscribe = habitsRef.onSnapshot(
    querySnapshot => {
      const habits = [];
      querySnapshot.forEach(documentSnapshot => {
        habits.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        });
      });
      console.log('Real-time habits update:', habits);
      callback(habits); // Call the provided callback with the updated list of habits
    },
    error => {
      console.error('Error listening to user habits:', error);
      // You can also pass the error to the callback if your component needs to handle it
      // callback(null, error);
    }
  );

  return unsubscribe; // Return the unsubscribe function
};

export const IconComponents = {
  Ionicons: Ionicons,
  MaterialCommunityIcons: MaterialCommunityIcons,
  FontAwesome: FontAwesome,
  // Add other icon families here as needed
};
export const ICON_OPTIONS = [
  // Ionicons
  { name: 'walk-outline', label: 'Walk', family: 'Ionicons' },
  { name: 'book-outline', label: 'Read', family: 'Ionicons' },
  { name: 'water-outline', label: 'Drink Water', family: 'Ionicons' },
  { name: 'fitness-outline', label: 'Exercise', family: 'Ionicons' },
  { name: 'moon-outline', label: 'Sleep', family: 'Ionicons' },
  { name: 'code-outline', label: 'Code', family: 'Ionicons' },
  { name: 'brush-outline', label: 'Creative', family: 'Ionicons' },
  { name: 'bulb-outline', label: 'Learn', family: 'Ionicons' },
  { name: 'chatbubbles-outline', label: 'Social', family: 'Ionicons' },
  { name: 'calendar-outline', label: 'Plan', family: 'Ionicons' },
  { name: 'document-text-outline', label: 'Journal', family: 'Ionicons' },
  { name: 'leaf-outline', label: 'Nature', family: 'Ionicons' },
  { name: 'sparkles-outline', label: 'Self-Care', family: 'Ionicons' },
  { name: 'game-controller-outline', label: 'Play', family: 'Ionicons' },
  { name: 'fast-food-outline', label: 'Cook', family: 'Ionicons' },
  { name: 'bed-outline', label: 'Rest', family: 'Ionicons' },
  { name: 'wallet-outline', label: 'Finance', family: 'Ionicons' },
  { name: 'home-outline', label: 'Home Chores', family: 'Ionicons' },
  // MaterialCommunityIcons
  { name: 'meditation', label: 'Meditate', family: 'MaterialCommunityIcons' },
  { name: 'food-apple-outline', label: 'Healthy Eating', family: 'MaterialCommunityIcons' },
  { name: 'run', label: 'Run', family: 'MaterialCommunityIcons' },
  { name: 'weight-lifter', label: 'Weightlifting', family: 'MaterialCommunityIcons' },
  { name: 'laptop', label: 'Work', family: 'MaterialCommunityIcons' },
  // FontAwesome
  { name: 'smile-o', label: 'Happiness', family: 'FontAwesome' },
  { name: 'heartbeat', label: 'Heart Health', family: 'FontAwesome' },
  { name: 'money', label: 'Budget', family: 'FontAwesome' },
  { name: 'coffee', label: 'Coffee Break', family: 'FontAwesome' },
];
// --- Example Usage in a React Native Component (e.g., your HomeScreen) ---
/*
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
// Assuming you put the above functions in a file like 'src/services/firestoreReads.js'
// import { getAllUserHabits, getSpecificUserHabit, subscribeToUserHabits } from '../services/firestoreReads';

const HomeScreen = () => {
  const [habits, setHabits] = useState([]);
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    // Example 1: One-time fetch when component mounts
    // const fetchHabits = async () => {
    //   const fetchedHabits = await getAllUserHabits();
    //   setHabits(fetchedHabits);
    //   setLoadingHabits(false);
    // };
    // fetchHabits();

    // Example 3: Real-time listener for habits (recommended for dynamic lists)
    const unsubscribe = subscribeToUserHabits((updatedHabits) => {
      setHabits(updatedHabits);
      setLoadingHabits(false);
    });

    // Cleanup function: unsubscribe from real-time updates when component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Example of fetching a specific habit (e.g., when user taps on a habit in the list)
  const handleHabitPress = async (habitId) => {
    const habit = await getSpecificUserHabit(habitId);
    setSelectedHabit(habit);
    // You might navigate to a HabitDetailScreen here
  };

  if (loadingHabits) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading Habits...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Your Habits</Text>
      {habits.length === 0 ? (
        <Text>No habits found. Start by adding a new one!</Text>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleHabitPress(item.id)} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
              <Text style={{ fontSize: 14, color: '#666' }}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {selectedHabit && (
        <View style={{ marginTop: 20, borderWidth: 1, borderColor: 'blue', padding: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>Selected Habit:</Text>
          <Text>Name: {selectedHabit.name}</Text>
          <Text>Description: {selectedHabit.description}</Text>
          <Text>Type: {selectedHabit.type}</Text>
          { // You can display more details here }
        </View>
      )}
    </View>
  );
};

export default HomeScreen;
*/
