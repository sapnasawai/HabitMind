// src/screens/SplashScreen.js (Create this file)
import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habitamind</Text>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={styles.subtitle}>Loading your habits...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Light gray background
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7C3AED', // Violet color
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280', // Gray color
    marginTop: 10,
  },
});

export default SplashScreen;