import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  Animated,
  Alert,
  ActivityIndicator, // Added for loading indicator
  SafeAreaView, // Added for proper layout
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; // Assuming Ionicons is the primary icon set
// import {isSameDay, format} from 'date-fns'; // Not directly used in this version, but good to keep if needed later
import firestore from '@react-native-firebase/firestore'; // Ensure firestore is imported
import {getAllUserHabits, getCurrentUserId} from '../../ReadData'; // Your Firestore read function
import {IconComponents} from '../../ReadData'; // Your icon component map
import {
  deleteCompletionFromFirestore,
  logHabitCompletion,
} from '../../WriteData';

const HabbitsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [habitData, setHabitData] = useState([]);
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [error, setError] = useState(null);
  const [todayCompletions, setTodayCompletions] = useState({});

  const fetchHabitData = async () => {
    setLoadingHabits(true);
    setError(null);
    const userId = getCurrentUserId();

    if (!userId) {
      setError('User not authenticated.');
      setLoadingHabits(false);
      return;
    }

    try {
      const fetchedHabits = await getAllUserHabits();
      setHabitData(fetchedHabits);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setDate(today.getDate() + 1);

      const completionsMap = {};
      for (const habit of fetchedHabits) {
        const completionsRef = firestore()
          .collection('users')
          .doc(userId)
          .collection('habits')
          .doc(habit.id)
          .collection('completions');

        const querySnapshot = await completionsRef
          .where('date', '>=', firestore.Timestamp.fromDate(today))
          .where('date', '<', firestore.Timestamp.fromDate(endOfDay))
          .get();

        if (!querySnapshot.empty) {
          completionsMap[habit.id] = querySnapshot.docs[0].id;
        }
      }
      setTodayCompletions(completionsMap);
    } catch (err) {
      console.error('Error fetching habit data:', err);
      setError('Failed to load habits. Please check your internet connection.');
      Alert.alert('Error', 'Failed to load habits. Please try again.');
    } finally {
      setLoadingHabits(false);
    }
  };

  // Streamlined useFocusEffect logic
  useFocusEffect(
    useCallback(() => {
      const shouldFetch = route.params?.refresh || habitData.length === 0;

      if (shouldFetch) {
        console.log('HabbitsScreen focused, fetching data...');
        fetchHabitData();
        if (route.params?.refresh) {
          navigation.setParams({refresh: false}); // Reset the flag
        }
      } else {
        console.log('HabbitsScreen focused, no fetch needed.');
      }

      return () => {
        // Cleanup function if needed
      };
    }, [route.params?.refresh, habitData.length]), // Dependencies: refresh param and habitData.length
  );

  const toggleHabitCompletion = async (habitId, xpEarned = 10) => {
    const userId = getCurrentUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated. Please log in.');
      return;
    }

    const isCurrentlyCompleted = !!todayCompletions[habitId];
    const completionId = todayCompletions[habitId];
    const prevTodayCompletions = {...todayCompletions};

    if (isCurrentlyCompleted) {
      setTodayCompletions(prev => {
        const newState = {...prev};
        delete newState[habitId];
        return newState;
      });
    } else {
      setTodayCompletions(prev => ({
        ...prev,
        [habitId]: 'temp_id_for_optimistic_update',
      }));
    }

    try {
      if (isCurrentlyCompleted) {
        await deleteCompletionFromFirestore(habitId, completionId, xpEarned);
        Alert.alert('Habit Unmarked', 'Habit has been unmarked for today.');
      } else {
        await logHabitCompletion(habitId, new Date(), 1, '', xpEarned);
        await firestore()
          .collection('users')
          .doc(userId)
          .update({
            totalXP: firestore.FieldValue.increment(xpEarned),
          });
        Alert.alert('Habit Completed!', 'Great job! Keep up the streak.');
      }
      await fetchHabitData();
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      Alert.alert(
        'Error',
        `Failed to update habit completion: ${error.message}. Reverting changes.`,
      );
      setTodayCompletions(prevTodayCompletions);
      await fetchHabitData();
    }
  };

  const noHabits = () => {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Icon name="add-circle-outline" size={60} color="#CBD5E0" />
        <Text className="text-lg text-gray-500 mb-4 text-center mt-4">
          You haven’t added any habits yet!
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddHabit')}
          className="bg-violet-500 px-6 py-3 rounded-full shadow-md">
          <Text className="text-white text-base font-semibold">
            Add New Habit
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHabitCard = ({item}) => {
    const CurrentIconComponent = IconComponents[item.iconFamily || 'Ionicons'];
    const iconName = item.icon || 'help-circle-outline';
    const isCompleted = !!todayCompletions[item.id];

    return (
      <Animated.View className="bg-white px-6 py-6 mb-6 mt-3 mx-4 flex-row items-start shadow-lg shadow-violet-200 border-gray-200 rounded-xl">
        <Pressable
          onPress={() =>
            navigation.navigate('HabitDetail', {
              habitId: item.id,
            })
          }
          className="flex-row items-start flex-1">
          <View className="bg-violet-100 p-4 rounded-xl mr-5">
            {CurrentIconComponent && (
              <CurrentIconComponent name={iconName} size={24} color="#7C3AED" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-gray-900">
              {item.name}
            </Text>
            {item.description ? (
              <Text className="text-sm text-gray-500 mb-3">
                {item.description}
              </Text>
            ) : null}
            <View className="flex-row items-center space-x-4">
              {item.reminder && item.reminder.enabled && item.reminder.time && (
                <View className="flex-row items-center space-x-1">
                  <Icon name="time-outline" size={16} color="#6B7280" />
                  <Text className="text-xs text-gray-500">
                    {item.reminder.time}
                  </Text>
                </View>
              )}
              {item.reminder && item.reminder.enabled && (
                <View className="flex-row items-center space-x-1">
                  <Icon
                    name="notifications-outline"
                    size={16}
                    color="#6B7280"
                  />
                  <Text className="text-xs text-gray-500">Reminder On</Text>
                </View>
              )}
            </View>
            {item.frequency && item.frequency.length > 0 && (
              <Text className="text-xs text-gray-500 mt-1">
                Frequency:{' '}
                {item.frequencyType === 'daily'
                  ? 'Daily'
                  : item.frequency.join(', ')}
              </Text>
            )}
            {item.createdAt && (
              <Text className="text-xs text-gray-500 mt-1">
                Created:{' '}
                {new Date(item.createdAt.toDate()).toLocaleDateString()}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => toggleHabitCompletion(item.id)}
            className="ml-3 self-center">
            {isCompleted ? (
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
  };

  if (loadingHabits) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text className="text-gray-700 mt-3">Loading Habits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-5">
        <Text className="text-red-500 text-center text-base mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-violet-500 py-3 px-6 rounded-lg shadow-md"
          onPress={fetchHabitData}>
          <Text className="text-white font-semibold text-base">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-3xl font-bold text-gray-800">Today's Habits</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddHabit')}
          className="bg-violet-400 px-4 py-2 rounded-md flex-row items-center space-x-1">
          <Icon name="add" size={16} color="#fff" />
          <Text className="text-white font-medium text-sm">New Habit</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('ProgressScreen')}
        className="bg-purple-100 px-4 py-3 rounded-xl flex-row items-center justify-center space-x-2 mb-6 shadow-sm shadow-purple-200">
        <Icon name="stats-chart-outline" size={20} color="#7C3AED" />
        <Text className="text-violet-600 font-semibold text-base">
          View Overall Progress
        </Text>
      </TouchableOpacity>

      {habitData.length > 0 ? (
        <FlatList
          data={habitData}
          renderItem={renderHabitCard}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          className="mt-2"
        />
      ) : (
        noHabits()
      )}
    </SafeAreaView>
  );
};

export default HabbitsScreen;
