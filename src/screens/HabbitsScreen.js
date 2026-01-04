import React, { useEffect, useState, useRef } from 'react';
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
  Animated,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
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

  // Animation refs for the completion modal
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.5)).current;
  const rippleOpacity = useRef(new Animated.Value(0.7)).current;
  const rippleAnimationRef = useRef(null);

  // Run animations when modal opens
  useEffect(() => {
    if (showModal) {
      // Reset animations
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      checkmarkScale.setValue(0);
      textOpacity.setValue(0);
      rippleScale.setValue(0.5);
      rippleOpacity.setValue(0.7);

      // Modal container animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Checkmark pop animation
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(checkmarkScale, {
          toValue: 1,
          damping: 8,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Text fade in
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      rippleAnimationRef.current = Animated.loop(
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 3,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      );
      rippleAnimationRef.current.start();
    } else {
      if (rippleAnimationRef.current) {
        rippleAnimationRef.current.stop();
        rippleAnimationRef.current = null;
      }
    }
    return () => {
      if (rippleAnimationRef.current) {
        rippleAnimationRef.current.stop();
        rippleAnimationRef.current = null;
      }
    };
  }, [showModal]);

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
            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              }}
              className="bg-white rounded-2xl p-12 items-center shadow-2xl max-w-lg w-full mx-auto overflow-hidden"
            >
              {/* Wavy animation around checkmark */}
              <View className="items-center justify-center mb-8 relative py-8">
                {/* Ripple wave */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: '#8B5CF6',
                    transform: [{ scale: rippleScale }],
                    opacity: rippleOpacity,
                  }}
                />

                {/* Main checkmark with pop animation */}
                <Animated.View
                  style={{
                    transform: [{ scale: checkmarkScale }],
                  }}
                  className="w-20 h-20 bg-violet-500 rounded-full items-center justify-center shadow-xl"
                >
                  <Icon name="checkmark" size={40} color="white" />
                </Animated.View>
              </View>

              {/* Main title */}
              <Animated.Text
                style={{ opacity: textOpacity }}
                className="text-2xl font-bold text-gray-800 text-center mb-2"
              >
                Great Job! 🎉
              </Animated.Text>

              {/* Encouragement message */}
              <Animated.Text
                style={{ opacity: textOpacity }}
                className="text-base text-gray-600 text-center mb-6"
              >
                Keep up the amazing streak! 💪
              </Animated.Text>
            </Animated.View>
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
            forceReinitialize();
          }}
        >
          <Text className="text-white font-semibold text-base">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-4">
      <CompletionModal />
      <View className="flex-row justify-end items-center mb-4">
        <TouchableOpacity
          onPress={() => navigation.navigate('AddHabit')}
          className="bg-violet-400 px-4 py-2 rounded-md flex-row items-center space-x-1"
        >
          <Icon name="add" size={16} color="#fff" />
          <Text className="text-white font-medium text-sm">New Habit</Text>
        </TouchableOpacity>
      </View>

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
