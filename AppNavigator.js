import React from 'react';
import AddHabitScreen from './src/screens/AddHabitScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HabbitsScreen from './src/screens/HabbitsScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabRootStack({user}) {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFF', // White header background
        },
        headerTintColor: '#7C3AED', // Violet color for back button and title
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          position: 'absolute',
          height: 60,
        },

        tabBarActiveTintColor: '#7C3AED', // violet-600
        tabBarInactiveTintColor: '#A1A1AA', // gray-400
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Habbits') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Habbits"
        component={HabbitsScreen}
        options={{title: "Today's Habits"}}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{title: 'Overall Progress'}}
      />
      <Tab.Screen
        name="Profile"
        component={props => <ProfileScreen {...props} user={user} />}
        options={{title: 'Profile'}}
      />
    </Tab.Navigator>
  );
}
const AppNavigator = ({user}) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFF',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Tabs"
        options={{
          headerShown: false,
          contentStyle: {backgroundColor: 'white'},
        }}
        component={props => <BottomTabRootStack {...props} user={user} />}
      />
      <Stack.Screen
        name="AddHabit"
        component={AddHabitScreen}
        options={{title: 'Add New Habit'}}
      />
      <Stack.Screen
        name="HabitDetail"
        component={HabitDetailScreen}
        options={({route}) => ({
          title: route.params?.habitName || 'Habit Details',
        })}
      />
      <Stack.Screen
        name="Habbits"
        component={HabbitsScreen}
        options={{title: "Today's Habits"}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
