# Zustand Stores for HabitMind

This directory contains the Zustand stores for state management in the HabitMind app, with real-time Firestore synchronization.

## 🏗️ Store Architecture

### 1. `useHabitStore` - Habit Management
Manages all habit-related state including CRUD operations and real-time updates.

**Key Features:**
- ✅ Real-time Firestore synchronization
- ✅ Habit CRUD operations (Create, Read, Update, Delete)
- ✅ Habit filtering and querying
- ✅ Automatic state updates

**Usage:**
```javascript
import { useHabitStore } from '../stores';

const HabbitsScreen = () => {
  const { 
    habits, 
    loading, 
    error, 
    fetchHabits, 
    addHabit, 
    updateHabit, 
    deleteHabit 
  } = useHabitStore();

  // Fetch habits on component mount
  useEffect(() => {
    fetchHabits();
  }, []);

  // Add new habit
  const handleAddHabit = async (habitData) => {
    try {
      await addHabit(habitData);
      // Habit automatically added to state via real-time listener
    } catch (error) {
      console.error('Failed to add habit:', error);
    }
  };

  return (
    <View>
      {loading && <ActivityIndicator />}
      {error && <Text>Error: {error}</Text>}
      {habits.map(habit => (
        <HabitItem key={habit.id} habit={habit} />
      ))}
    </View>
  );
};
```

### 2. `useUserStore` - User Profile & Stats
Manages user profile data, XP, levels, and global streaks.

**Key Features:**
- ✅ User profile management
- ✅ XP and level tracking
- ✅ Global streak calculations
- ✅ Real-time profile updates

**Usage:**
```javascript
import { useUserStore } from '../stores';

const ProfileScreen = () => {
  const { 
    profile, 
    loading, 
    getUserLevel, 
    getUserStats,
    updateProfileField 
  } = useUserStore();

  const { level, currentXP, xpToNextLevel } = getUserLevel();
  const stats = getUserStats();

  const handleUpdateName = async (newName) => {
    try {
      await updateProfileField('displayName', newName);
      // Profile automatically updated via real-time listener
    } catch (error) {
      console.error('Failed to update name:', error);
    }
  };

  return (
    <View>
      <Text>Level {level}</Text>
      <Text>XP: {currentXP} / {xpToNextLevel}</Text>
      <Text>Global Streak: {stats?.currentGlobalStreak}</Text>
    </View>
  );
};
```

### 3. `useCompletionStore` - Habit Completions
Manages habit completion tracking, streaks, and completion history.

**Key Features:**
- ✅ Completion logging and deletion
- ✅ Streak calculations
- ✅ Today's completion status
- ✅ Historical completion data

**Usage:**
```javascript
import { useCompletionStore } from '../stores';

const HabitItem = ({ habit }) => {
  const { 
    isCompletedToday, 
    logCompletion, 
    deleteCompletion,
    getCompletionStreak 
  } = useCompletionStore();

  const completed = isCompletedToday(habit.id);
  const streak = getCompletionStreak(habit.id);

  const handleToggleCompletion = async () => {
    try {
      if (completed) {
        // Delete today's completion
        const completionId = useCompletionStore.getState().todayCompletions[habit.id];
        await deleteCompletion(habit.id, completionId);
      } else {
        // Log new completion
        await logCompletion(habit.id, new Date());
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleToggleCompletion}>
      <Text>{habit.name}</Text>
      <Text>Streak: {streak}</Text>
      <Text>{completed ? '✓' : '○'}</Text>
    </TouchableOpacity>
  );
};
```

## 🪝 Utility Hooks

### `useStoreInitialization`
Automatically initializes all stores when the app starts and handles authentication state changes.

**Usage:**
```javascript
import { useStoreInitialization } from '../hooks/useStoreInitialization';

const App = () => {
  const { refreshAllData } = useStoreInitialization();

  // This hook automatically:
  // - Sets up authentication listeners
  // - Initializes real-time Firestore listeners
  // - Fetches initial data
  // - Cleans up on logout

  return <YourAppContent />;
};
```

