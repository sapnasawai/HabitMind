import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useRoute } from '@react-navigation/native';
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subDays,
  differenceInCalendarDays,
  isYesterday,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';

const screenWidth = Dimensions.get('window').width;

// --- SIMULATED DATA (from HabbitsScreen) ---
// In a real app, this data would come from Firestore and be passed via Context/Redux
// or fetched directly here. For now, we'll import the simulated data.
import { ALL_HABITS_DATA_SIMULATED, ALL_COMPLETIONS_DATA_SIMULATED } from './HabbitsScreen'; // Adjust path as needed

// --- HELPER FUNCTIONS (copied from previous ProgressScreen, slightly adapted) ---

// Calculates the current streak for a habit
const calculateStreak = (habitId, completions, allHabits) => {
  const habitCompletions = completions
    .filter(c => c.habitId === habitId)
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()); // Sort descending

  if (habitCompletions.length === 0) {
    return 0;
  }

  let streak = 0;
  let lastCompletionDate = null;
  const today = new Date();

  // Check if completed today or yesterday
  const firstCompletion = habitCompletions[0].completedAt;
  if (isSameDay(firstCompletion, today)) {
    streak = 1;
    lastCompletionDate = today;
  } else if (isYesterday(firstCompletion)) {
    streak = 1;
    lastCompletionDate = today; // Reference point for yesterday's completion
  } else {
    return 0; // Streak broken if last completion is not today or yesterday
  }

  for (let i = 0; i < habitCompletions.length; i++) {
    const currentCompletionDate = habitCompletions[i].completedAt;

    if (lastCompletionDate && isSameDay(currentCompletionDate, lastCompletionDate)) {
      continue; // Skip if current completion is same day as last processed
    }

    let expectedPrevDay = null;
    const habit = allHabits.find(h => h.id === habitId);

    if (!habit) continue; // Should not happen if data is consistent

    if (habit.frequency === 'daily') {
      expectedPrevDay = subDays(lastCompletionDate, 1);
    } else if (habit.frequency === 'specificDays' && habit.specificDays) {
      let daysBack = 1;
      let foundPrev = false;
      while (!foundPrev && daysBack <= 7) {
        const potentialPrevDay = subDays(lastCompletionDate, daysBack);
        if (habit.specificDays.includes(potentialPrevDay.getDay())) {
          expectedPrevDay = potentialPrevDay;
          foundPrev = true;
        }
        daysBack++;
      }
    }

    if (expectedPrevDay && isSameDay(currentCompletionDate, expectedPrevDay)) {
      streak++;
      lastCompletionDate = currentCompletionDate;
    } else {
      break; // Streak broken
    }
  }
  return streak;
};

// Determines if a habit was completed on a specific day
const wasCompletedOnDay = (habitId, completions, date) => {
  return completions.some(c => c.habitId === habitId && isSameDay(c.completedAt, date));
};

// Calculate completion rate for a given period
const calculateCompletionRate = (habitId, completions, habitDetails, startDate, endDate) => {
  const relevantCompletions = completions.filter(c =>
    c.habitId === habitId && c.completedAt >= startDate && c.completedAt <= endDate
  );

  const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
  let expectedDays = 0;
  let completedDays = 0;

  daysInPeriod.forEach(day => {
    let isExpected = false;
    if (habitDetails.frequency === 'daily') {
      isExpected = true;
    } else if (habitDetails.frequency === 'specificDays' && habitDetails.specificDays) {
      isExpected = habitDetails.specificDays.includes(getDay(day));
    }
    // Add other frequencies if needed

    if (isExpected && day <= new Date()) { // Only count expected days up to today
      expectedDays++;
      if (relevantCompletions.some(c => isSameDay(c.completedAt, day))) {
        completedDays++;
      }
    }
  });

  return expectedDays > 0 ? (completedDays / expectedDays) : 0;
};


