import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth'; // Import Firebase Auth
import Ionicons from 'react-native-vector-icons/Ionicons'; // For icons
import { useNavigation } from '@react-navigation/native'; // If you need to navigate back or to other profile settings

const ProfileScreen = () => {
  const navigation = useNavigation();
  const currentUser = auth().currentUser; // Get the currently signed-in user

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      // The onAuthStateChanged listener in App.js will detect the sign-out
      // and automatically navigate the user back to the AuthScreen.
      console.log('User signed out successfully!');
      // You might want to show a toast message here
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Sign Out Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header - consistent with other screens */}
      <View className="flex-row items-center justify-center px-4 py-4 border-b border-gray-200 bg-white shadow-sm">
        {/* No back button needed if this is a bottom tab screen */}
        <Text className="text-xl font-semibold text-gray-800">Account</Text>
      </View>

      <View className="flex-1 items-center px-6 py-8">
        {/* User Icon */}
        <View className="bg-violet-100 p-6 rounded-full mb-6">
          <Ionicons name="person-outline" size={60} color="#7C3AED" />
        </View>

        {/* User Info */}
        {currentUser ? (
          <>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {currentUser.displayName || 'HabitMind User'}
            </Text>
            <Text className="text-base text-gray-600 mb-8">
              {currentUser.email || 'No email provided'}
            </Text>
          </>
        ) : (
          <Text className="text-base text-gray-600 mb-8">Not signed in.</Text>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity
          className="bg-red-500 py-4 px-8 rounded-lg shadow-md w-full max-w-xs"
          onPress={handleSignOut}
        >
          <Text className="text-center text-white font-semibold text-lg">
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Optional: Add more profile settings here */}
        {/* <TouchableOpacity
          className="mt-6 py-3 px-8 rounded-lg border border-gray-200 w-full max-w-xs"
          onPress={() => console.log('Edit Profile')}
        >
          <Text className="text-center text-gray-700 font-semibold text-base">
            Edit Profile
          </Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;