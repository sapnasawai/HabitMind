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
  SafeAreaView,
  Modal,
  FlatList,
  StyleSheet, // Import SafeAreaView for proper layout on iOS
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {format} from 'date-fns';
import {addNewHabit} from '../../WriteData';
import {ICON_OPTIONS, IconComponents} from '../../ReadData';

const AddHabitScreen = () => {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState({
    name: 'walk-outline',
    family: 'Ionicons',
  }); // Default icon
  const [isIconPickerVisible, setIsIconPickerVisible] = useState(false);
  const DisplayIconComponent = IconComponents[selectedIcon.family];
  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const handleSave = async () => {
    const habitData = {name, description, time, reminder};
    console.log('Saved habit:', habitData);
    await addNewHabit(habitData);
    navigation.goBack();
  };

  const renderIconItem = ({item}) => {
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
        style={[styles.iconOption, isSelected && styles.selectedIconOption]}
        onPress={() => {
          setSelectedIcon({name: item.name, family: item.family});
          setIsIconPickerVisible(false); // Close modal on selection
        }}>
        <CurrentIconComponent
          name={item.name}
          size={30}
          color={isSelected ? '#fff' : '#6B46C1'}
        />
        <Text style={[styles.iconLabel, isSelected && {color: '#fff'}]}>
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
          className="flex-1">
          <View className="flex-1 p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Create a New Habit
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              Fill in the details for your new habit. Click save when you're
              done.
            </Text>
            <Text className="text-sm font-medium mb-1 text-gray-700">Name</Text>
            <TextInput
              placeholder="e.g., Drink water"
              placeholderTextColor="#A0AEC0" // Tailwind gray-400
              className="border border-purple-400 rounded-lg px-4 py-3 mb-4 text-gray-800 text-base"
              value={name}
              onChangeText={setName}
            />
            <Text className="text-sm font-medium mb-1 text-gray-700">
              Description
            </Text>
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
            <Text className="text-sm font-medium mb-1 text-gray-700">
              Reminder Time
            </Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-white">
              <Text className="text-base mr-2 text-gray-800">
                {format(time, 'h:mm a')}
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
            <View className="flex-row items-center justify-between mb-8 bg-white p-4 rounded-lg border border-gray-100">
              <Text className="text-base font-medium text-gray-700">
                Enable Reminder
              </Text>
              <Switch
                value={reminder}
                onValueChange={setReminder}
                trackColor={{false: '#E2E8F0', true: '#A78BFA'}} // gray-200, purple-400
                thumbColor={reminder ? '#7C3AED' : '#F7FAFC'} // purple-600, white
              />
            </View>
            <Text style={styles.label}>Choose Ionicons</Text>
            <TouchableOpacity
              style={styles.iconSelectionButton}
              onPress={() => setIsIconPickerVisible(true)}>
              {DisplayIconComponent && (
                <DisplayIconComponent
                  name={selectedIcon.name}
                  size={30}
                  color="#6B46C1"
                />
              )}
              <Text style={styles.iconSelectionText}>
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
              className="bg-violet-500 py-4 rounded-lg shadow-md"
              onPress={handleSave}>
              <Text className="text-center text-white font-semibold text-lg">
                Save Habit
              </Text>
            </TouchableOpacity>
          </View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={isIconPickerVisible}
            onRequestClose={() => setIsIconPickerVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select an Icon</Text>
                <FlatList
                  data={ICON_OPTIONS}
                  renderItem={renderIconItem}
                  keyExtractor={item => `${item.name}-${item.family}`} // Unique key for combined name and family
                  numColumns={3} // Adjust as needed for layout
                  contentContainerStyle={styles.iconListContainer}
                />
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setIsIconPickerVisible(false)}>
                  <Text style={styles.closeModalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC', // Tailwind's gray-50
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2D3748', // Tailwind's gray-800
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A5568', // Tailwind's gray-700
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#805AD5', // Tailwind's purple-400
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#EDF2F7', // Tailwind's gray-200
    borderRadius: 8,
    padding: 5,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#6B46C1', // Tailwind's violet-500
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1', // Tailwind's violet-600
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  iconSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#805AD5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  iconSelectionText: {
    fontSize: 16,
    color: '#2D3748',
    flex: 1,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#6B46C1', // Tailwind's violet-500
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  iconListContainer: {
    justifyContent: 'space-between',
    paddingBottom: 10, // Give some padding at the bottom for scrolling
  },
  iconOption: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Tailwind's gray-200
    margin: 5,
    width: '30%', // Roughly 3 icons per row with margins
    aspectRatio: 1, // Make it square
    justifyContent: 'center',
  },
  selectedIconOption: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  iconLabel: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 5,
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: '#CBD5E0', // Tailwind's gray-400
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalButtonText: {
    color: '#2D3748',
    fontSize: 16,
    fontWeight: '600',
  },
});
export default AddHabitScreen;
