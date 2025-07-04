import {View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
    const navigation = useNavigation()
  return (
    <View className="flex-1 justify-center bg-red-400">
      <TouchableOpacity onPress={()=> navigation.navigate('Profile')}>
        <Text>Home Screen</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
