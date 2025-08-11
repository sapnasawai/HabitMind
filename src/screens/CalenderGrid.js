import { Text, View } from "react-native";

export const CalendarGrid = ({completions}) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Create a new date object for the first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDay = firstDayOfMonth.getDay();

  const daysArray = [];

  // Fill in empty spaces for days before the 1st of the month
  for (let i = 0; i < startingDay; i++) {
    daysArray.push(null);
  }

  // Fill in the days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  return (
    <View className="flex-row flex-wrap mt-4 justify-start">
      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
        <Text key={day} className="text-center w-1/7 text-sm font-semibold text-gray-400 mb-2">
          {day}
        </Text>
      ))}
      {daysArray.map((day, index) => {
        const isCompleted = completions.some(
          completionDate =>
            completionDate.getDate() === day &&
            completionDate.getMonth() === currentMonth &&
            completionDate.getFullYear() === currentYear
        );

        const isToday = day === today.getDate() && currentMonth === today.getMonth();

        return (
          <View
            key={index}
            className={`w-1/7 h-12 p-1 items-center justify-center`}
          >
            {day && (
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isToday ? 'bg-violet-300' : isCompleted ? 'bg-green-400' : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isToday ? 'text-white' : isCompleted ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {day}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};