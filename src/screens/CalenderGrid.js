import React, {useState} from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useHabitStore} from '../stores';

export const CalendarGrid = ({completions}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Create a new date object for the first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDay = firstDayOfMonth.getDay();

  const daysArray = [];

  // Fill in empty spaces for days before the 1st of the month
  for (let i = 0; i < startingDay; i++) {
    daysArray.push(null);
  }

  // Fill in the days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }
  // Navigate months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <View className="w-full">
      {/* Header with month navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity
          onPress={goToPreviousMonth}
          className="p-2 rounded-full bg-gray-100">
          <Icon name="chevron-back" size={20} color="#6B21A8" />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-800">
          {monthNames[currentMonth]} {currentYear}
        </Text>

        <TouchableOpacity
          onPress={goToNextMonth}
          className="p-2 rounded-full bg-gray-100">
          <Icon name="chevron-forward" size={20} color="#6B21A8" />
        </TouchableOpacity>
      </View>

      {/* Calendar Days */}
      <View className="flex-row flex-wrap">
        {daysArray.map((day, index) => {
          const isCompleted = completions?.some(
            completionDate =>
              completionDate.getDate() === day &&
              completionDate.getMonth() === currentMonth &&
              completionDate.getFullYear() === currentYear,
          );

          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          return (
            <View
              key={index}
              className="w-1/7 h-12 items-center justify-center mb-2">
              {day && (
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center shadow-sm ${
                    isToday && isCompleted
                      ? 'bg-emerald-100 border border-emerald-300'
                      : isToday
                      ? 'bg-purple-500 border border-purple-950'
                      : isCompleted
                      ? 'bg-emerald-100 border border-emerald-300'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                  <Text
                    className={`text-sm font-semibold ${
                      isToday && isCompleted
                        ? ' border-emerald-300'
                        : isToday
                        ? 'text-white'
                        : isCompleted
                        ? 'text-emerald-800'
                        : 'text-gray-600'
                    }`}>
                    {day}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};