### `useHabitsWithCompletions`
Combines habit data with today's completion status for easy rendering.

**Usage:**
```javascript
import { useHabitsWithCompletions } from '../hooks/useStoreUtils';

const HabbitsScreen = () => {
  const habitsWithCompletions = useHabitsWithCompletions();

  return (
    <FlatList
      data={habitsWithCompletions}
      renderItem={({ item }) => (
        <HabitItem 
          habit={item}
          isCompleted={item.isCompletedToday}
        />
      )}
    />
  );
};
```

### `useUserStats`
Provides computed user statistics combining data from multiple stores.

**Usage:**
```javascript
import { useUserStats } from '../hooks/useStoreUtils';

const StatsScreen = () => {
  const stats = useUserStats();

  if (!stats) return <LoadingSpinner />;

  return (
    <View>
      <Text>Level {stats.level}</Text>
      <Text>Progress: {stats.progressPercentage.toFixed(1)}%</Text>
      <Text>Today: {stats.completedToday}/{stats.activeHabits}</Text>
      <Text>Completion Rate: {stats.completionRate.toFixed(1)}%</Text>
    </View>
  );
};
```

## 🔄 Real-time Synchronization

All stores automatically sync with Firestore in real-time:

1. **Authentication Changes**: Automatically handle login/logout
2. **Data Updates**: Changes in Firestore immediately reflect in the app
3. **Offline Support**: Firestore handles offline/online synchronization
4. **Performance**: Only subscribed data is synced

## ⚠️ Error Handling

Each store includes comprehensive error handling:

```javascript
const { error, clearError } = useHabitStore();

// Display errors to users
if (error) {
  return (
    <View>
      <Text>Error: {error}</Text>
      <Button title="Clear Error" onPress={clearError} />
    </View>
  );
}
```

## 🚀 Best Practices

1. **Use Selectors**: Only subscribe to the state you need
   ```javascript
   // Good - only subscribes to habits array
   const habits = useHabitStore(state => state.habits);
   
   // Avoid - subscribes to entire state
   const store = useHabitStore();
   ```

2. **Handle Loading States**: Always show loading indicators
   ```javascript
   const { loading, habits } = useHabitStore();
   
   if (loading) return <ActivityIndicator />;
   ```

3. **Error Boundaries**: Implement error boundaries for store errors
4. **Cleanup**: Stores automatically clean up listeners on unmount
5. **Optimistic Updates**: Consider optimistic updates for better UX

## 🔄 Migration from Existing Code

To migrate your existing screens:

1. Replace `useState` with store selectors
2. Replace manual Firestore calls with store actions
3. Remove manual data fetching in `useEffect`
4. Use utility hooks for combined data

**Before:**
```javascript
const [habits, setHabits] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchHabits();
}, []);

const fetchHabits = async () => {
  // Manual Firestore calls
};
```

**After:**
```javascript
const { habits, loading, fetchHabits } = useHabitStore();

useEffect(() => {
  fetchHabits();
}, []);
```

## 📱 Integration with App.js

To use the stores in your main App component:

```javascript
import React from 'react';
import { useStoreInitialization } from './src/hooks/useStoreInitialization';
import AppNavigator from './AppNavigator';

const App = () => {
  // Initialize all stores
  useStoreInitialization();

  return <AppNavigator />;
};

export default App;
```

## 🎯 Key Benefits

- **Real-time Updates**: Data automatically syncs across all components
- **Centralized State**: Single source of truth for all app data
- **Performance**: Only re-renders components when their data changes
- **Offline Support**: Built-in offline/online synchronization
- **Type Safety**: Easy to add TypeScript for better development experience
- **Testing**: Simple to test with Jest and React Testing Library

The stores handle all the complexity of state management, real-time updates, and error handling automatically! 🎉



