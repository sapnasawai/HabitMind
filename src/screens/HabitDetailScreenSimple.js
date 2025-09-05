import React from 'react';
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
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { IconComponents } from '../../ReadData';
import { CalendarGrid } from './CalenderGrid';

// Simple HabitDetailScreen without Zustand to avoid infinite loops
const HabitDetailScreenSimple = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { habitId } = route.params;

  // For now, just show a simple screen without data to test navigation
  const handleEditHabit = () => {
    // Navigate back to habits screen for now
    navigation.goBack();
  };

  const handleDeleteHabit = async () => {
    // Navigate back to habits screen for now
    navigation.goBack();
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
              <Icon name="help-circle-outline" size={28} color="#7C3AED" />
            </View>
            <Text className="text-xl font-bold text-gray-800">
              Habit Details
            </Text>
          </View>
          <Text className="text-gray-600 text-base">
            This is a simplified version to test navigation. The infinite loop issue has been resolved.
          </Text>
        </View>

        <View className="flex-row justify-between mb-4">
          <View className="flex-1 bg-white rounded-xl p-4 mr-2 items-center shadow-md">
            <Text className="text-3xl font-bold text-violet-600">
              0
            </Text>
            <Text className="text-gray-500 text-sm mt-1">Current Streak</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 mx-2 items-center shadow-md">
            <Text className="text-3xl font-bold text-green-600">
              0
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Total Completions
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 ml-2 items-center shadow-md">
            <Text className="text-3xl font-bold text-blue-600">
              0%
            </Text>
            <Text className="text-gray-500 text-sm mt-1">Completion Rate</Text>
          </View>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-md shadow-violet-200">
          <Text className="text-xl font-bold text-gray-800">
            Progress This Month
          </Text>
          <View className="mt-4 p-4 bg-gray-100 rounded-lg">
            <Text className="text-gray-600 text-center">
              Calendar view will be restored once the infinite loop issue is fully resolved.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-violet-500 py-4 rounded-lg shadow-md items-center justify-center mt-6"
        >
          <Text className="text-white text-lg font-semibold">
            Go Back to Habits
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HabitDetailScreenSimple;
