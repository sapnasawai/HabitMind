import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHabitStore, useCompletionStore } from '../stores';
import { useHabitsWithCompletions } from '../hooks/useStoreUtils';
import { IconComponents } from '../../ReadData';

const HabbitsScreenUpdated = () => {
  const { 
    loading: habitsLoading, 
    error: habitsError, 
    fetchHabits,
    deleteHabit 
  } = useHabitStore();

  const { 
    loading: completionsLoading,
    error: completionsError,
    logCompletion,
    deleteCompletion,
    fetchTodayCompletions
  } = useCompletionStore();

  // Get habits with completion status using utility hook
  const habitsWithCompletions = useHabitsWithCompletions();

  // Fetch data on component mount
  useEffect(() => {
    fetchHabits();
  }, []);

  // Fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const habitIds = habitsWithCompletions.map(habit => habit.id);
      if (habitIds.length > 0) {
        fetchTodayCompletions(habitIds);
      }
    }, [habitsWithCompletions])
  );

  // Handle habit completion toggle
  const handleToggleCompletion = async (habit) => {
    try {
      if (habit.isCompletedToday) {
        // Delete today's completion
        const completionId = habit.todayCompletionId;
        await deleteCompletion(habit.id, completionId);
      } else {
        // Log new completion
        await logCompletion(habit.id, new Date());
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  // Handle habit deletion
  const handleDeleteHabit = async (habitId) => {
    try {
      await deleteHabit(habitId);
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  // Render individual habit item
  const renderHabitItem = ({ item: habit }) => {
    const IconComponent = IconComponents[habit.iconFamily] || IconComponents.Ionicons;
    
    return (
      <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <IconComponent 
              name={habit.iconName || 'ellipse-outline'} 
              size={24} 
              color="#6366f1" 
              className="mr-3"
            />
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">
                {habit.name}
              </Text>
              <Text className="text-sm text-gray-600">
                {habit.description}
              </Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-xs text-gray-500 mr-3">
                  Streak: {habit.currentStreak || 0}
                </Text>
                <Text className="text-xs text-gray-500">
                  XP: {habit.habitXP || 0}
                </Text>
              </View>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => handleToggleCompletion(habit)}
              className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                habit.isCompletedToday ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <Icon 
                name={habit.isCompletedToday ? 'checkmark' : 'add'} 
                size={20} 
                color={habit.isCompletedToday ? 'white' : '#6b7280'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleDeleteHabit(habit.id)}
              className="w-8 h-8 rounded-full bg-red-100 items-center justify-center"
            >
              <Icon name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Show loading state
  if (habitsLoading || completionsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="mt-2 text-gray-600">Loading habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (habitsError || completionsError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-4">
          <Icon name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="mt-2 text-lg font-semibold text-gray-800">
            Something went wrong
          </Text>
          <Text className="mt-1 text-gray-600 text-center">
            {habitsError || completionsError}
          </Text>
          <TouchableOpacity
            onPress={() => {
              fetchHabits();
              const habitIds = habitsWithCompletions.map(habit => habit.id);
              if (habitIds.length > 0) {
                fetchTodayCompletions(habitIds);
              }
            }}
            className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state
  if (habitsWithCompletions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-4">
          <Icon name="add-circle-outline" size={64} color="#9ca3af" />
          <Text className="mt-4 text-xl font-semibold text-gray-800">
            No habits yet
          </Text>
          <Text className="mt-2 text-gray-600 text-center">
            Start building good habits by adding your first one
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 pt-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-800">
            My Habits
          </Text>
          <Text className="text-gray-600">
            {habitsWithCompletions.filter(h => h.isActive).length} active habits
          </Text>
        </View>

        <FlatList
          data={habitsWithCompletions}
          renderItem={renderHabitItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default HabbitsScreenUpdated;


