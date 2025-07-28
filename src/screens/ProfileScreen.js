import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Make sure you have react-native-vector-icons installed
import auth from '@react-native-firebase/auth'; // Import Firebase Auth

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the currently logged-in user when the component mounts
    const user = auth().currentUser;
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await auth().signOut();
              // Navigation will be handled by the onAuthStateChanged listener in App.js
              // which will redirect to AuthNavigator/SignInSignUpScreen
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Sign Out Failed', 'Could not sign out. Please try again.');
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  // If no user is logged in (should ideally be caught by App.js auth flow)
  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Ionicons name="person-circle-outline" size={80} color="#EF4444" />
        <Text className="text-xl font-semibold text-red-500 mt-4 text-center">
          No user is currently signed in.
        </Text>
        <TouchableOpacity
          className="mt-8 bg-violet-500 py-3 px-6 rounded-lg shadow-md"
          onPress={() => navigation.navigate('SignInSignUp')}>
          <Text className="text-white font-semibold text-lg">Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Display the profile information
  return (
    <View className="flex-1 bg-gray-50 p-6 items-center">
      <View className="bg-white rounded-xl p-8 shadow-md w-full max-w-md items-center mt-10">
        {/* User Icon/Avatar */}
        <View className="w-24 h-24 rounded-full bg-violet-100 justify-center items-center mb-6 border-4 border-violet-300">
          <Ionicons name="person-outline" size={70} color="#7C3AED" />
        </View>

        {/* Display Name */}
        <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">
          {currentUser.displayName || 'User Name Not Set'}
        </Text>

        {/* Email */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="mail-outline" size={20} color="#6B7280" />
          <Text className="text-lg text-gray-600 ml-2">{currentUser.email}</Text>
        </View>

        {/* Email Verification Status */}
        <View className="flex-row items-center mb-6">
          <Ionicons
            name={currentUser.emailVerified ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={currentUser.emailVerified ? '#10B981' : '#EF4444'} // Green for verified, Red for unverified
          />
          <Text
            className={`text-base font-semibold ml-2 ${
              currentUser.emailVerified ? 'text-green-600' : 'text-red-600'
            }`}>
            {currentUser.emailVerified ? 'Email Verified' : 'Email Not Verified'}
          </Text>
        </View>

        {/* Other Profile Info (Optional) */}
        {/* You can add more details like phoneNumber, creationTime, etc. */}
        <View className="w-full border-t border-gray-200 pt-6 mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Account Details:</Text>
          <View className="flex-row items-center mb-1">
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2">
              Joined: {new Date(currentUser.metadata.creationTime).toLocaleDateString()}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="log-in-outline" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2">
              Last Sign In: {new Date(currentUser.metadata.lastSignInTime).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        className="bg-red-500 py-4 px-8 rounded-lg shadow-md mt-10 w-full max-w-sm flex-row items-center justify-center"
        onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color="#fff" style={{marginRight: 8}} />
        <Text className="text-white font-semibold text-lg">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // You can put any specific styles here if Tailwind doesn't cover everything
  // For example, if you need custom shadow properties or very specific positioning
});

export default ProfileScreen;