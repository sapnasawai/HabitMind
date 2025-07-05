import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProfileScreen from './src/screens/ProfileScreen';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import ProgressScreen from './src/screens/ProgressScreen';
import HabbitsScreen from './src/screens/HabbitsScreen';
import './global.css';
import AddHabitModal from './src/screens/AddHabitModal';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="Habbits"
      screenOptions={{
        headerStyle: {backgroundColor: 'tomato'},
      }}>
      <Stack.Screen name="AddHabit" component={AddHabitModal} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function BottomTabRootStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {position: 'absolute'},
      }}>
      <Tab.Screen name="Habbits" component={HabbitsScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Tabs" component={BottomTabRootStack} />
          <Stack.Screen
            name="AddHabit"
            component={AddHabitModal}
            options={{presentation: 'modal'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
