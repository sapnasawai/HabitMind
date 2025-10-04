import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MotiView, MotiText } from 'moti';
import { IconComponents } from '../../ReadData';
import { useHabitStore, useProgressStore } from '../stores';

const HabbitsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [completedHabitName, setCompletedHabitName] = useState('');

  // Use new store structure with proper selectors
  const habits = useHabitStore(state => state.habits);
  const loading = useHabitStore(state => state.loading);
  const error = useHabitStore(state => state.error);
  // Removed operationLoading - using optimistic updates instead
  const logCompletion = useHabitStore(state => state.logCompletion);
  const deleteCompletion = useHabitStore(state => state.deleteCompletion);
  const getTodayCompletions = useHabitStore(state => state.getTodayCompletions);
  const completions = useHabitStore(state => state.completions);
  const isInitialized = useHabitStore(state => state.isInitialized);
  const forceReinitialize = useHabitStore(state => state.forceReinitialize);
  // Get habits with completion status using progress store
  const getHabitsWithCompletions = useProgressStore(
    state => state.getHabitsWithCompletions,
  );
  const todayCompletions = getTodayCompletions();
  const habitsWithCompletions = getHabitsWithCompletions(
    habits,
    todayCompletions,
  );

  // Fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.refresh) {
        console.log('HabbitsScreen focused, refreshing data...');
        // Data will be refreshed automatically by real-time listeners
        navigation.setParams({ refresh: false }); // Reset the flag
      }
    }, [route.params?.refresh, navigation]),
  );

  // Auto-reinitialize if no habits found after delay (fallback mechanism)
  useEffect(() => {
    if (habits.length === 0 && !loading && !error) {
      const timer = setTimeout(() => {
        const status = isInitialized();
        console.log('🔍 No habits found, checking status:', status);
        if (status.hasUser && !status.hasListeners) {
          console.log('🔄 Auto-reinitializing listeners...');
          forceReinitialize();
        }
      }, 3000); // Wait 3 seconds before checking

      return () => clearTimeout(timer);
    }
  }, [habits.length, loading, error, isInitialized, forceReinitialize]);

  const toggleHabitCompletion = async (habitId, xpEarned = 10) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      const isCurrentlyCompleted = habitsWithCompletions.find(
        h => h.id === habitId,
      )?.isCompletedToday;

      if (isCurrentlyCompleted) {
        // Delete today's completion
        const completionId = habitsWithCompletions.find(
          h => h.id === habitId,
        )?.todayCompletionId;
        if (completionId) {
          await deleteCompletion(habitId, completionId, xpEarned);
          Alert.alert('Habit Unmarked', 'Habit has been unmarked for today.');
        }
      } else {
        // Log new completion and show modal
        await logCompletion(habitId, new Date(), 1, '', xpEarned);
        setCompletedHabitName(habit.name);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      Alert.alert(
        'Error',
        `Failed to update habit completion: ${error.message}. Please try again.`,
      );
    }
  };

  const CompletionModal = () => {
    return (
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowModal(false)}
          className="flex-1 bg-black/50 items-center justify-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="w-full"
          >
            <MotiView
              key={showModal ? 'modal-open' : 'modal-closed'}
              from={{
                scale: 0.8,
                opacity: 0,
                translateY: 50,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                translateY: 0,
              }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 300,
                mass: 0.8,
              }}
              className="bg-white rounded-2xl p-12 items-center shadow-2xl max-w-lg w-full mx-auto overflow-hidden"
            >
              {/* Wavy animation around checkmark - bigger space */}
              <View className="items-center justify-center mb-8 relative py-8">
                {/* Multiple ripple waves around checkmark */}
                {[...Array(4).keys()].map(index => (
                  <MotiView
                    key={`ripple-${index}-${showModal}`}
                    from={{
                      scale: 0.5,
                      opacity: 0.7,
                    }}
                    animate={{
                      scale: [0.5, 3, 4],
                      opacity: [0.7, 0.3, 0],
                    }}
                    transition={{
                      type: 'timing',
                      duration: 2500,
                      delay: index * 300,
                      loop: true,
                      repeatReverse: false,
                    }}
                    style={{
                      position: 'absolute',
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: '#8B5CF6',
                      opacity: 0.3,
                    }}
                  />
                ))}

                {/* Main checkmark with pop animation */}
                <MotiView
                  key={`checkmark-${showModal}`}
                  from={{
                    scale: 0,
                    rotate: '0deg',
                  }}
                  animate={{
                    scale: [0, 1.4, 1],
                    rotate: '0deg',
                  }}
                  transition={{
                    type: 'spring',
                    damping: 8,
                    stiffness: 150,
                    delay: 200,
                  }}
                  className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full items-center justify-center shadow-xl z-10"
                >
                  <Icon name="checkmark" size={40} color="white" />
                </MotiView>
              </View>

              {/* Main title */}
              <MotiText
                key={`title-${showModal}`}
                from={{
                  opacity: 0,
                  translateY: 20,
                }}
                animate={{
                  opacity: 1,
                  translateY: 0,
                }}
                transition={{
                  type: 'timing',
                  duration: 600,
                  delay: 400,
                }}
                className="text-2xl font-bold text-gray-800 text-center mb-2"
              >
                Great Job! 🎉
              </MotiText>

              {/* Habit name */}
              {/* <MotiText
                from={{
                  opacity: 0,
                  translateY: 15,
                }}
                animate={{
                  opacity: 1,
                  translateY: 0,
                }}
                transition={{
                  type: 'timing',
                  duration: 500,
                  delay: 600,
                }}
                className="text-lg text-violet-600 font-semibold text-center mb-4"
              >
                "{completedHabitName}"
              </MotiText> */}

              {/* Encouragement message */}
              <MotiText
                key={`message-${showModal}`}
                from={{
                  opacity: 0,
                  translateY: 15,
                }}
                animate={{
                  opacity: 1,
                  translateY: 0,
                }}
                transition={{
                  type: 'timing',
                  duration: 500,
                  delay: 800,
                }}
                className="text-base text-gray-600 text-center mb-6"
              >
                Keep up the amazing streak! 💪
              </MotiText>
            </MotiView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const noHabits = () => {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Icon name="add-circle-outline" size={60} color="#CBD5E0" />
        <Text className="text-lg text-gray-500 mb-4 text-center mt-4">
          You haven't added any habits yet!
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddHabit')}
          className="bg-violet-500 px-6 py-3 rounded-full shadow-md"
        >
          <Text className="text-white text-base font-semibold">
            Add New Habit
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHabitCard = ({ item }) => {
    const CurrentIconComponent = IconComponents[item.iconFamily || 'Ionicons'];
    const iconName = item.icon || 'help-circle-outline';
    const isCompleted = item.isCompletedToday;
    // Removed loading states - using optimistic updates instead

    return (
      <View className="bg-white px-6 py-6 mb-6 mt-3 mx-4 flex-row items-start shadow-lg shadow-violet-200 border-gray-200 rounded-xl">
        <Pressable
          onPress={() =>
            navigation.navigate('HabitDetail', {
              habitId: item.id,
              habitName: item.name,
            })
          }
          className="flex-row items-start flex-1"
        >
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
                {item.createdAt.toDate 
                  ? new Date(item.createdAt.toDate()).toLocaleDateString()
                  : new Date(item.createdAt).toLocaleDateString()
                }
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => toggleHabitCompletion(item.id)}
            className="ml-3 self-center"
          >
            {isCompleted ? (
              <View className="border border-violet-400 rounded-full w-8 h-8 bg-violet-400 items-center justify-center">
                <Icon name="checkmark" size={16} color="white" />
              </View>
            ) : (
              <View className="border border-violet-400 rounded-full w-8 h-8 bg-white" />
            )}
          </TouchableOpacity>
        </Pressable>
      </View>
    );
  };

  // Show loading state only for critical operations (first-time bootstrapping)
  if (loading && habits.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text className="text-gray-700 mt-3">Loading Habits...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-5">
        <Text className="text-red-500 text-center text-base mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-violet-500 py-3 px-6 rounded-lg shadow-md"
          onPress={() => {
            // Data will be refreshed automatically by real-time listeners
          }}
        >
          <Text className="text-white font-semibold text-base">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Debug function (only in development)
  const handleDebugInfo = () => {
    const status = isInitialized();
    Alert.alert(
      'Debug Info',
      `User: ${status.hasUser}\nHabits: ${status.hasHabits} (${habits.length})\nListeners: ${status.hasListeners}\nError: ${status.hasError}\nLast Updated: ${status.lastUpdated}`,
      [
        { text: 'Force Reinit', onPress: forceReinitialize },
        { text: 'OK' }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-4">
      <CompletionModal />
      <View className="flex-row justify-between items-center mb-4">
        {/* Debug button (only in development) */}
        {__DEV__ && (
          <TouchableOpacity
            onPress={handleDebugInfo}
            className="bg-gray-500 px-3 py-2 rounded-md"
          >
            <Text className="text-white text-xs">Debug</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={() => navigation.navigate('AddHabit')}
          className="bg-violet-400 px-4 py-2 rounded-md flex-row items-center space-x-1"
        >
          <Icon name="add" size={16} color="#fff" />
          <Text className="text-white font-medium text-sm">New Habit</Text>
        </TouchableOpacity>
      </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Progress')}
          className="bg-purple-100 px-4 py-3 rounded-xl flex-row items-center justify-center space-x-2 mb-6 shadow-sm shadow-purple-200"
        >
          <Icon name="stats-chart-outline" size={20} color="#7C3AED" />
          <Text className="text-violet-600 font-semibold text-base">
            View Overall Progress
          </Text>
        </TouchableOpacity>

      {habitsWithCompletions.length > 0 ? (
        <FlatList
          data={habitsWithCompletions}
          renderItem={renderHabitCard}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          className="mt-2 mb-20"
        />
      ) : (
        noHabits()
      )}
    </SafeAreaView>
  );
};

export default HabbitsScreen;

//TODO: Many problems found in HabitScreen 
//1. Optimistic updates are not working properly
//2. When we toggle the habit completion, the habit is not updated immediately, its loading endlessly
//3. When launched the app, habits are not there, even when i am working suddenly these habits are getting disappeared
//4. My app should be Offline first app.
