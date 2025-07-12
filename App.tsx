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
import Ionicons from 'react-native-vector-icons/Ionicons';
import SignInScreen from './src/screens/SignIn';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabRootStack() {
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '687916973600-s7jq5qrg94fp62jp3ajraesr5vchvm53.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarStyle: {
          position: 'absolute',
          height: 60,
        },
        tabBarActiveTintColor: '#7C3AED', // violet-600
        tabBarInactiveTintColor: '#A1A1AA', // gray-400
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Habbits') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'Sign In') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}>
      <Tab.Screen name="Habbits" component={HabbitsScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Sign In" component={SignInScreen} />
      {/* <Tab.Screen name="Profile" component={ProfileScreen} /> */}
    </Tab.Navigator>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen
            name="Tabs"
            options={{contentStyle: {backgroundColor: 'white'}}}
            component={BottomTabRootStack}
          />
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
