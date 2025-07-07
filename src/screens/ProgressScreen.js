import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const habits = [
  {
    id: 1,
    name: 'Drink Water',
    icon: 'water-outline',
    progress: 0.71,
    week: [true, false, true, true, false, false, false],
    streak: 3,
  },
  {
    id: 2,
    name: 'Meditate',
    icon: 'leaf-outline',
    progress: 0.43,
    week: [false, false, true, true, false, false, false],
    streak: 2,
  },
];

const ProgressScreen = () => {
  return (
    <ScrollView className="flex-1 bg-white px-4 py-6">
      <Text className="text-xl font-bold text-gray-900 mb-4">Habit Progress</Text>

      {habits.map(habit => (
        <View
          key={habit.id}
          className="bg-white rounded-2xl p-5 mb-5 shadow shadow-violet-100"
        >
          {/* Header */}
          <View className="flex-row items-center mb-3">
            <View className="bg-violet-100 p-3 rounded-xl mr-3">
              <Icon name={habit.icon} size={22} color="#7C3AED" />
            </View>
            <Text className="text-lg font-semibold text-gray-800">{habit.name}</Text>
          </View>

          {/* Weekly Tracker Dots */}
          <View className="flex-row justify-between mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View key={index} className="items-center">
                <Text className="text-xs text-gray-400">{day}</Text>
                <View
                  className={`w-4 h-4 mt-1 rounded-full ${
                    habit.week[index] ? 'bg-violet-500' : 'bg-gray-300'
                  }`}
                />
              </View>
            ))}
          </View>

          {/* Custom Progress Bar */}
          <View className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-3 bg-violet-500"
              style={{ width: `${habit.progress * 100}%` }}
            />
          </View>

          {/* Streak Message */}
          <Text className="mt-2 text-sm text-gray-500">
            🔥 Streak: {habit.streak} day{habit.streak > 1 ? 's' : ''} in a row
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default ProgressScreen;
