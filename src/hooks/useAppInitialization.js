import { useEffect, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import { useHabitStore, useUserStore } from '../stores';

// Simple initialization hook that doesn't cause re-renders
export const useAppInitialization = (user) => {
  const initializedRef = useRef(false);
  const { initializeListeners, clearAllData, isInitialized, forceReinitialize, rescheduleAllNotifications } = useHabitStore();
  const { setUser, fetchUserProfile, clearUserData } = useUserStore();

  useEffect(() => {
    if (user && !initializedRef.current) {
      // User is signed in - initialize stores
      initializedRef.current = true;
      
      const initializeApp = async () => {
        try {
          console.log('🚀 Initializing app for user:', user.uid);
          
          // Set user in store
          setUser(user);
          
          // Fetch user profile
          await fetchUserProfile();
          
          // Initialize habit listeners
          console.log('📡 Initializing habit listeners...');
          initializeListeners();
          
          // Check initialization status after a short delay
          setTimeout(async () => {
            const status = isInitialized();
            console.log('📊 Initialization status:', status);
            if (!status.hasListeners && status.hasUser) {
              console.log('⚠️ Listeners not initialized, forcing reinitialize...');
              forceReinitialize();
            }
            
            // Reschedule notifications after initialization
            try {
              await rescheduleAllNotifications();
            } catch (error) {
              console.error('❌ Failed to reschedule notifications:', error);
            }
          }, 2000);
          
        } catch (error) {
          console.error('❌ Error during app initialization:', error);
        }
      };

      initializeApp();
        
    } else if (!user && initializedRef.current) {
      // User is signed out - clear stores
      console.log('👋 User signed out, clearing stores');
      initializedRef.current = false;
      setUser(null);
      clearUserData();
      clearAllData();
    }

    // Cleanup function
    return () => {
      // Only clear data if user is actually null (not just undefined during initialization)
      if (user === null) {
        console.log('🧹 Cleanup: clearing data due to null user');
        clearAllData();
      }
    };
  }, [user]); // Only depend on user changes
};
