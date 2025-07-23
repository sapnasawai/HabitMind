// src/navigation/AuthNavigator.js (Create this file)

import * as React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SignInSignUpScreen from './src/screens/SignInSignUpScreen';

const AuthStack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false, // Typically hide headers for auth screens for full control
      }}>
      <AuthStack.Screen name="SignInSignUp" component={SignInSignUpScreen} />
      {/* Add a ForgotPasswordScreen if you create one */}
      {/* <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;