const HabitDetailScreen = () => {
  const route = useRoute();
  const { habitId, habitName } = route.params;

  const [habitDetails, setHabitDetails] = useState(null);
  const [habitCompletions, setHabitCompletions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // For calendar view
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0); // You'd need to calculate/store this
  const [completionRate, setCompletionRate] = useState(0);
  const [trendChartData, setTrendChartData] = useState({ labels: [], datasets: [{ data: [] }] });

  useEffect(() => {
    // Simulate fetching habit details and completions
    const foundHabit = ALL_HABITS_DATA_SIMULATED.find(h => h.id === habitId);
    setHabitDetails(foundHabit);

    const filteredCompletions = ALL_COMPLETIONS_DATA_SIMULATED.filter(c => c.habitId === habitId);
    setHabitCompletions(filteredCompletions);

    // Calculate metrics
    setStreak(calculateStreak(habitId, ALL_COMPLETIONS_DATA_SIMULATED, ALL_HABITS_DATA_SIMULATED));
    // For longest streak, you'd need a more complex calculation or store it in Firestore
    setLongestStreak(5); // Placeholder

    const today = new Date();
    const overallStartDate = foundHabit ? foundHabit.creationDate : new Date(2020, 0, 1);
    setCompletionRate(calculateCompletionRate(habitId, ALL_COMPLETIONS_DATA_SIMULATED, foundHabit, overallStartDate, today));

    // Prepare data for trend chart (e.g., last 30 days)
    const thirtyDaysAgo = subDays(today, 29);
    const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const dailyCompletionStatus = last30Days.map(day => {
      return wasCompletedOnDay(habitId, ALL_COMPLETIONS_DATA_SIMULATED, day) ? 1 : 0;
    });

    setTrendChartData({
      labels: last30Days.map(day => format(day, 'MMM d')),
      datasets: [{ data: dailyCompletionStatus }],
    });

  }, [habitId, ALL_COMPLETIONS_DATA_SIMULATED]); // Re-run when habitId or simulated completions change

  if (!habitDetails) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-600">Loading habit details...</Text>
      </View>
    );
  }

  // Calendar data generation
  const startOfCurrentMonth = startOfMonth(currentMonth);
  const endOfCurrentMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#ffffff",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`, // violet-500
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#7c3aed"
    },
    formatXLabel: (label) => {
        if (label.length > 8) {
            const parts = label.split(' ');
            return parts.length > 1 ? `${parts[0]}\n${parts[1]}` : label;
        }
        return label;
    }
  };


  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 py-6">
      <Text className="text-3xl font-bold text-gray-800 mb-2">{habitName}</Text>
      <Text className="text-sm text-gray-500 mb-6">Your detailed progress for this habit.</Text>

      {/* Summary Stats */}
      <View className="flex-row justify-around mb-6">
        <View className="items-center bg-white p-4 rounded-xl shadow-sm shadow-violet-100 flex-1 mx-2">
          <Icon name="flame-outline" size={28} color="#F59E0B" />
          <Text className="text-xl font-bold text-gray-800 mt-2">{streak}</Text>
          <Text className="text-sm text-gray-500">Current Streak</Text>
        </View>
        <View className="items-center bg-white p-4 rounded-xl shadow-sm shadow-violet-100 flex-1 mx-2">
          <Icon name="trophy-outline" size={28} color="#10B981" />
          <Text className="text-xl font-bold text-gray-800 mt-2">{longestStreak}</Text>
          <Text className="text-sm text-gray-500">Longest Streak</Text>
        </View>
        <View className="items-center bg-white p-4 rounded-xl shadow-sm shadow-violet-100 flex-1 mx-2">
          <Icon name="checkmark-circle-outline" size={28} color="#7C3AED" />
          <Text className="text-xl font-bold text-gray-800 mt-2">{Math.round(completionRate * 100)}%</Text>
          <Text className="text-sm text-gray-500">Completion Rate</Text>
        </View>
      </View>

      {/* Monthly Calendar View */}
      <View className="bg-white rounded-2xl p-4 mb-5 shadow shadow-violet-100">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <Icon name="chevron-back-outline" size={24} color="gray" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <Icon name="chevron-forward-outline" size={24} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Days of week header */}
        <View className="flex-row justify-around mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Text key={index} className="text-xs text-gray-400 w-8 text-center">{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View className="flex-wrap flex-row justify-start">
          {/* Fill leading empty days */}
          {[...Array(getDay(startOfCurrentMonth))].map((_, i) => (
            <View key={`empty-${i}`} className="w-8 h-8 m-1" />
          ))}
          {/* Days of the month */}
          {daysInMonth.map((day, index) => {
            const isCompleted = wasCompletedOnDay(habitId, habitCompletions, day);
            const isCurrentDay = isSameDay(day, new Date());
            return (
              <View
                key={index}
                className={`w-8 h-8 m-1 rounded-full items-center justify-center
                  ${isCompleted ? 'bg-violet-500' : 'bg-gray-200'}
                  ${isCurrentDay ? 'border-2 border-violet-700' : ''}
                `}
              >
                <Text className={`text-xs ${isCompleted ? 'text-white' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Completion Trend Chart */}
      <View className="bg-white rounded-2xl p-4 mb-5 shadow shadow-violet-100">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Completion Trend (Last 30 Days)</Text>
        {trendChartData.labels.length > 0 ? (
          <LineChart
            data={trendChartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        ) : (
          <Text className="text-center text-gray-500 py-10">No completion data for this period.</Text>
        )}
      </View>

      {/* Placeholder for other charts like weekly/monthly bars if needed */}
      {/* <View className="bg-white rounded-2xl p-4 mb-5 shadow shadow-violet-100">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Weekly Performance</Text>
        <BarChart
          data={{
            labels: ['W1', 'W2', 'W3', 'W4'],
            datasets: [{ data: [0.7, 0.9, 0.6, 0.8] }]
          }}
          width={screenWidth - 64}
          height={220}
          chartConfig={chartConfig}
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View> */}

    </ScrollView>
  );
};

export default HabitDetailScreen;
