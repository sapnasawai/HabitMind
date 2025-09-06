import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// Progress store for derived data and statistics
export const useProgressStore = create(
  subscribeWithSelector(persist((set, get) => ({
    // State
    loading: false,
    error: null,
    lastUpdated: null,

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Get habits with completion status for today
    getHabitsWithCompletions: (habits, todayCompletions) => {
      return habits.map(habit => ({
        ...habit,
        isCompletedToday: !!todayCompletions[habit.id],
        todayCompletionId: todayCompletions[habit.id],
      }));
    },

    // Get user progress statistics
    getUserProgress: (habits, completions, userProfile) => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Calculate today's completions
      const completedToday = habits.filter(habit => 
        completions[habit.id]?.some(completion => {
          const completionDate = completion.date.toDate();
          return completionDate.toDateString() === today.toDateString();
        })
      ).length;

      // Calculate monthly completion rate
      const totalPossibleCompletions = habits.length * endOfMonth.getDate();
      const actualCompletions = habits.reduce((total, habit) => {
        const habitCompletions = completions[habit.id] || [];
        return total + habitCompletions.filter(completion => {
          const completionDate = completion.date.toDate();
          return completionDate >= startOfMonth && completionDate <= endOfMonth;
        }).length;
      }, 0);

      const monthlyCompletionRate = totalPossibleCompletions > 0 
        ? Math.round((actualCompletions / totalPossibleCompletions) * 100)
        : 0;

      // Calculate average streak
      const averageStreak = habits.length > 0
        ? Math.round(habits.reduce((sum, habit) => sum + (habit.currentStreak || 0), 0) / habits.length)
        : 0;

      return {
        completedToday,
        totalHabits: habits.length,
        monthlyCompletionRate,
        averageStreak,
        totalXP: userProfile?.totalXP || 0,
        level: userProfile?.level || 1,
        globalStreak: userProfile?.currentGlobalStreak || 0,
        bestGlobalStreak: userProfile?.bestGlobalStreak || 0,
      };
    },

    // Get habit statistics
    getHabitStats: (habitId, completions) => {
      const habitCompletions = completions[habitId] || [];
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Filter completions for this month
      const monthlyCompletions = habitCompletions.filter(completion => {
        const completionDate = completion.date.toDate();
        return completionDate >= startOfMonth && completionDate <= endOfMonth;
      });

      const daysInMonth = endOfMonth.getDate();
      const completionRate = Math.round((monthlyCompletions.length / daysInMonth) * 100);

      return {
        totalCompletions: habitCompletions.length,
        monthlyCompletions: monthlyCompletions.length,
        completionRate,
        isCompletedToday: habitCompletions.some(completion => {
          const completionDate = completion.date.toDate();
          return completionDate.toDateString() === today.toDateString();
        }),
      };
    },

    // Get calendar data for a specific month
    getCalendarData: (habitId, completions, year, month) => {
      const habitCompletions = completions[habitId] || [];
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = endOfMonth.getDate();

      // Create array of dates for the month
      const calendarData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isCompleted = habitCompletions.some(completion => {
          const completionDate = completion.date.toDate();
          return completionDate.toDateString() === date.toDateString();
        });
        
        calendarData.push({
          day,
          date,
          isCompleted,
          isToday: date.toDateString() === new Date().toDateString(),
        });
      }

      return calendarData;
    },

    // Clear all data (useful for logout)
    clearAllData: () => set({ 
      lastUpdated: null, 
      error: null 
    }),
  }))
));
