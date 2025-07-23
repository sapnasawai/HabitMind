import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

const SignInSignUpScreen = () => {
  const navigation = useNavigation();
  const [isSignInMode, setIsSignInMode] = useState(true); // Toggle between Sign In and Sign Up
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null); // To store the authenticated user

  // Effect to listen for authentication state changes
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(userState => {
      setUser(userState);
      // If a user is signed in and their email is verified, navigate away from this screen.
      // You might want to navigate to a home screen or dashboard.
      if (userState && userState.emailVerified) {
        console.log('User is signed in and email verified:', userState.email);
        // Example: Navigate to 'HomeScreen' if you have one defined in your navigator
        // navigation.replace('HomeScreen');
      } else if (userState && !userState.emailVerified && !isSignInMode) {
        // If a user just signed up and email is not verified, keep them on this screen
        // or guide them to check their email.
        console.log('User signed up but email not verified:', userState.email);
      }
    });
    return subscriber; // Unsubscribe on unmount
  }, [isSignInMode, navigation]);

  const handleAuth = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      if (isSignInMode) {
        // --- Sign In Logic ---
        const userCredential = await auth().signInWithEmailAndPassword(
          email,
          password,
        );
        const currentUser = userCredential.user;

        if (currentUser && !currentUser.emailVerified) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email address to continue. A verification email might have been sent to your inbox.',
            [
              {
                text: 'Resend Email',
                onPress: () => sendVerificationEmail(currentUser),
              },
              {
                text: 'OK',
                style: 'cancel',
              },
            ],
          );
          // If email is not verified, sign them out to prevent access to protected routes
          // until verification. You might adjust this based on your app's flow.
          await auth().signOut();
        } else if (currentUser && currentUser.emailVerified) {
          Alert.alert('Success', 'Signed in successfully!');
          // Navigation will be handled by the onAuthStateChanged listener in App.js
          // Or you can navigate directly here if you prefer immediate navigation
          // navigation.replace('HomeScreen');
        }
      } else {
        // --- Sign Up Logic ---
        if (!name.trim()) {
          setErrorMessage('Please enter your name.');
          setLoading(false);
          return;
        }
        const userCredential = await auth().createUserWithEmailAndPassword(
          email,
          password,
        );
        const newUser = userCredential.user;

        // Update display name
        await newUser.updateProfile({
          displayName: name.trim(),
        });

        // Send email verification
        await sendVerificationEmail(newUser);

        Alert.alert(
          'Account Created & Verification Sent',
          'Your account has been created! A verification email has been sent to your email address. Please check your inbox (and spam folder) to verify your account. You will be signed out momentarily to allow verification.',
        );

        // Sign out the user immediately after sign-up to force email verification
        // before they can sign in and access the app.
        await auth().signOut();
        setIsSignInMode(true); // Switch to sign-in mode after successful sign-up
      }
    } catch (error) {
      console.error('Authentication error:', error);
      let userFacingMessage = 'An unexpected error occurred. Please try again.';

      // More user-friendly error messages based on Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        userFacingMessage = 'That email address is already in use!';
      } else if (error.code === 'auth/invalid-email') {
        userFacingMessage = 'That email address is invalid!';
      } else if (error.code === 'auth/weak-password') {
        userFacingMessage = 'Password should be at least 6 characters.';
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        userFacingMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/network-request-failed') {
        userFacingMessage =
          'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/operation-not-allowed') {
        userFacingMessage = 'Email/password authentication is not enabled.';
      }

      setErrorMessage(userFacingMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async userToSend => {
    if (userToSend) {
      try {
        await userToSend.sendEmailVerification();
        Alert.alert(
          'Verification Email Sent',
          'A verification email has been sent to your email address. Please check your inbox (and spam folder) to verify your account.',
        );
        console.log('Verification email sent to:', userToSend.email);
      } catch (error) {
        console.error('Error sending verification email:', error);
        let errorMessageText =
          'Failed to send verification email. Please try again.';
        if (error.code === 'auth/too-many-requests') {
          errorMessageText =
            'Too many requests to send verification email. Please wait a moment before trying again.';
        }
        Alert.alert('Error', errorMessageText);
      }
    } else {
      Alert.alert('Error', 'No user found to send verification email.');
    }
  };

  const signOutUser = async () => {
    try {
      await auth().signOut();
      setUser(null); // Clear the user state
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  // Render separate UIs based on isSignInMode
  const renderSignInForm = () => (
    <View className="bg-white rounded-xl p-6 shadow-md w-full max-w-md mx-auto">
      <Text className="text-3xl font-bold text-center mb-2 text-gray-800">
        Sign In to Habitamind
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-6">
        Welcome back! Sign in to continue building your habits.
      </Text>

      {errorMessage ? (
        <Text className="text-center text-red-500 mb-4">{errorMessage}</Text>
      ) : null}

      <Text className="text-sm font-medium mb-1 text-gray-700">
        Email Address
      </Text>
      <TextInput
        placeholder="your.email@example.com"
        placeholderTextColor="#A0AEC0"
        className="border border-purple-400 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text className="text-sm font-medium mb-1 text-gray-700">Password</Text>
      <TextInput
        placeholder="••••••••"
        placeholderTextColor="#A0AEC0"
        className="border border-purple-400 rounded-lg px-4 py-3 mb-6 text-gray-800 text-base"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className="bg-violet-500 py-4 rounded-lg shadow-md flex-row items-center justify-center"
        onPress={handleAuth}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-white font-semibold text-lg">
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-6 py-2"
        onPress={() => {
          setIsSignInMode(false);
          setErrorMessage('');
          setEmail('');
          setPassword('');
        }}>
        <Text className="text-center text-violet-600 font-semibold text-base">
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSignUpForm = () => (
    <View className="bg-white rounded-xl p-6 shadow-md w-full max-w-md mx-auto">
      <Text className="text-3xl font-bold text-center mb-2 text-gray-800">
        Sign Up for Habitamind
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-6">
        Join Habitamind and start building amazing habits today!
      </Text>

      {errorMessage ? (
        <Text className="text-center text-red-500 mb-4">{errorMessage}</Text>
      ) : null}

      <Text className="text-sm font-medium mb-1 text-gray-700">Name</Text>
      <TextInput
        placeholder="Your Name"
        placeholderTextColor="#A0AEC0"
        className="border border-purple-400 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Text className="text-sm font-medium mb-1 text-gray-700">
        Email Address
      </Text>
      <TextInput
        placeholder="your.email@example.com"
        placeholderTextColor="#A0AEC0"
        className="border border-purple-400 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text className="text-sm font-medium mb-1 text-gray-700">Password</Text>
      <TextInput
        placeholder="••••••••"
        placeholderTextColor="#A0AEC0"
        className="border border-purple-400 rounded-lg px-4 py-3 mb-6 text-gray-800 text-base"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className="bg-violet-500 py-4 rounded-lg shadow-md flex-row items-center justify-center"
        onPress={handleAuth}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-white font-semibold text-lg">
            Sign Up
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-6 py-2"
        onPress={() => {
          setIsSignInMode(true);
          setErrorMessage('');
          setEmail('');
          setPassword('');
          setName('');
        }}>
        <Text className="text-center text-violet-600 font-semibold text-base">
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );

  // If a user is signed in and verified, you could show a different view
  // or simply navigate them away from this screen via the useEffect.
  // For demonstration, let's show a "Signed In" message.
  if (user && user.emailVerified) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          Welcome, {user.displayName || user.email}!
        </Text>
        <Text className="text-lg text-gray-600 mb-8">
          You are signed in and your email is verified.
        </Text>
        <TouchableOpacity
          className="bg-red-500 py-3 px-6 rounded-lg shadow-md"
          onPress={signOutUser}>
          <Text className="text-white font-semibold text-base">Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render the appropriate form if no user is signed in or email is not verified
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-4">
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
          {isSignInMode ? renderSignInForm() : renderSignUpForm()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignInSignUpScreen;