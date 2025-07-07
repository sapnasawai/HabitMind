import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SignInScreen = () => {
  return (
    <View className="flex-1 bg-gray-50 justify-center items-center px-6">
      <View className="bg-white rounded-2xl shadow-md w-full max-w-md p-6">
        {/* Title */}
        <Text className="text-center text-2xl font-bold text-gray-900 mb-1">
          Get Started
        </Text>
        <Text className="text-center text-gray-500 mb-6">
          Sign in to continue to HabitMind.
        </Text>

        {/* Google Sign-In */}
        <TouchableOpacity className="bg-violet-400 flex-row items-center justify-center py-3 rounded-xl mb-3">
          <Icon name="logo-google" size={18} color="white" className="mr-2" />
          <Text className="text-white font-semibold text-base">
            Sign in with Google
          </Text>
        </TouchableOpacity>

        {/* Apple Sign-In */}
        <TouchableOpacity className="bg-violet-400 flex-row items-center justify-center py-3 rounded-xl mb-3">
          <Icon name="logo-apple" size={18} color="white" className="mr-2" />
          <Text className="text-white font-semibold text-base">
            Sign in with Apple
          </Text>
        </TouchableOpacity>

        {/* Phone Sign-In */}
        <TouchableOpacity className="bg-gray-100 flex-row items-center justify-center py-3 rounded-xl">
          <Icon
            name="call-outline"
            size={18}
            color="#9CA3AF"
            className="mr-2"
          />
          <Text className="text-gray-400 font-semibold text-base">
            Sign in with Phone
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignInScreen;
