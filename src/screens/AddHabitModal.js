import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddHabitModal =({ visible, onClose, onSave })=> {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminder, setReminder] = useState(false);

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  return (
    <Modal
      animationType="fade"
      visible={visible}
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/30 justify-center items-center px-4">
        <View className="bg-white w-full rounded-xl p-6 shadow-md">
          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-4 right-4"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="gray" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-xl font-semibold text-center mb-1">
            Create a New Habit
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-4">
            Fill in the details for your new habit. Click save when you're done.
          </Text>

          {/* Name */}
          <Text className="text-sm font-medium mb-1">Name</Text>
          <TextInput
            placeholder="e.g., Drink water"
            className="border border-purple-400 rounded-lg px-4 py-2 mb-4"
            value={name}
            onChangeText={setName}
          />

          {/* Description */}
          <Text className="text-sm font-medium mb-1">Description</Text>
          <TextInput
            placeholder="Why is this important?"
            multiline
            className="border border-gray-200 rounded-lg px-4 py-2 mb-4 text-sm"
            value={description}
            onChangeText={setDescription}
          />

          {/* Time Picker */}
          <Text className="text-sm font-medium mb-1">Time</Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            className="flex-row items-center border border-gray-200 rounded-lg px-4 py-2 mb-4"
          >
            <Text className="text-base mr-2">
              {time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
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
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-sm font-medium">Reminder</Text>
            <Switch
              value={reminder}
              onValueChange={setReminder}
              trackColor={{ false: '#ccc', true: '#a78bfa' }} // purple-400
              thumbColor={reminder ? '#7c3aed' : '#f4f3f4'} // purple-600
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="bg-violet-500 py-3 rounded-lg"
            onPress={() => onSave({ name, description, time, reminder })}
          >
            <Text className="text-center text-white font-semibold">
              Save Habit
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
export default AddHabitModal;