import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView, // Import SafeAreaView for proper layout on iOS
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {format} from 'date-fns';

const AddHabitScreen = () => { // Renamed from AddHabitModal
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminder, setReminder] = useState(false);

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios'); // iOS picker stays open until explicitly dismissed
    setTime(currentTime);
  };

  const handleSave = () => {
    // In a real app, you would save this habit to Firestore here.
    const habitData = {name, description, time, reminder};
    console.log('Saved habit:', habitData);
    // After saving, navigate back to the previous screen (e.g., HabbitsScreen)
    navigation.goBack();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    // Dismiss keyboard when touching outside input fields
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* SafeAreaView to handle notches and system bars */}
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* KeyboardAvoidingView to adjust content when keyboard appears */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">

          {/* Header */}
          {/* <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 bg-white shadow-sm">
            <TouchableOpacity onPress={handleGoBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="arrow-back-outline" size={24} color="gray" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-gray-800">New Habit</Text>
            <View className="w-6" /> 
          </View> */}

          {/* Scrollable content area for the form */}
          <View className="flex-1 p-6"> {/* Removed bg-black/30 and centering */}
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Create a New Habit
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              Fill in the details for your new habit. Click save when you're done.
            </Text>

            {/* Name Input */}
            <Text className="text-sm font-medium mb-1 text-gray-700">Name</Text>
            <TextInput
              placeholder="e.g., Drink water"
              placeholderTextColor="#A0AEC0" // Tailwind gray-400
              className="border border-purple-400 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base"
              value={name}
              onChangeText={setName}
            />

            {/* Description Input */}
            <Text className="text-sm font-medium mb-1 text-gray-700">Description</Text>
            <TextInput
              placeholder="Why is this important? (Optional)"
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4} // Give it more space
              className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base h-24" // Increased height
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top" // Align text to top for multiline
            />

            {/* Time Picker */}
            <Text className="text-sm font-medium mb-1 text-gray-700">Reminder Time</Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-white">
              <Text className="text-base mr-2 text-gray-800">{format(time, 'h:mm a')}</Text>
              <Ionicons name="time-outline" size={20} color="gray" />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Reminder Toggle */}
            <View className="flex-row items-center justify-between mb-8 bg-white p-4 rounded-lg border border-gray-100">
              <Text className="text-base font-medium text-gray-700">Enable Reminder</Text>
              <Switch
                value={reminder}
                onValueChange={setReminder}
                trackColor={{false: '#E2E8F0', true: '#A78BFA'}} // gray-200, purple-400
                thumbColor={reminder ? '#7C3AED' : '#F7FAFC'} // purple-600, white
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              className="bg-violet-500 py-4 rounded-lg shadow-md"
              onPress={handleSave}>
              <Text className="text-center text-white font-semibold text-lg">
                Save Habit
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddHabitScreen;