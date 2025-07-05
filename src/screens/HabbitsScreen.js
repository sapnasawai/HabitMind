import {View, Text, Image, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import AddHabitModal from './AddHabitModal';

const HabbitsScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const handleSaveHabit = habitData => {
    console.log('Saved:', habitData);
    setModalVisible(false);
  };

  return (
    <>
    <View className="flex-1 bg-white items-center justify-center px-4">
      {/* <Image source={require('../../Images/addHabbit.png')}
    className='w-64 h-64 mb-6'
    resizeMode='contain'/> */}
      <Text className="text-lg text-gray-600 mb-4 text-center">
        You haven’t added any habits yet!
      </Text>
      <TouchableOpacity
        onPress={() => setModalVisible(true)} // or open a modal
        className="bg-violet-500 px-6 py-3 rounded-full shadow-md">
        <Text className="text-white text-base font-semibold">
           Add New Habit
        </Text>
      </TouchableOpacity>
      <AddHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveHabit}
      />
    </View>
    </>
  );
};

export default HabbitsScreen;
