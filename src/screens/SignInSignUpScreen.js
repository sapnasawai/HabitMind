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
  Button,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Icon from 'react-native-vector-icons/Ionicons';
import {createUserProfile} from '../../WriteData';

const SignInSignUpScreen = () => {
  const navigation = useNavigation();
  const [isSignInMode, setIsSignInMode] = useState(true); // Toggle between Sign In and Sign Up
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null); // To store the authenticated user
  const [mobile, setMobile] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [confirm, setConfirm] = useState('');

  // Effect to listen for authentication state changes
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(userState => {
      setUser(userState);
      if (userState && userState.emailVerified) {
        console.log('User is signed in and email verified:', userState.email);
      } else if (userState && !userState.emailVerified && !isSignInMode) {
        console.log('User signed up but email not verified:', userState.email);
      }
    });
    return subscriber;
  }, [isSignInMode]);

  const displayError = message => {
    setErrorMessage(message);
    Alert.alert('Error', message); // Use Alert for critical errors
  };

  const handleAuth = async () => {
    console.log('sapna handleAuth');
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
        console.log('currentUser====',currentUser)
       
        await createUserProfile(
          currentUser.displayName,
          currentUser.email,
          currentUser.photoURL
        );
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
          await auth().signOut();
        } else if (currentUser && currentUser.emailVerified) {
          Alert.alert('Success', 'Signed in successfully!');
        }
      } else {
        // --- Sign Up Logic ---
        if (!name.trim()) {
          displayError('Please enter your name.');
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
        await createUserProfile(
          newUser.uid,
          newUser.displayName,
          newUser.email,
        );
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
    setLoading(true);
    try {
      await auth().signOut();
      setUser(null); // Clear the user state
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false); // Ensure loader is turned off
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

  const sendOtp = async () => {
    setLoading(true); // Start loader for OTP
    setErrorMessage('');
    try {
      const mobileNo = '+91' + mobile;
      const resp = await auth().signInWithPhoneNumber(mobileNo);
      setConfirm(resp);
      console.log('resp', resp);
      Alert.alert('otp sent please verify');
    } catch (err) {
      console.error('Error sending OTP:', err); // Log full error
      let userFacingMessage = 'Failed to send OTP. Please try again.';
      if (err.code === 'auth/invalid-phone-number') {
        userFacingMessage = 'The phone number provided is invalid.';
      } else if (err.code === 'auth/too-many-requests') {
        userFacingMessage = 'Too many requests. Please try again later.';
      } else if (err.code === 'auth/billing-not-enabled') {
        userFacingMessage =
          'Phone authentication requires billing to be enabled in Firebase.';
      } else if (err.code === 'auth/network-request-failed') {
        userFacingMessage =
          'Network error. Please check your internet connection.';
      }
      displayError(userFacingMessage);
    } finally {
      setLoading(false); // Ensure loader is turned off
    }
  };

  const verfiyOptp = async () => {
    setLoading(true); // Start loader for OTP verification
    setErrorMessage('');
    try {
      if (!confirm) {
        displayError('No OTP request initiated. Please send OTP first.');
        return;
      }
      const response = await confirm.confirm(otpInput);
      console.log('response-', response);
      Alert.alert(
        'OTP Verified',
        'Your phone number has been successfully verified!',
      );
      // After successful phone verification, you might want to create a user profile
      // in Firestore similar to email/password signup if this is a new user.
      if (response.user) {
        await createUserProfile(
          response.user.uid,
          response.user.displayName || 'Phone User',
          response.user.email || null,
        );
      }
      // App.js's onAuthStateChanged listener will handle navigation
    } catch (err) {
      console.error('Error verifying OTP:', err); // Log full error
      let userFacingMessage = 'Failed to verify OTP. Please try again.';
      if (err.code === 'auth/invalid-verification-code') {
        userFacingMessage = 'The verification code entered is invalid.';
      } else if (err.code === 'auth/code-expired') {
        userFacingMessage =
          'The verification code has expired. Please resend OTP.';
      } else if (err.code === 'auth/network-request-failed') {
        userFacingMessage =
          'Network error. Please check your internet connection.';
      }
      displayError(userFacingMessage);
    } finally {
      setLoading(false); // Ensure loader is turned off
    }
  };

  const mobileverification = () => {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          Verify with Phone Number
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-6">
          Enter your mobile number to receive an OTP.
        </Text>
        {errorMessage ? (
          <Text className="text-center text-red-500 mb-4">{errorMessage}</Text>
        ) : null}
        <TextInput
          placeholder="e.g., 9876543210"
          placeholderTextColor="#A0AEC0"
          className="border border-purple-400 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base w-full max-w-md"
          onChangeText={val => setMobile(val)}
          keyboardType="phone-pad"
          autoCapitalize="none"
          maxLength={10} // Assuming 10-digit Indian mobile numbers
        />
        <TouchableOpacity
          className="bg-violet-500 py-3 rounded-lg shadow-md flex-row items-center justify-center w-full max-w-md mb-4"
          onPress={sendOtp}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-white font-semibold text-lg">
              Send OTP
            </Text>
          )}
        </TouchableOpacity>

        {confirm ? ( // Only show OTP input if OTP has been sent
          <>
            <Text className="text-sm font-medium mb-1 text-gray-700 mt-6">
              Enter OTP
            </Text>
            <TextInput
              placeholder="••••••"
              placeholderTextColor="#A0AEC0"
              className="border border-purple-400 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base w-full max-w-md"
              onChangeText={val => setOtpInput(val)}
              keyboardType="number-pad"
              maxLength={6} // Assuming 6-digit OTP
            />
            <TouchableOpacity
              className="bg-violet-500 py-3 rounded-lg shadow-md flex-row items-center justify-center w-full max-w-md"
              onPress={verfiyOptp}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-white font-semibold text-lg">
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    );
  };
  const signIn = async () => {
    setLoading(true); // Start loader for Google Sign-In
    setErrorMessage('');
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      console.log('Google Sign-In response', response);

      if (isSuccessResponse(response)) {
        // Build Firebase credential with the Google ID token.
        const googleCredential = auth.GoogleAuthProvider.credential(
          response.idToken,
        );

        // Sign-in the user with the credential
        const userCredential = await auth().signInWithCredential(
          googleCredential,
        );
        const currentUser = userCredential.user;
        // Create user profile in Firestore after successful Google sign-in
        await createUserProfile(
          currentUser.displayName,
          currentUser.email,
          currentUser.photoURL,
        );

        Alert.alert('Success', 'Signed in with Google successfully!');
        // App.js's onAuthStateChanged listener will handle navigation
      } else {
        // sign in was cancelled by user (e.g., they closed the Google prompt)
        console.log('Google Sign-In cancelled by user.');
        setErrorMessage('Google Sign-In cancelled.');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      let userFacingMessage =
        'An unexpected error occurred during Google Sign-In. Please try again.';

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            userFacingMessage = 'Google Sign-In is already in progress.';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            userFacingMessage =
              'Google Play Services are not available or outdated.';
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            userFacingMessage = 'Google Sign-In was cancelled by the user.';
            break;
          case statusCodes.NETWORK_ERROR: // Specific Google Sign-In network error
            userFacingMessage =
              'Network error during Google Sign-In. Please check your internet connection.';
            break;
          case statusCodes.DEVELOPER_ERROR:
            userFacingMessage =
              'Developer error: Check your Google Sign-In configuration (webClientId).';
            break;
          default:
            userFacingMessage = `Google Sign-In error: ${
              error.message || 'Unknown error.'
            }`;
        }
      } else if (error.code === 'auth/network-request-failed') {
        // Firebase auth specific network error
        userFacingMessage =
          'Network error. Please check your internet connection.';
      }

      displayError(userFacingMessage);
    } finally {
      setLoading(false); // Ensure loader is turned off
    }
  };
  const signInWithGoogle = () => {
    return (
      <TouchableOpacity
        className="bg-violet-400 flex-row items-center justify-center py-3 rounded-xl mb-3"
        onPress={() => signIn()}>
        <Icon name="logo-google" size={18} color="white" className="mr-2" />
        <Text className="text-white font-semibold text-base">
          Sign in with Google
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-4">
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
          {/*TODO : code for phone authentication commented as it needs billing account and giving and err BILLING_NOT_ENABLED  
             {mobileverification()} */}
          {isSignInMode ? renderSignInForm() : renderSignUpForm()}
          {/*TODO : signin with google hold for now in real device
          {signInWithGoogle()} */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignInSignUpScreen;
