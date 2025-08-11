import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {IconComponents} from '../../ReadData';
import {
  deleteHabit,
} from '../../WriteData'; // Import the completion functions
import {isSameDay, subDays, format, parseISO} from 'date-fns';
import {CalendarGrid} from './CalenderGrid';
import {calculateStreak} from '../../helpers';

// --- The main HabitDetailScreen component ---
const HabitDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {habitId} = route.params;
  const [habit, setHabit] = useState(null);
  console.log('habit---', habit);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState([]);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      setCurrentStreak(calculateStreak());
    }, [habitId]),
  );

  useFocusEffect(
    useCallback(() => {
      fetchHabitDetails();
      return () => {
        // Cleanup if needed (e.g., unsubscribe from a real-time listener)
      };
    }, [habitId]), // Re-run if habitId changes (e.g., navigating to a different habit detail)
  );
  const handleEditHabit = () => {
    navigation.navigate('AddHabit', {habitToEdit: habit});
  };

  const CurrentIconComponent = IconComponents[habit?.iconFamily || 'Ionicons'];
  const iconName = habit?.icon || 'help-circle-outline';

  const totalCompletions = completions.length;
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();
  const completionRate =
    totalCompletions > 0
      ? Math.round((totalCompletions / daysInMonth) * 100)
      : 0;

  const handleDeleteHabit = async () => {
    await deleteHabit(habitId);
    navigation.navigate('Habbits', {refresh: true});
  };

  const fetchHabitDetails = async () => {
    const userId = auth().currentUser?.uid;
    if (!userId || !habitId) {
      console.error('User or habit ID is missing.');
      Alert.alert('Error', 'Could not load habit details.');
      setLoading(false);
      return;
    }

    try {
      // Fetch habit details
      const habitDoc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('habits')
        .doc(habitId)
        .get();
      console.log('habitDoc---', habitDoc);
      if (!habitDoc.exists) {
        Alert.alert('Error', 'Habit not found.');
        setLoading(false);
        return;
      }
      setHabit({id: habitDoc.id, ...habitDoc.data()});

      // Fetch ALL completions for this habit
      const completionsSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('habits')
        .doc(habitId)
        .collection('completions')
        .orderBy('date', 'desc') // Order by date for streak calculation
        .get();
      
      const completionDates = completionsSnapshot.docs.map(
        doc => doc.data().date.toDate(), // Convert Firestore Timestamp to JS Date object
      );
      console.log('completionsSnapshot--', completionDates);
      setCompletions(completionDates);

      // Update streak and todayCompleted status
      setCurrentStreak(calculateStreak(completionDates));
      setTodayCompleted(
        completionDates.some(date => isSameDay(date, new Date())),
      );
    } catch (error) {
      console.error('Error fetching habit details:', error);
      Alert.alert('Error', 'Failed to load habit details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-4">
        <View className="flex-row self-end pb-4">
          <TouchableOpacity onPress={handleEditHabit} className="mr-6">
            <Icon name="create-outline" size={24} color="#4A5568" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteHabit}>
            <Icon name="trash-outline" size={24} color="#4A5568" />
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-md shadow-violet-200 my-4">
          <View className="flex-row items-center mb-4">
            <View className="bg-violet-100 p-4 rounded-xl mr-4">
              {CurrentIconComponent && (
                <CurrentIconComponent
                  name={iconName}
                  size={28}
                  color="#7C3AED"
                />
              )}
            </View>
            <Text className="text-xl font-bold text-gray-800">
              {habit?.name}
            </Text>
          </View>
          {habit?.description && (
            <Text className="text-gray-600 text-base">
              {habit?.description}
            </Text>
          )}
        </View>

        <View className="flex-row justify-between mb-4">
          <View className="flex-1 bg-white rounded-xl p-4 mr-2 items-center shadow-md">
            <Text className="text-3xl font-bold text-violet-600">
              {currentStreak}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">Current Streak</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 mx-2 items-center shadow-md">
            <Text className="text-3xl font-bold text-green-600">
              {totalCompletions}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Total Completions
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 ml-2 items-center shadow-md">
            <Text className="text-3xl font-bold text-blue-600">
              {completionRate}%
            </Text>
            <Text className="text-gray-500 text-sm mt-1">Completion Rate</Text>
          </View>
        </View>
        {/* <TouchableOpacity
          onPress={handleToggleCompletion}
          className={`px-6 py-4 rounded-full flex-row items-center justify-center ${
            todayCompleted ? 'bg-green-500' : 'bg-violet-500'
          } shadow-lg my-4`}>
          <Icon
            name={
              todayCompleted ? 'checkmark-circle-outline' : 'add-circle-outline'
            }
            size={24}
            color="#fff"
            className="mr-2"
          />
          <Text className="text-white text-lg font-semibold">
            {todayCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
          </Text>
        </TouchableOpacity> */}
        <View className="bg-white rounded-xl p-6 shadow-md shadow-violet-200">
          <Text className="text-xl font-bold text-gray-800">
            Progress This Month
          </Text>
          <CalendarGrid completions={completions} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HabitDetailScreen;
