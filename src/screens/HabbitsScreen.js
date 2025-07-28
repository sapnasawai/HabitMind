import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  Animated,
  Alert, // Using Alert for simple messages, will replace with custom modal later if needed
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {isSameDay, format} from 'date-fns';
import firestore from '@react-native-firebase/firestore';
import {getAllUserHabits} from '../../ReadData';

// --- SIMULATED DATA ---
// In a real app, this data would come from Firestore and be managed by Redux/Context
// We'll use a local state for habitsData for demonstration purposes,
// and simulate completion updates.
export const ALL_HABITS_DATA_SIMULATED = [
  // Use let to allow modification
  {
    id: 'habit1',
    name: 'Drink Water',
    description: 'Stay hydrated by drinking a glass of water.',
    time: '9:00 AM', // This should ideally be a Date object for consistency
    icon: 'water-outline',
    reminder: true,
    frequency: 'daily',
    creationDate: new Date(2025, 6, 1), // July 1st, 2025
  },
  {
    id: 'habit2',
    name: 'Morning Meditation',
    description: 'Start the day with 10 minutes of calm meditation.',
    time: '6:30 AM',
    icon: 'leaf-outline',
    reminder: true,
    frequency: 'daily',
    creationDate: new Date(2025, 5, 15), // June 15th, 2025
  },
  {
    id: 'habit3',
    name: 'Evening Walk',
    description: 'Take a short walk after dinner.',
    time: '7:00 PM',
    icon: 'walk-outline',
    reminder: false,
    frequency: 'daily',
    creationDate: new Date(2025, 6, 5), // July 5th, 2025
  },
  {
    id: 'habit4',
    name: 'Read Book',
    description: 'Read at least 10 pages of any book.',
    time: '9:00 PM',
    icon: 'book-outline',
    reminder: true,
    frequency: 'specificDays', // Mon, Wed, Fri
    specificDays: [1, 3, 5], // 0=Sun, 1=Mon, ..., 6=Sat
    creationDate: new Date(2025, 6, 1),
  },
];

// Simulated completion data for ALL habits (will be updated)
export const ALL_COMPLETIONS_DATA_SIMULATED = [
  // Habit 1: Drink Water
  {habitId: 'habit1', completedAt: new Date(2025, 6, 7, 8, 0)},
  {habitId: 'habit1', completedAt: new Date(2025, 6, 8, 8, 15)},
  {habitId: 'habit1', completedAt: new Date(2025, 6, 10, 8, 30)},
  {habitId: 'habit1', completedAt: new Date(2025, 6, 11, 8, 0)}, // Yesterday
  {habitId: 'habit1', completedAt: new Date(2025, 6, 12, 8, 0)}, // Today

  // Habit 2: Meditate
  {habitId: 'habit2', completedAt: new Date(2025, 6, 9, 7, 0)},
  {habitId: 'habit2', completedAt: new Date(2025, 6, 10, 7, 10)},
  {habitId: 'habit2', completedAt: new Date(2025, 6, 11, 7, 0)}, // Yesterday

  // Habit 3: Read Book (started recently)
  {habitId: 'habit3', completedAt: new Date(2025, 6, 8, 20, 0)},
  {habitId: 'habit3', completedAt: new Date(2025, 6, 12, 20, 0)}, // Today

  // Habit 4: Exercise (Mon, Wed, Fri)
  {habitId: 'habit4', completedAt: new Date(2025, 6, 7, 17, 0)}, // Monday
  {habitId: 'habit4', completedAt: new Date(2025, 6, 9, 17, 30)}, // Wednesday
  {habitId: 'habit4', completedAt: new Date(2025, 6, 11, 17, 0)}, // Friday (Yesterday)
];

