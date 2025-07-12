import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  Animated,
} from 'react-native';
import React, {useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const HabbitsScreen = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation()
  const habitsData = [
    {
      id:1,
      name: 'Drink Water',
      description: 'Stay hydrated by drinking a glass of water.',
      time: '9:00 AM',
      icon: 'water-outline',
      reminder: true,
      isSelected: true,
     
    },
    {
      id:2,
      name: 'Morning Meditation',
      description: 'Start the day with 10 minutes of calm meditation.',
      time: '6:30 AM',
      icon: 'leaf-outline',
      reminder: true,
      isSelected: false,
    },
    {
      id:3,
      name: 'Evening Walk',
      description: 'Take a short walk after dinner.',
      time: '7:00 PM',
      icon:'walk-outline',
      reminder: false,
      isSelected: true,
    },
    {
      id:4,
      name: 'Read Book',
      description: 'Read at least 10 pages of any book.',
      time: '9:00 PM',
      icon: 'book-outline',
      reminder: true,
      isSelected: false,
    },
  ];

  const noHabits = () => {
    return (
      <View className="flex-1 bg-white items-center justify-center px-4">
        {/* <Image source={require('../../Images/addHabbit.png')}
    className='w-64 h-64 mb-6'
    resizeMode='contain'/> */}
        <Text className="text-lg text-gray-600 mb-4 text-center">
          You haven’t added any habits yet!
        </Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)} // or open a modal
          className="bg-violet-500 px-6 py-3 rounded-full shadow-md">
          <Text className="text-white text-base font-semibold">
            Add New Habit
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const renderHabitCard = ({item}) => (
    <Animated.View
      // style={{ transform: [{ scale }] }}
      className="bg-white px-6 py-6 mb-6 mt-3 mx-4 flex-row items-start shadow-lg shadow-violet-200 border-gray-200">
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
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

        <View className="ml-3">
          {item.isSelected ? (
            <View className="border border-violet-400 rounded-full w-8 h-8 bg-violet-400 items-center justify-center">
              <Icon name="checkmark" size={16} color="white" />
            </View>
          ) : (
            <View className="border border-violet-400 rounded-full w-8 h-8" />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <>
      {habitsData.length > 0 ? (
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

          <FlatList
            data={habitsData}
            renderItem={renderHabitCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            className="mt-8"
          />
        </View>
      ) : (
        noHabits()
      )}
     
    </>
  );
};

export default HabbitsScreen;
