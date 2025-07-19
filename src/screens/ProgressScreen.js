import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  format,
  isSameDay,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getDay,
  isYesterday, // Needed for specificDays frequency in helper functions
} from 'date-fns';

const screenWidth = Dimensions.get('window').width;

// --- SIMULATED DATA ---
// Importing simulated data from HabbitsScreen to maintain a single source of truth for demo
import { ALL_HABITS_DATA_SIMULATED, ALL_COMPLETIONS_DATA_SIMULATED } from './HabbitsScreen';

// --- HELPER FUNCTIONS (Imported or Defined) ---
// These helper functions are crucial for calculating various progress metrics.
// We'll import the common ones from HabitDetailScreen to avoid duplication.
// Ensure HabitDetailScreen.js exports these functions if they are not already.
// For this example, I'm including them here for completeness, assuming they might not be exported.

// Calculates the current streak for a habit (copied for self-containment)
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

  const firstCompletion = habitCompletions[0].completedAt;
  if (isSameDay(firstCompletion, today)) {
    streak = 1;
    lastCompletionDate = today;
  } else if (isYesterday(firstCompletion)) {
    streak = 1;
    lastCompletionDate = today;
  } else {
    return 0;
  }

  for (let i = 0; i < habitCompletions.length; i++) {
    const currentCompletionDate = habitCompletions[i].completedAt;

    if (lastCompletionDate && isSameDay(currentCompletionDate, lastCompletionDate)) {
      continue;
    }

    let expectedPrevDay = null;
    const habit = allHabits.find(h => h.id === habitId);

    if (!habit) continue;

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
      break;
    }
  }
  return streak;
};

// Determines if a habit was completed on a specific day (copied for self-containment)
const wasCompletedOnDay = (habitId, completions, date) => {
  return completions.some(c => c.habitId === habitId && isSameDay(c.completedAt, date));
};

// Calculate completion rate for a given period for a single habit (copied for self-containment)
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

    if (isExpected && day <= new Date()) {
      expectedDays++;
      if (relevantCompletions.some(c => isSameDay(c.completedAt, day))) {
        completedDays++;
      }
    }
  });

  return expectedDays > 0 ? (completedDays / expectedDays) : 0;
};


// Calculates overall completion rate across all habits for a period (defined here as it's specific to overall view)
const calculateOverallCompletionRate = (allHabits, allCompletions, startDate, endDate) => {
  let totalExpectedCompletions = 0;
  let totalActualCompletions = 0;

  allHabits.forEach(habit => {
    const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
    daysInPeriod.forEach(day => {
      let isExpected = false;
      if (habit.frequency === 'daily') {
        isExpected = true;
      } else if (habit.frequency === 'specificDays' && habit.specificDays) {
        isExpected = habit.specificDays.includes(getDay(day));
      }

      if (isExpected && day <= new Date()) {
        totalExpectedCompletions++;
        if (allCompletions.some(c => c.habitId === habit.id && isSameDay(c.completedAt, day))) {
          totalActualCompletions++;
        }
      }
    });
  });

  return totalExpectedCompletions > 0 ? (totalActualCompletions / totalExpectedCompletions) : 0;
};