const HabbitsScreen = () => {
  const navigation = useNavigation();
  // Use state for habits to allow dynamic updates
  const [habits, setHabits] = useState(ALL_HABITS_DATA_SIMULATED);
  const [habitData, setHabitData] = useState('')
  // Function to check if a habit was completed today
  const isHabitCompletedToday = habitId => {
    const today = new Date();
    return ALL_COMPLETIONS_DATA_SIMULATED.some(
      comp => comp.habitId === habitId && isSameDay(comp.completedAt, today),
    );
  };

  // Effect to update the 'isSelected' status based on today's completions
  useEffect(() => {
    const updatedHabits = habits.map(habit => ({
      ...habit,
      isSelected: isHabitCompletedToday(habit.id),
    }));
    setHabits(updatedHabits);
  }, [ALL_COMPLETIONS_DATA_SIMULATED]); // Re-run when simulated completions change

  useEffect(() => {
    getData();
  }, []);
  useEffect(() => {
    const getHabitData = async () => {
      try {
        const result = await getAllUserHabits(); // call your async helper
        console.log('result---',result)
        setHabitData(result); // store the data in state
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    getHabitData(); // call the inner async function
  }, []);
  const getData = async () => {
    try {
      const data = await firestore()
        .collection('users')
        .doc('Fml5VwQ7NxTrThBIEUOb8yUdBHF3')
        .get();
      console.log('data========', data);
      return data;
    } catch (e) {
      console.log('e', e);
    }
  };
  // Function to toggle habit completion
  const toggleHabitCompletion = habitId => {
    const today = new Date();
    const isCompleted = isHabitCompletedToday(habitId);

    if (isCompleted) {
      // Simulate removing completion (e.g., user unchecks)
      ALL_COMPLETIONS_DATA_SIMULATED = ALL_COMPLETIONS_DATA_SIMULATED.filter(
        comp =>
          !(comp.habitId === habitId && isSameDay(comp.completedAt, today)),
      );
      Alert.alert('Habit Unmarked', 'Habit has been unmarked for today.');
    } else {
      // Simulate adding completion
      ALL_COMPLETIONS_DATA_SIMULATED.push({
        habitId: habitId,
        completedAt: today,
      });
      Alert.alert('Habit Completed!', 'Great job! Keep up the streak.');
    }

    // Force re-render to update UI (in a real app, Firestore listener would handle this)
    setHabits(prevHabits =>
      prevHabits.map(habit => ({
        ...habit,
        isSelected: isHabitCompletedToday(habit.id),
      })),
    );

    // In a real app, you would call your Firestore function here:
    // if (isCompleted) {
    //   deleteCompletionFromFirestore(habitId, today);
    // } else {
    //   addCompletionToFirestore(habitId, today);
    // }
  };

  const noHabits = () => {
    return (
      <View className="flex-1 bg-white items-center justify-center px-4">
        <Text className="text-lg text-gray-600 mb-4 text-center">
          You haven’t added any habits yet!
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddHabit')} // Assuming 'AddHabit' is the route name for your modal
          className="bg-violet-500 px-6 py-3 rounded-full shadow-md">
          <Text className="text-white text-base font-semibold">
            Add New Habit
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHabitCard = ({item}) => (
    <Animated.View className="bg-white px-6 py-6 mb-6 mt-3 mx-4 flex-row items-start shadow-lg shadow-violet-200 border-gray-200 rounded-xl">
      <Pressable
        // Navigate to HabitDetailScreen when the main card area is pressed
        onPress={() =>
          navigation.navigate('HabitDetail', {
            habitId: item.id,
            habitName: item.name,
          })
        }
        className="flex-row items-start flex-1">
        <View className="bg-violet-100 p-4 rounded-xl mr-5">
          <Icon name={item.icon} size={24} color="#7C3AED" />
        </View>

        <View className="flex-1">
          <Text className="text-2xl font-semibold text-gray-900">
            {item.name}
          </Text>
          <Text className="text-sm text-gray-500 mb-3">{item.description}</Text>
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center space-x-1">
              <Icon name="time-outline" size={16} color="#6B7280" />
              <Text className="text-xs text-gray-500">{item.time}</Text>
            </View>
            {item.reminder && (
              <View className="flex-row items-center space-x-1">
                <Icon name="notifications-outline" size={16} color="#6B7280" />
                <Text className="text-xs text-gray-500">Reminder</Text>
              </View>
            )}
          </View>
        </View>

        {/* Checkbox for completion */}
        <TouchableOpacity
          onPress={() => toggleHabitCompletion(item.id)}
          className="ml-3 self-center" // Center vertically
        >
          {item.isSelected ? (
            <View className="border border-violet-400 rounded-full w-8 h-8 bg-violet-400 items-center justify-center">
              <Icon name="checkmark" size={16} color="white" />
            </View>
          ) : (
            <View className="border border-violet-400 rounded-full w-8 h-8 bg-white" />
          )}
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );

  return (
    <>
      {habits.length > 0 ? (
        <View className="flex-1 bg-gray-50 p-8 ">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-3xl font-bold text-gray-800">
              Today's Habits
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddHabit')}
              className="bg-violet-400 px-4 py-2 rounded-md flex-row items-center space-x-1">
              <Icon name="add" size={16} color="#fff" />
              <Text className="text-white font-medium text-sm">New Habit</Text>
            </TouchableOpacity>
          </View>

          {/* New button to navigate to Overall Progress Screen */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ProgressScreen')}
            className="bg-purple-100 px-4 py-3 rounded-xl flex-row items-center justify-center space-x-2 mb-6 shadow-sm shadow-purple-200">
            <Icon name="stats-chart-outline" size={20} color="#7C3AED" />
            <Text className="text-violet-600 font-semibold text-base">
              View Overall Progress
            </Text>
          </TouchableOpacity>

          <FlatList
            data={habits}
            renderItem={renderHabitCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            className="mt-2" // Adjusted margin
          />
        </View>
      ) : (
        noHabits()
      )}
    </>
  );
};

export default HabbitsScreen;
