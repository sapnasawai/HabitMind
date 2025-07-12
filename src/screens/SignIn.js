import {getAuth, signInWithPhoneNumber} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SignInScreen = () => {
  const [confirm, setConfirm] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  async function handleSignInWithPhoneNumber(phoneNumber) {
    const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
    setConfirm(confirmation);
  }

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      console.log('response', response);
      if (isSuccessResponse(response)) {
        setUserInfo(response.data);
        console.log('response.data---', response.data);
      } else {
        // sign in was cancelled by user
      }
    } catch (error) {
      console.log('error', error);
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            break;
          default:
          // some other error happened
        }
      } else {
        // an error that's not related to google sign in occurred
      }
    }
  };
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
        <TouchableOpacity
          className="bg-violet-400 flex-row items-center justify-center py-3 rounded-xl mb-3"
          onPress={() => signIn()}>
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

        {/* Phone Sign-In--> Kept on hold */}
        <TouchableOpacity
          className="bg-gray-100 flex-row items-center justify-center py-3 rounded-xl"
          onPress={() => handleSignInWithPhoneNumber('+1 650-555-3434')}>
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
