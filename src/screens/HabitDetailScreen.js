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
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHabitStore } from '../stores';
import { CalendarGrid } from './CalenderGrid';

const HabitDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { habitId } = route.params;

  console.log('HabitDetailScreen render for habitId:', habitId);

  // Early return if no habitId
  if (!habitId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Invalid Habit
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Simple selectors
  const habit = useHabitStore(state => state.habits.find(h => h.id === habitId));
  const loading = useHabitStore(state => state.loading);
  const error = useHabitStore(state => state.error);
  const deleteHabitFromStore = useHabitStore(state => state.deleteHabit);
  const completions = useHabitStore(state => state.completions[habitId] || []);

  const handleDeleteHabit = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit?.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('before deleteHabitFromStore');
              await deleteHabitFromStore(habitId);
              console.log('after deleteHabitFromStore');
              navigation.navigate('Habbits', { refresh: true });
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', 'Failed to delete habit. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditHabit = () => {
    navigation.navigate('AddHabit', { 
      habitId: habitId,
      editMode: true,
      habitData: habit 
    });
  };

  // Show loading state
  if (loading && !habit) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="mt-4 text-lg font-semibold text-gray-800">
            Loading habit details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center text-base mb-4">{error}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-red-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state if habit not found
  if (!habit) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Habit not found
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white/80 rounded-full p-3 shadow-lg"
          >
            <Icon name="arrow-back" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleEditHabit}
              className="bg-white/80 rounded-full p-3 shadow-lg"
            >
              <Icon name="create-outline" size={24} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteHabit}
              className="bg-white/80 rounded-full p-3 shadow-lg"
            >
              <Icon name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Habit Header Card */}
        <View className="mx-6 mt-4 mb-6">
          <View className="bg-white rounded-3xl p-8 shadow-xl">
            <View className="flex-row items-center mb-6">
              <View className="bg-violet-100 p-5 rounded-2xl mr-5">
                <Icon name="checkmark-circle" size={32} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-800 mb-1">
                  {habit.name}
                </Text>
                <View className="flex-row items-center">
                  <View className="bg-green-100 px-3 py-1 rounded-full mr-2">
                    <Text className="text-green-700 text-sm font-semibold">
                      Active
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {habit.description && (
              <View className="bg-gray-50 rounded-2xl p-4">
                <Text className="text-gray-700 text-base leading-6">
                  {habit.description}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Simple Stats */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between space-x-3">
            <View className="flex-1 bg-white rounded-2xl p-6 shadow-md">
              <View className="items-center">
                <Icon name="flame" size={24} color="#7C3AED" />
                <Text className="text-3xl font-bold text-gray-900 mb-1">
                  {habit.currentStreak || 0}
                </Text>
                <Text className="text-gray-700 text-sm font-semibold">
                  Current Streak
                </Text>
              </View>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-6 shadow-md">
              <View className="items-center">
                <Icon name="checkmark-circle" size={24} color="#7C3AED" />
                <Text className="text-3xl font-bold text-gray-900 mb-1">
                  {habit.habitXP || 0}
                </Text>
                <Text className="text-gray-700 text-sm font-semibold">
                  Habit XP
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-md">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Progress Calendar
            </Text>
            <CalendarGrid completions={completions} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HabitDetailScreen;
