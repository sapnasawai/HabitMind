import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHabitStore, useUserStore, useProgressStore } from '../stores';
import Svg, { Rect, Circle, Line, Text as SvgText, G } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

const ProgressScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
  const [selectedHabit, setSelectedHabit] = useState(null);

  // Store data
  const habits = useHabitStore(state => state.habits);
  const completions = useHabitStore(state => state.completions);
  const userProfile = useUserStore(state => state.profile);
  const loading = useHabitStore(state => state.loading);
  const getUserProgress = useProgressStore(state => state.getUserProgress);
  const getHabitStats = useProgressStore(state => state.getHabitStats);

  // Calculate progress data
  const progressData = getUserProgress(habits, completions, userProfile);
  const habitStats = habits.map(habit => ({
    ...habit,
    ...getHabitStats(habit.id, completions)
  }));

  // Sort habits by performance
  const bestHabits = [...habitStats].sort((a, b) => b.completionRate - a.completionRate);
  const worstHabits = [...habitStats].sort((a, b) => a.completionRate - b.completionRate);

  // Calculate weekly data
  const getWeeklyData = () => {
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayCompletions = habits.filter(habit => {
        const habitCompletions = completions[habit.id] || [];
        return habitCompletions.some(completion => {
          const completionDate = completion.date.toDate ? completion.date.toDate() : completion.date;
          return completionDate.toDateString() === date.toDateString();
        });
      }).length;
      
      weekData.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        date: date.getDate(),
        completions: dayCompletions,
        total: habits.length
      });
    }
    
    return weekData;
  };

  // Calculate monthly data
  const getMonthlyData = () => {
    const today = new Date();
    const monthData = [];
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), i);
      
      const dayCompletions = habits.filter(habit => {
        const habitCompletions = completions[habit.id] || [];
        return habitCompletions.some(completion => {
          const completionDate = completion.date.toDate ? completion.date.toDate() : completion.date;
          return completionDate.toDateString() === date.toDateString();
        });
      }).length;
      
      monthData.push({
        day: i,
        completions: dayCompletions,
        total: habits.length,
        isToday: i === today.getDate()
      });
    }
    
    return monthData;
  };

  // Calculate yearly data
  const getYearlyData = () => {
    const today = new Date();
    const yearData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(today.getFullYear(), i, 1);
      const monthEnd = new Date(today.getFullYear(), i + 1, 0);
      const daysInMonth = monthEnd.getDate();
      
      let totalCompletions = 0;
      let totalPossible = habits.length * daysInMonth;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(today.getFullYear(), i, day);
        const dayCompletions = habits.filter(habit => {
          const habitCompletions = completions[habit.id] || [];
          return habitCompletions.some(completion => {
            const completionDate = completion.date.toDate ? completion.date.toDate() : completion.date;
            return completionDate.toDateString() === date.toDateString();
          });
        }).length;
        totalCompletions += dayCompletions;
      }
      
      yearData.push({
        month: monthNames[i],
        completions: totalCompletions,
        total: totalPossible,
        completionRate: totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0
      });
    }
    
    return yearData;
  };

  // Simple Bar Chart Component
  const BarChart = ({ data, maxValue, height = 120 }) => {
    const chartWidth = screenWidth - 60;
    const barWidth = chartWidth / data.length - 4;
    
    return (
      <View style={{ height, marginVertical: 10 }}>
        <Svg width={chartWidth} height={height}>
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.completions / maxValue) * (height - 30) : 0;
            const x = index * (barWidth + 4);
            const y = height - 30 - barHeight;
            
            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#7C3AED"
                  rx={2}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 5}
                  fontSize="10"
                  fill="#666"
                  textAnchor="middle"
                >
                  {item.day || item.date || item.month}
                </SvgText>
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="10"
                  fill="#7C3AED"
                  textAnchor="middle"
                >
                  {item.completions}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Heatmap Component
  const Heatmap = ({ data, title }) => {
    const cellSize = 12;
    const cellSpacing = 2;
    const cols = 7;
    const rows = Math.ceil(data.length / cols);
    const width = cols * (cellSize + cellSpacing);
    const height = rows * (cellSize + cellSpacing);
    
    const getIntensity = (completions, total) => {
      if (total === 0) return 0;
      const ratio = completions / total;
      if (ratio === 0) return 0;
      if (ratio < 0.25) return 1;
      if (ratio < 0.5) return 2;
      if (ratio < 0.75) return 3;
      return 4;
    };
    
    const getColor = (intensity) => {
      const colors = ['#f3f4f6', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'];
      return colors[intensity] || colors[0];
    };
    
    return (
      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="text-lg font-bold text-gray-800 mb-3">{title}</Text>
        <Svg width={width} height={height}>
          {data.map((item, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = col * (cellSize + cellSpacing);
            const y = row * (cellSize + cellSpacing);
            const intensity = getIntensity(item.completions, item.total);
            
            return (
              <Rect
                key={index}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill={getColor(intensity)}
                rx={2}
              />
            );
          })}
        </Svg>
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-gray-500">Less</Text>
          <View className="flex-row space-x-1">
            {[0, 1, 2, 3, 4].map(level => (
              <View
                key={level}
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getColor(level) }}
              />
            ))}
          </View>
          <Text className="text-xs text-gray-500">More</Text>
        </View>
      </View>
    );
  };

  // XP Progress Component
  const XPProgress = () => {
    const currentXP = userProfile?.totalXP || 0;
    const currentLevel = userProfile?.level || 1;
    const xpForCurrentLevel = (currentLevel - 1) * 500;
    const xpForNextLevel = currentLevel * 500;
    const progress = ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    
  return (
      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="text-lg font-bold text-gray-800 mb-3">XP Progress</Text>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-violet-600">Level {currentLevel}</Text>
          <Text className="text-sm text-gray-600">{currentXP} XP</Text>
        </View>
        <View className="bg-gray-200 rounded-full h-3 mb-2">
          <View 
            className="bg-violet-500 rounded-full h-3"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
        <Text className="text-xs text-gray-600 text-center">
          {Math.round(progress)}% to Level {currentLevel + 1}
        </Text>
      </View>
    );
  };

  // Statistics Card Component
  const StatCard = ({ title, value, subtitle, icon, color = "#7C3AED" }) => (
    <View className="bg-white rounded-xl p-4 mb-3 flex-1 mx-1">
      <View className="flex-row items-center mb-2">
        <Icon name={icon} size={20} color={color} />
        <Text className="text-sm font-semibold text-gray-600 ml-2">{title}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-800">{value}</Text>
      {subtitle && <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>}
    </View>
  );

  // Habit Performance Item
  const HabitPerformanceItem = ({ habit, rank, isBest = true }) => (
    <View className="bg-white rounded-lg p-3 mb-2 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="w-8 h-8 bg-violet-100 rounded-full items-center justify-center mr-3">
          <Text className="text-violet-600 font-bold text-sm">#{rank}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-800">{habit.name}</Text>
          <Text className="text-sm text-gray-500">{habit.completionRate}% completion rate</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-lg font-bold text-violet-600">{habit.currentStreak || 0}</Text>
        <Text className="text-xs text-gray-500">streak</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="mt-4 text-gray-600">Loading progress data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const yearlyData = getYearlyData();
  const maxWeeklyCompletions = Math.max(...weeklyData.map(d => d.completions), 1);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Progress Overview</Text>
          <Text className="text-gray-600">Track your habit journey and see your growth</Text>
        </View>

        {/* Period Selector */}
        <View className="px-6 mb-4">
          <View className="bg-white rounded-xl p-1 flex-row">
            {['week', 'month', 'year'].map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  selectedPeriod === period ? 'bg-violet-500' : 'bg-transparent'
                }`}
              >
                <Text className={`text-center font-semibold capitalize ${
                  selectedPeriod === period ? 'text-white' : 'text-gray-600'
                }`}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statistics Overview */}
        <View className="px-6 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Statistics Overview</Text>
          <View className="flex-row">
            <StatCard
              title="Total Habits"
              value={progressData.totalHabits}
              icon="list-outline"
              color="#7C3AED"
            />
            <StatCard
              title="Completed Today"
              value={progressData.completedToday}
              subtitle={`of ${progressData.totalHabits}`}
              icon="checkmark-circle-outline"
              color="#10B981"
            />
          </View>
          <View className="flex-row">
            <StatCard
              title="Completion Rate"
              value={`${progressData.monthlyCompletionRate}%`}
              subtitle="this month"
              icon="trending-up-outline"
              color="#F59E0B"
            />
            <StatCard
              title="Avg Streak"
              value={progressData.averageStreak}
              subtitle="days"
              icon="flame-outline"
              color="#EF4444"
            />
          </View>
        </View>

        {/* XP Progress */}
        <View className="px-6 mb-4">
          <XPProgress />
        </View>

        {/* Weekly Chart */}
        {selectedPeriod === 'week' && (
          <View className="px-6 mb-4">
            <View className="bg-white rounded-xl p-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Weekly Completion</Text>
              <BarChart data={weeklyData} maxValue={maxWeeklyCompletions} />
            </View>
          </View>
        )}

        {/* Monthly Chart */}
        {selectedPeriod === 'month' && (
          <View className="px-6 mb-4">
            <View className="bg-white rounded-xl p-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Monthly Completion</Text>
              <BarChart data={monthlyData} maxValue={maxWeeklyCompletions} />
            </View>
          </View>
        )}

        {/* Yearly Chart */}
        {selectedPeriod === 'year' && (
          <View className="px-6 mb-4">
            <View className="bg-white rounded-xl p-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Yearly Completion</Text>
              <BarChart data={yearlyData} maxValue={Math.max(...yearlyData.map(d => d.completions), 1)} />
            </View>
          </View>
        )}

        {/* Streak Heatmap */}
        <View className="px-6 mb-4">
          <Heatmap data={monthlyData} title="Streak Heatmap" />
        </View>

        {/* Best Performing Habits */}
        <View className="px-6 mb-4">
          <View className="bg-white rounded-xl p-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">Best Performing Habits</Text>
            {bestHabits.slice(0, 3).map((habit, index) => (
              <HabitPerformanceItem
                key={habit.id}
                habit={habit}
                rank={index + 1}
                isBest={true}
              />
            ))}
          </View>
        </View>

        {/* Improvement Areas */}
        <View className="px-6 mb-4">
          <View className="bg-white rounded-xl p-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">Areas for Improvement</Text>
            {worstHabits.slice(0, 3).map((habit, index) => (
              <HabitPerformanceItem
                key={habit.id}
                habit={habit}
                rank={index + 1}
                isBest={false}
              />
            ))}
          </View>
        </View>

        {/* Global Streak */}
        <View className="px-6 mb-4">
          <View className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-lg font-bold">Global Streak</Text>
                <Text className="text-violet-100 text-sm">Your longest streak across all habits</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-3xl font-bold">{progressData.globalStreak}</Text>
                <Text className="text-violet-100 text-sm">days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Achievement Summary */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-xl p-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">Achievement Summary</Text>
            <View className="flex-row justify-between items-center mb-3">
              <View className="items-center">
                <Icon name="trophy" size={24} color="#F59E0B" />
                <Text className="text-sm font-semibold text-gray-600 mt-1">Level</Text>
                <Text className="text-xl font-bold text-gray-800">{progressData.level}</Text>
              </View>
              <View className="items-center">
                <Icon name="star" size={24} color="#7C3AED" />
                <Text className="text-sm font-semibold text-gray-600 mt-1">Total XP</Text>
                <Text className="text-xl font-bold text-gray-800">{progressData.totalXP}</Text>
              </View>
              <View className="items-center">
                <Icon name="flame" size={24} color="#EF4444" />
                <Text className="text-sm font-semibold text-gray-600 mt-1">Best Streak</Text>
                <Text className="text-xl font-bold text-gray-800">{progressData.bestGlobalStreak}</Text>
              </View>
            </View>
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-sm text-gray-600 text-center">
                Keep up the great work! You're building amazing habits! 🎉
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProgressScreen;
