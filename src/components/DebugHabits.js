import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useHabitStore } from '../stores';

const DebugHabits = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const habits = useHabitStore((state) => state.habits);
  const loading = useHabitStore((state) => state.loading);
  const error = useHabitStore((state) => state.error);
  const lastUpdated = useHabitStore((state) => state.lastUpdated);

  useEffect(() => {
    setDebugInfo({
      habitsCount: habits.length,
      loading,
      error,
      lastUpdated: lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never',
      habitIds: habits.map(h => h.id),
    });
  }, [habits, loading, error, lastUpdated]);

  const showDebugInfo = () => {
    Alert.alert(
      'Debug Info',
      `Habits: ${debugInfo.habitsCount}\n` +
      `Loading: ${debugInfo.loading}\n` +
      `Error: ${debugInfo.error || 'None'}\n` +
      `Last Updated: ${debugInfo.lastUpdated}\n` +
      `Habit IDs: ${debugInfo.habitIds.join(', ')}`
    );
  };

  return (
    <View style={{ 
      position: 'absolute', 
      top: 50, 
      right: 10, 
      backgroundColor: 'rgba(0,0,0,0.7)', 
      padding: 5, 
      borderRadius: 5 
    }}>
      <TouchableOpacity onPress={showDebugInfo}>
        <Text style={{ color: 'white', fontSize: 12 }}>
          Habits: {debugInfo.habitsCount}
        </Text>
        {debugInfo.error && (
          <Text style={{ color: 'red', fontSize: 10 }}>
            Error: {debugInfo.error}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default DebugHabits;