const ProgressScreen = () => { // Renamed from OverallProgressScreen
  const [overallCompletionRate, setOverallCompletionRate] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [activeStreaks, setActiveStreaks] = useState(0);
  const [overallTrendChartData, setOverallTrendChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [habitPerformanceChartData, setHabitPerformanceChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    const today = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'allTime':
      default:
        // Set start date to the earliest habit creation date or a default far past date
        const earliestHabitDate = ALL_HABITS_DATA_SIMULATED.reduce((minDate, habit) => {
          return habit.creationDate < minDate ? habit.creationDate : minDate;
        }, new Date());
        startDate = earliestHabitDate;
        endDate = today;
        break;
    }

    setOverallCompletionRate(calculateOverallCompletionRate(ALL_HABITS_DATA_SIMULATED, ALL_COMPLETIONS_DATA_SIMULATED, startDate, endDate));
    setTotalHabits(ALL_HABITS_DATA_SIMULATED.length);

    // Calculate active streaks dynamically
    const activeStreakCount = ALL_HABITS_DATA_SIMULATED.filter(habit => {
      const streak = calculateStreak(habit.id, ALL_COMPLETIONS_DATA_SIMULATED, ALL_HABITS_DATA_SIMULATED);
      return streak > 0;
    }).length;
    setActiveStreaks(activeStreakCount);


    // Overall Trend Chart (e.g., last 30 days daily completions)
    const thirtyDaysAgo = subDays(today, 29);
    const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const dailyCompletionCounts = last30Days.map(day => {
      return ALL_COMPLETIONS_DATA_SIMULATED.filter(comp => isSameDay(comp.completedAt, day)).length;
    });

    setOverallTrendChartData({
      labels: last30Days.map(day => format(day, 'MMM d')),
      datasets: [{ data: dailyCompletionCounts }],
    });

    // Habit Performance Bar Chart (completion rate for each habit in selected period)
    const habitPerformanceLabels = ALL_HABITS_DATA_SIMULATED.map(h => h.name);
    const habitPerformanceData = ALL_HABITS_DATA_SIMULATED.map(habit =>
      calculateCompletionRate(habit.id, ALL_COMPLETIONS_DATA_SIMULATED, habit, startDate, endDate) * 100
    );

    setHabitPerformanceChartData({
      labels: habitPerformanceLabels,
      datasets: [{ data: habitPerformanceData }],
    });

  }, [selectedPeriod, ALL_COMPLETIONS_DATA_SIMULATED]); // Re-run when period or simulated completions change

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
      <Text className="text-3xl font-bold text-gray-800 mb-2">Your Habit Journey</Text>
      <Text className="text-sm text-gray-500 mb-6">A bird's eye view of your progress across all habits.</Text>

      {/* Time Period Selector */}
      <View className="flex-row justify-around mb-6 bg-gray-100 rounded-xl p-1">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg ${selectedPeriod === 'week' ? 'bg-violet-500' : ''}`}
          onPress={() => setSelectedPeriod('week')}>
          <Text className={`text-center font-semibold ${selectedPeriod === 'week' ? 'text-white' : 'text-gray-600'}`}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg ${selectedPeriod === 'month' ? 'bg-violet-500' : ''}`}
          onPress={() => setSelectedPeriod('month')}>
          <Text className={`text-center font-semibold ${selectedPeriod === 'month' ? 'text-white' : 'text-gray-600'}`}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg ${selectedPeriod === 'allTime' ? 'bg-violet-500' : ''}`}
          onPress={() => setSelectedPeriod('allTime')}>
          <Text className={`text-center font-semibold ${selectedPeriod === 'allTime' ? 'text-white' : 'text-gray-600'}`}>All Time</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Summary Cards */}
      <View className="flex-row justify-around mb-6">
        <View className="items-center bg-white p-4 rounded-xl shadow-sm shadow-violet-100 flex-1 mx-1">
          <Icon name="checkmark-circle-outline" size={28} color="#7C3AED" />
          <Text className="text-xl font-bold text-gray-800 mt-2">{Math.round(overallCompletionRate * 100)}%</Text>
          <Text className="text-sm text-gray-500">Overall Rate</Text>
        </View>
        <View className="items-center bg-white p-4 rounded-xl shadow-sm shadow-violet-100 flex-1 mx-1">
          <Icon name="list-outline" size={28} color="#0EA5E9" />
          <Text className="text-xl font-bold text-gray-800 mt-2">{totalHabits}</Text>
          <Text className="text-sm text-gray-500">Total Habits</Text>
        </View>
        <View className="items-center bg-white p-4 rounded-xl shadow-sm shadow-violet-100 flex-1 mx-1">
          <Icon name="flame-outline" size={28} color="#F59E0B" />
          <Text className="text-xl font-bold text-gray-800 mt-2">{activeStreaks}</Text>
          <Text className="text-sm text-gray-500">Active Streaks</Text>
        </View>
      </View>

      {/* Overall Completion Trend Chart */}
      <View className="bg-white rounded-2xl p-4 mb-5 shadow shadow-violet-100">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Daily Completions (Last 30 Days)</Text>
        {overallTrendChartData.labels.length > 0 ? (
          <LineChart
            data={overallTrendChartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        ) : (
          <Text className="text-center text-gray-500 py-10">No data to display for the last 30 days.</Text>
        )}
      </View>

      {/* Habit Performance Bar Chart */}
      <View className="bg-white rounded-2xl p-4 mb-5 shadow shadow-violet-100">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Habit Performance (Completion Rate)</Text>
        {habitPerformanceChartData.labels.length > 0 ? (
          <BarChart
            data={habitPerformanceChartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              ...chartConfig,
              barPercentage: 0.7,
              decimalPlaces: 0,
              formatYLabel: (y) => `${y}%`,
            }}
            verticalLabelRotation={30}
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        ) : (
          <Text className="text-center text-gray-500 py-10">No habit data to display.</Text>
        )}
      </View>

    </ScrollView>
  );
};

export default ProgressScreen;
