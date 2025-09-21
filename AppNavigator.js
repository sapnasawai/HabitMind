import React from 'react';
import AddHabitScreen from './src/screens/AddHabitScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HabbitsScreen from './src/screens/HabbitsScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationTestScreen from './src/screens/NotificationTestScreen';
import FirebaseMessagingTestScreen from './src/screens/FirebaseMessagingTestScreen';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator - Main app navigation
function BottomTabNavigator({user}) {
  return (
    <Tab.Navigator
      initialRouteName="Habits" // Set Habits as the initial/first screen
      screenOptions={({route}) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFF',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#7C3AED',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarStyle: {
          position: 'absolute',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          switch (route.name) {
            case 'Habits':
              iconName = focused ? 'list-circle' : 'list-circle-outline';
              break;
            case 'Progress':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size || 24} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Habits"
        component={HabbitsScreen}
        options={{
          title: "Today's Habits",
          tabBarLabel: 'Habits',
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Overall Progress',
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}>
        {props => <ProfileScreen {...props} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main App Navigator
const AppNavigator = ({user}) => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFF',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#7C3AED',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        cardStyle: {backgroundColor: '#F9FAFB'},
      }}>
      {/* Main Tab Navigator - This is the home screen */}
      <Stack.Screen
        name="MainTabs"
        options={{
          headerShown: false, // Hide header for tab navigator
        }}>
        {props => <BottomTabNavigator {...props} user={user} />}
      </Stack.Screen>

      {/* Modal/Overlay Screens */}
      <Stack.Screen
        name="AddHabit"
        component={AddHabitScreen}
        options={{
          title: 'Add New Habit',
          presentation: 'modal', // Makes it feel like a modal
          headerLeft: () => null, // Remove back button, use custom close
        }}
      />
      
      <Stack.Screen
        name="HabitDetail"
        component={HabitDetailScreen}
        options={({route}) => ({
          title: 'Habit Details',
          presentation: 'card', // Standard card presentation
        })}
      />
      
      <Stack.Screen
        name="NotificationTest"
        component={NotificationTestScreen}
        options={{
          title: 'Notification Test',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen
        name="FirebaseMessagingTest"
        component={FirebaseMessagingTestScreen}
        options={{
          title: 'Firebase Messaging Test',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
