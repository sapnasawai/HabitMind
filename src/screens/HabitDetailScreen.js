import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useHabitStore, useProgressStore} from '../stores';
import {IconComponents} from '../../ReadData';
import {CalendarGrid} from './CalenderGrid';

const HabitDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {habitId} = route.params;
  const hasFetchedRef = useRef(false);

  // Use new store structure with proper selectors
  const habit = useHabitStore(state =>
    state.habits.find(h => h.id === habitId),
  );
  const loading = useHabitStore(state => state.loading);
  const error = useHabitStore(state => state.error);
  const habitCompletions = useHabitStore(state => state.completions[habitId] || []);
  const deleteHabitFromStore = useHabitStore(state => state.deleteHabit);
  const getHabitStats = useProgressStore(state => state.getHabitStats);

  // Data will be loaded automatically by real-time listeners

  const handleEditHabit = () => {
    navigation.navigate('AddHabit', {habitToEdit: habit});
  };

  const CurrentIconComponent = IconComponents[habit?.iconFamily || 'Ionicons'];
  const iconName = habit?.icon || 'help-circle-outline';

  const handleDeleteHabit = async () => {
    try {
      await deleteHabitFromStore(habitId);
      navigation.navigate('Habbits', {refresh: true});
    } catch (error) {
      console.error('Error deleting habit:', error);
      Alert.alert('Error', 'Failed to delete habit. Please try again.');
    }
  };

  // Calculate stats using progress store
  const habitStats = getHabitStats(habitId, useHabitStore.getState().completions);
  const totalCompletions = habitStats.totalCompletions;
  const currentStreak = habit?.currentStreak || 0;
  const completionRate = habitStats.completionRate;

  // Convert completions to Date objects for CalendarGrid
  const completionsAsDates = habitCompletions?.map(comp => comp.date.toDate());

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-br from-violet-50 to-purple-50">
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 shadow-lg shadow-violet-200 items-center">
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text className="mt-4 text-lg font-semibold text-gray-800">
              Loading habit details...
            </Text>
            <Text className="mt-2 text-sm text-gray-500 text-center">
              Please wait while we fetch your data
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-br from-red-50 to-pink-50">
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 shadow-lg shadow-red-200 items-center">
            <View className="bg-red-100 rounded-full p-4 mb-4">
              <Icon name="alert-circle-outline" size={48} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Oops! Something went wrong
            </Text>
            <Text className="text-gray-600 text-center leading-6">
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mt-6 bg-red-500 px-6 py-3 rounded-xl">
              <Text className="text-white font-semibold">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state if habit not found
  if (!habit) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-br from-gray-50 to-slate-50">
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-200 items-center">
            <View className="bg-gray-100 rounded-full p-4 mb-4">
              <Icon name="help-circle-outline" size={48} color="#9ca3af" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Habit not found
            </Text>
            <Text className="text-gray-600 text-center leading-6 mb-6">
              The habit you're looking for doesn't exist or may have been
              deleted
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-gray-500 px-6 py-3 rounded-xl">
              <Text className="text-white font-semibold">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Actions */}
        <View className="flex-row justify-end items-center px-6 pt-4 pb-2">
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleEditHabit}
              className="bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg shadow-violet-200 mr-3">
              <Icon name="create-outline" size={24} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteHabit}
              className="bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg shadow-red-200">
              <Icon name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Habit Header Card */}
        <View className="mx-6 mt-4 mb-6">
          <View className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-violet-200/50">
            <View className="flex-row items-center mb-6">
              <View className="bg-gradient-to-br from-violet-500 to-purple-600 p-5 rounded-2xl mr-5 shadow-lg shadow-violet-300/50">
                {CurrentIconComponent && (
                  <CurrentIconComponent
                    name={iconName}
                    size={32}
                    color="#7C3AED"
                  />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-800 mb-1">
                  {habit?.name}
                </Text>
                <View className="flex-row items-center">
                  <View className="bg-green-100 px-3 py-1 rounded-full mr-2">
                    <Text className="text-green-700 text-sm font-semibold">
                      Active
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    {habit?.type || 'Habit'}
                  </Text>
                </View>
              </View>
            </View>

            {habit?.description && (
              <View className="bg-gray-50/80 rounded-2xl p-4">
                <Text className="text-gray-700 text-base leading-6">
                  {habit?.description}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Statistics Cards */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between space-x-3">
            <View className="flex-1 bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <View className="items-center">
                <View className="bg-violet-100 rounded-full p-3 mb-3">
                  <Icon name="flame" size={24} color="#7C3AED" />
                </View>
                <Text className="text-3xl font-bold text-gray-900 mb-1">
                  {currentStreak}
                </Text>
                <Text className="text-gray-700 text-sm font-semibold">
                  Current Streak
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  days in a row
                </Text>
              </View>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <View className="items-center">
                <View className="bg-violet-100 rounded-full p-3 mb-3">
                  <Icon name="checkmark-circle" size={24} color="#7C3AED" />
                </View>
                <Text className="text-3xl font-bold text-gray-900 mb-1">
                  {totalCompletions}
                </Text>
                <Text className="text-gray-700 text-sm font-semibold">
                  Total Done
                </Text>
                <Text className="text-gray-500 text-xs mt-1">completions</Text>
              </View>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <View className="items-center">
                <View className="bg-violet-100 rounded-full p-3 mb-3">
                  <Icon name="trending-up" size={24} color="#7C3AED" />
                </View>
                <Text className="text-3xl font-bold text-gray-900 mb-1">
                  {completionRate}%
                </Text>
                <Text className="text-gray-700 text-sm font-semibold">
                  This Month
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  completion rate
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar Progress Section */}
        <View className="mx-6 mb-8">
          <View className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-violet-200/50">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  Progress This Month
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Track your daily completions
                </Text>
              </View>
              <View className="bg-violet-100 rounded-full p-3">
                <Icon name="calendar" size={24} color="#7C3AED" />
              </View>
            </View>
            <CalendarGrid completions={completionsAsDates} />           
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HabitDetailScreen;
