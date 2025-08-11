import { eachDayOfInterval } from "date-fns";

 // Calculates the current streak for a habit
export const calculateStreak = (habitId, completions, allHabits) => {
  if(completions?.length !== undefined && allHabits?.length !== undefined){
  const habitCompletions = completions
    .filter(c => c.habitId === habitId)
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()); // Sort descending
  
  if (habitCompletions.length === 0) {
    return 0;
  }
  }
  else{
     return 0;
  }
  let streak = 0;
  let lastCompletionDate = null;
  const today = new Date();

  // Check if completed today or yesterday
  const firstCompletion = habitCompletions[0].completedAt;
  if (isSameDay(firstCompletion, today)) {
    streak = 1;
    lastCompletionDate = today;
  } else if (isYesterday(firstCompletion)) {
    streak = 1;
    lastCompletionDate = today; // Reference point for yesterday's completion
  } else {
    return 0; // Streak broken if last completion is not today or yesterday
  }

  for (let i = 0; i < habitCompletions.length; i++) {
    const currentCompletionDate = habitCompletions[i].completedAt;

    if (lastCompletionDate && isSameDay(currentCompletionDate, lastCompletionDate)) {
      continue; // Skip if current completion is same day as last processed
    }

    let expectedPrevDay = null;
    const habit = allHabits.find(h => h.id === habitId);

    if (!habit) continue; // Should not happen if data is consistent

    if (habit.frequency === 'daily') {
      expectedPrevDay = subDays(lastCompletionDate, 1);
    } else if (habit.frequency === 'specificDays' && habit.specificDays) {
      let daysBack = 1;
      let foundPrev = false;
      while (!foundPrev && daysBack <= 7) {
        const potentialPrevDay = subDays(lastCompletionDate, daysBack);
        if (habit.specificDays.includes(potentialPrevDay.getDay())) {
          expectedPrevDay = potentialPrevDay;
          foundPrev = true;
        }
        daysBack++;
      }
    }

    if (expectedPrevDay && isSameDay(currentCompletionDate, expectedPrevDay)) {
      streak++;
      lastCompletionDate = currentCompletionDate;
    } else {
      break; // Streak broken
    }
  }
  return streak;
};
// Determines if a habit was completed on a specific day
export const wasCompletedOnDay = (habitId, completions, date) => {
  return completions.some(c => c.habitId === habitId && isSameDay(c.completedAt, date));
};

// Calculate completion rate for a given period
export const calculateCompletionRate = (habitId, completions, habitDetails, startDate, endDate) => {
  const relevantCompletions = completions.filter(c =>
    c.habitId === habitId && c.completedAt >= startDate && c.completedAt <= endDate
  );

  const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
  let expectedDays = 0;
  let completedDays = 0;

  daysInPeriod.forEach(day => {
    let isExpected = false;
    if (habitDetails.frequency === 'daily') {
      isExpected = true;
    } else if (habitDetails.frequency === 'specificDays' && habitDetails.specificDays) {
      isExpected = habitDetails.specificDays.includes(getDay(day));
    }
    // Add other frequencies if needed

    if (isExpected && day <= new Date()) { // Only count expected days up to today
      expectedDays++;
      if (relevantCompletions.some(c => isSameDay(c.completedAt, day))) {
        completedDays++;
      }
    }
  });

  return expectedDays > 0 ? (completedDays / expectedDays) : 0;
};

// Calculates overall completion rate across all habits for a period (defined here as it's specific to overall view)
export const calculateOverallCompletionRate = (allHabits, allCompletions, startDate, endDate) => {
  let totalExpectedCompletions = 0;
  let totalActualCompletions = 0;

  allHabits.forEach(habit => {
    const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
    daysInPeriod.forEach(day => {
      let isExpected = false;
      if (habit.frequency === 'daily') {
        isExpected = true;
      } else if (habit.frequency === 'specificDays' && habit.specificDays) {
        isExpected = habit.specificDays.includes(getDay(day));
      }

      if (isExpected && day <= new Date()) {
        totalExpectedCompletions++;
        if (allCompletions.some(c => c.habitId === habit.id && isSameDay(c.completedAt, day))) {
          totalActualCompletions++;
        }
      }
    });
  });

  return totalExpectedCompletions > 0 ? (totalActualCompletions / totalExpectedCompletions) : 0;
};

