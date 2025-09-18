import React, { useState } from 'react';
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
  SafeAreaView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ICON_OPTIONS, IconComponents } from '../../ReadData';
import { useHabitStore } from '../stores';

const AddHabitScreen = ({ route }) => {
  const navigation = useNavigation();
  const { habitToEdit } = route.params || {};

  // Use Zustand store instead of manual Firestore calls
  const { addHabit, updateHabit, loading: storeLoading } = useHabitStore();

  const [name, setName] = useState(habitToEdit?.name || '');
  const [description, setDescription] = useState(
    habitToEdit?.description || '',
  );
  const [time, setTime] = useState(() => {
    if (habitToEdit?.reminder?.time) {
      // Parse the time string (HH:mm format) and create a Date object
      const [hours, minutes] = habitToEdit.reminder.time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return date;
    }
    return new Date();
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminder, setReminder] = useState(
    habitToEdit?.reminder?.enabled || false,
  );

  // Icon states
  const [selectedIcon, setSelectedIcon] = useState({
    name: habitToEdit?.icon || 'walk-outline',
    family: habitToEdit?.iconFamily || 'Ionicons',
  });
  const [isIconPickerVisible, setIsIconPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Frequency states
  const [frequencyType, setFrequencyType] = useState(
    habitToEdit?.frequencyType || 'daily',
  );
  const [selectedDays, setSelectedDays] = useState(
    habitToEdit?.frequency || [],
  );
  const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const DisplayIconComponent = IconComponents[selectedIcon.family];

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  // Function to toggle selected days for frequency
  const toggleDay = day => {
    setSelectedDays(
      prevDays =>
        prevDays.includes(day)
          ? prevDays.filter(d => d !== day)
          : [...prevDays, day].sort(
              (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b),
            ), // Keep sorted
    );
  };

  const handleSave = async () => {
    // Basic validation
    if (!name.trim()) {
      Alert.alert('Error', 'Habit name cannot be empty.');
      return;
    }
    if (frequencyType === 'specific_days' && selectedDays.length === 0) {
      Alert.alert(
        'Error',
        'Please select at least one day for specific days frequency.',
      );
      return;
    }

    setLoading(true); // Start loading indicator

    try {
      const habitData = {
        name: name.trim(),
        description: description.trim(),

        // --- Frequency Data ---
        frequency: frequencyType === 'daily' ? ['daily'] : selectedDays,
        frequencyType: frequencyType, // Store the type of frequency selected

        // --- Reminder Data ---
        reminder: {
          enabled: reminder,
          time: reminder ? format(time, 'HH:mm') : null, // Store as HH:mm string
        },

        // --- Icon Data ---
        icon: selectedIcon.name, // Store icon name
        iconFamily: selectedIcon.family, // Store icon family
      };

      console.log('Saving habit:', habitData);

      if (habitToEdit) {
        // Update existing habit
        await updateHabit(habitToEdit.id, habitData);
        Alert.alert('Success', 'Habit updated successfully!');
      } else {
        // Add new habit
        await addHabit(habitData);
        Alert.alert('Success', 'Habit added successfully!');
      }

      // Clear form fields after successful save
      if (!habitToEdit) {
        setName('');
        setDescription('');
        setTime(new Date());
        setReminder(false);
        setSelectedIcon({ name: 'walk-outline', family: 'Ionicons' });
        setFrequencyType('daily');
        setSelectedDays([]);
      }

      navigation.navigate('MainTabs', { 
        screen: 'Habits', 
        params: { refresh: true } 
      });
    } catch (error) {
      console.error('Error saving habit:', error);
      Alert.alert('Error', 'Failed to save habit. Please try again.');
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  const renderIconItem = ({ item }) => {
    const CurrentIconComponent = IconComponents[item.family];
    if (!CurrentIconComponent) {
      console.warn(
        `Icon family '${item.family}' not found for icon '${item.name}'`,
      );
      return null; // Don't render if component is missing
    }

    const isSelected =
      selectedIcon.name === item.name && selectedIcon.family === item.family;

    return (
      <TouchableOpacity
        className={`items-center p-4 rounded-lg border m-1 w-[20%] aspect-square justify-center
                    ${
                      isSelected
                        ? 'bg-violet-500 border-violet-500'
                        : 'bg-white border-gray-200'
                    }`}
        onPress={() => {
          setSelectedIcon({ name: item.name, family: item.family });
          setIsIconPickerVisible(false); // Close modal on selection
        }}
      >
        <CurrentIconComponent
          name={item.name}
          size={30}
          color={isSelected ? '#fff' : '#6B46C1'}
        />
        <Text
          className={`text-xs mt-1 text-center ${
            isSelected ? 'text-white' : 'text-gray-700'
          }`}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    // Dismiss keyboard when touching outside input fields
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* SafeAreaView to handle notches and system bars */}
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* KeyboardAvoidingView to adjust content when keyboard appears */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
            <Text className="text-3xl font-bold text-gray-800 text-center mb-7">
              {habitToEdit ? 'Edit Habit' : 'Add New Habit'}
            </Text>

            {/* Habit Name */}
            <Text className="text-base font-medium text-gray-700 mb-2 mt-4">
              Name
            </Text>
            <TextInput
              placeholder="e.g., Drink water"
              placeholderTextColor="#A0AEC0" // Tailwind gray-400
              className="border border-purple-400 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base bg-white"
              value={name}
              onChangeText={setName}
            />
            {/* Habit Description */}
            <Text className="text-base font-medium text-gray-700 mb-2 mt-4">
              Description
            </Text>
            <TextInput
              placeholder="Why is this important? (Optional)"
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4} // Give it more space
              className="border border-gray-200 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base h-24 text-top bg-white"
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top" // Align text to top for multiline
            />
            {/* --- Frequency Selection --- */}
            <Text className="text-base font-medium text-gray-700 mb-2 mt-4">
              Frequency
            </Text>
            <View className="flex-row justify-around mb-5 bg-gray-200 rounded-lg p-1">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-md items-center ${
                  frequencyType === 'daily' ? 'bg-violet-500' : ''
                }`}
                onPress={() => {
                  setFrequencyType('daily');
                  setSelectedDays([]); // Clear specific days if daily is chosen
                }}
              >
                <Text
                  className={`text-base font-semibold ${
                    frequencyType === 'daily' ? 'text-white' : 'text-violet-600'
                  }`}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-md items-center ${
                  frequencyType === 'specific_days' ? 'bg-violet-500' : ''
                }`}
                onPress={() => setFrequencyType('specific_days')}
              >
                <Text
                  className={`text-base font-semibold ${
                    frequencyType === 'specific_days'
                      ? 'text-white'
                      : 'text-violet-600'
                  }`}
                >
                  Specific Days
                </Text>
              </TouchableOpacity>
            </View>

            {frequencyType === 'specific_days' && (
              <View className="flex-row flex-wrap justify-around mb-5">
                {DAYS_OF_WEEK.map(day => (
                  <TouchableOpacity
                    key={day}
                    className={`w-[13%] aspect-square rounded-full justify-center items-center border m-1
                                        ${
                                          selectedDays.includes(day)
                                            ? 'bg-violet-500 border-violet-500'
                                            : 'border-gray-400'
                                        }`}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedDays.includes(day)
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {day.substring(0, 3)}{' '}
                      {/* Display short form like Sun, Mon */}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {/* Reminder Toggle */}
            <View className="flex-row items-center justify-between mb-5 bg-white p-4 rounded-lg border border-gray-100">
              <Text className="text-base font-medium text-gray-700">
                Enable Reminder
              </Text>
              <Switch
                value={reminder}
                onValueChange={setReminder}
                trackColor={{ false: '#E2E8F0', true: '#A78BFA' }} // gray-200, purple-400
                thumbColor={reminder ? '#7C3AED' : '#F7FAFC'} // purple-600, white
              />
            </View>

            {/* Time Picker */}
            {reminder && ( // Only show time picker if reminder is enabled
              <>
                <Text className="text-base font-medium text-gray-700 mb-2 mt-4">
                  Reminder Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  className="flex-row items-center justify-between border border-purple-400 rounded-lg px-4 py-3 bg-white mb-5"
                >
                  <Text className="text-base text-gray-800">
                    {format(time, 'h:mm a')}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#4A5568" />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'} // 'spinner' for iOS for better UX
                    onChange={handleTimeChange}
                  />
                )}
              </>
            )}

            {/* Icon Selection */}
            <Text className="text-base font-medium text-gray-700 mb-2 mt-4">
              Choose Icon
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-between border border-purple-400 rounded-lg px-4 py-3 bg-white mb-5"
              onPress={() => setIsIconPickerVisible(true)}
            >
              {DisplayIconComponent && (
                <DisplayIconComponent
                  name={selectedIcon.name}
                  size={30}
                  color="#6B46C1"
                />
              )}
              <Text className="text-base text-gray-800 flex-1 ml-2">
                {ICON_OPTIONS.find(
                  opt =>
                    opt.name === selectedIcon.name &&
                    opt.family === selectedIcon.family,
                )?.label || 'Select Icon'}
              </Text>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#6B46C1"
              />
            </TouchableOpacity>
            {/* Save Button */}
            <TouchableOpacity
              className="bg-violet-500 py-4 rounded-lg shadow-md items-center justify-center mb-5"
              onPress={handleSave}
              disabled={loading || storeLoading}
            >
              {loading || storeLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  {habitToEdit ? 'Update Habit' : 'Save Habit'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
          <Modal
            animationType="slide"
            transparent={true}
            visible={isIconPickerVisible}
            onRequestClose={() => setIsIconPickerVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="bg-white rounded-xl p-6 w-4/5 max-h-3/5 shadow-xl">
                <Text className="text-2xl font-bold text-gray-800 mb-5 text-center">
                  Select an Icon
                </Text>
                <FlatList
                  data={ICON_OPTIONS}
                  renderItem={renderIconItem}
                  keyExtractor={item => `${item.name}-${item.family}`} // Unique key for combined name and family
                  numColumns={5} // Adjust as needed for layout
                  contentContainerStyle={{
                    justifyContent: 'space-between',
                    padding: 10,
                  }}
                />
                <TouchableOpacity
                  className="bg-gray-400 py-3 rounded-lg items-center mt-5"
                  onPress={() => setIsIconPickerVisible(false)}
                >
                  <Text className="text-gray-800 text-base font-semibold">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddHabitScreen;
