
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';

// Get the current authenticated user's ID
export const getCurrentUserId = () => {
  const currentUser = auth().currentUser;
  return currentUser ? currentUser.uid : null;
};



export const IconComponents = {
  Ionicons: Ionicons,
  MaterialCommunityIcons: MaterialCommunityIcons,
  FontAwesome: FontAwesome,
  // Add other icon families here as needed
};
export const ICON_OPTIONS = [
  // Ionicons
  { name: 'walk-outline', label: 'Walk', family: 'Ionicons' },
  { name: 'book-outline', label: 'Read', family: 'Ionicons' },
  { name: 'water-outline', label: 'Drink Water', family: 'Ionicons' },
  { name: 'fitness-outline', label: 'Exercise', family: 'Ionicons' },
  { name: 'moon-outline', label: 'Sleep', family: 'Ionicons' },
  { name: 'code-outline', label: 'Code', family: 'Ionicons' },
  { name: 'brush-outline', label: 'Creative', family: 'Ionicons' },
  { name: 'bulb-outline', label: 'Learn', family: 'Ionicons' },
  { name: 'chatbubbles-outline', label: 'Social', family: 'Ionicons' },
  { name: 'calendar-outline', label: 'Plan', family: 'Ionicons' },
  { name: 'document-text-outline', label: 'Journal', family: 'Ionicons' },
  { name: 'leaf-outline', label: 'Nature', family: 'Ionicons' },
  { name: 'sparkles-outline', label: 'Self-Care', family: 'Ionicons' },
  { name: 'game-controller-outline', label: 'Play', family: 'Ionicons' },
  { name: 'fast-food-outline', label: 'Cook', family: 'Ionicons' },
  { name: 'bed-outline', label: 'Rest', family: 'Ionicons' },
  { name: 'wallet-outline', label: 'Finance', family: 'Ionicons' },
  { name: 'home-outline', label: 'Home Chores', family: 'Ionicons' },
  // MaterialCommunityIcons
  { name: 'meditation', label: 'Meditate', family: 'MaterialCommunityIcons' },
  { name: 'food-apple-outline', label: 'Healthy Eating', family: 'MaterialCommunityIcons' },
  { name: 'run', label: 'Run', family: 'MaterialCommunityIcons' },
  { name: 'weight-lifter', label: 'Weightlifting', family: 'MaterialCommunityIcons' },
  { name: 'laptop', label: 'Work', family: 'MaterialCommunityIcons' },
  // FontAwesome
  { name: 'smile-o', label: 'Happiness', family: 'FontAwesome' },
  { name: 'heartbeat', label: 'Heart Health', family: 'FontAwesome' },
  { name: 'money', label: 'Budget', family: 'FontAwesome' },
  { name: 'coffee', label: 'Coffee Break', family: 'FontAwesome' },
];