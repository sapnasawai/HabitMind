import 'react-native-reanimated'
import 'react-native-gesture-handler'
import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import './global.css';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {getAuth, onAuthStateChanged} from '@react-native-firebase/auth';
import AppNavigator from './AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import firestore from '@react-native-firebase/firestore';
import {useAppInitialization} from './src/hooks/useAppInitialization';

export default function App() {
  const [user, setUser] = React.useState(null);
  const [initializing, setInitializing] = React.useState(true);
  const [splashDurationComplete, setSplashDurationComplete] =
    React.useState(false);
  const handleAuthStateChanged = React.useCallback((user: any) => {
    setUser(user);
    if (initializing) setInitializing(false);
  }, [initializing]);

  // Initialize stores when user changes
  useAppInitialization(user);
  React.useEffect(() => {
    firestore()
      .settings({persistence: true})
      .then(() => console.log('✅ Offline persistence enabled'))
      .catch(err => console.error('❌ Failed to enable persistence', err));
  }, []);

  React.useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, [handleAuthStateChanged]);

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '687916973600-s7jq5qrg94fp62jp3ajraesr5vchvm53.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);
  const isAuthenticatedAndVerified = (userToCheck: any) => {
    return userToCheck !== null && userToCheck !== undefined && userToCheck.emailVerified;
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDurationComplete(true);
    }, 3000); // 5000 milliseconds = 5 seconds

    // Clear the timeout if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  if (initializing || !splashDurationComplete) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticatedAndVerified(user) ? (
          // User is authenticated and email is verified
          <AppNavigator user={user} />
        ) : (
          // No user, or user not verified
          <AuthNavigator />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
