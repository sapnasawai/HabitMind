import { useMemo } from 'react';
import { useHabitStore, useUserStore, useCompletionStore } from '../stores';

// Hook to get habit with its completion status for today
export const useHabitWithCompletion = (habitId) => {
  const habit = useHabitStore((state) => 
    state.habits.find(h => h.id === habitId)
  );
  const isCompletedToday = useCompletionStore((state) => 
    state.isCompletedToday(habitId)
  );
  const todayCompletion = useCompletionStore((state) => 
    state.todayCompletions[habitId]
  );

  return useMemo(() => ({
    habit,
    isCompletedToday,
    todayCompletion,
  }), [habit, isCompletedToday, todayCompletion]);
};

// Hook to get all habits with their completion status for today
export const useHabitsWithCompletions = () => {
  const habits = useHabitStore((state) => state.habits);
  const todayCompletions = useCompletionStore((state) => state.todayCompletions);

  return useMemo(() => 
    habits.map(habit => ({
      ...habit,
      isCompletedToday: !!todayCompletions[habit.id],
      todayCompletionId: todayCompletions[habit.id],
    })), [habits, todayCompletions]
  );
};

// Hook to get user stats with computed values
export const useUserStats = () => {
  const profile = useUserStore((state) => state.profile);
  const habits = useHabitStore((state) => state.habits);
  const completions = useCompletionStore((state) => state.completions);

  return useMemo(() => {
    if (!profile) return null;

    const activeHabits = habits.filter(habit => habit.isActive);
    const totalHabits = habits.length;
    const completedToday = Object.keys(completions).filter(habitId => 
      completions[habitId]?.some(comp => {
        const compDate = comp.date.toDate ? comp.date.toDate() : comp.date;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return compDate >= today;
      })
    ).length;

    const totalXP = profile.totalXP || 0;
    const level = profile.level || 1;
    const xpToNextLevel = level * 500;
    const progressToNextLevel = totalXP % 500;

    return {
      ...profile,
      totalHabits,
      activeHabits: activeHabits.length,
      completedToday,
      completionRate: activeHabits.length > 0 ? (completedToday / activeHabits.length) * 100 : 0,
      level,
      totalXP,
      xpToNextLevel,
      progressToNextLevel,
      progressPercentage: (progressToNextLevel / 500) * 100,
    };
  }, [profile, habits, completions]);
};

// Hook to get habit statistics
export const useHabitStats = (habitId) => {
  const habit = useHabitStore((state) => 
    state.habits.find(h => h.id === habitId)
  );
  const habitCompletions = useCompletionStore((state) => 
    state.completions[habitId] || []
  );

  return useMemo(() => {
    if (!habit) return null;

    const totalCompletions = habitCompletions.length;
    const currentStreak = habit.currentStreak || 0;
    const bestStreak = habit.bestStreak || 0;
    const habitXP = habit.habitXP || 0;

    // Calculate weekly completion rate
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekCompletions = habitCompletions.filter(comp => {
      const compDate = comp.date.toDate();
      return compDate >= weekStart;
    }).length;

    const weeklyCompletionRate = (weekCompletions / 7) * 100;

    // Convert completions to Date objects for CalendarGrid
    const completionsAsDates = habitCompletions.map(comp => 
      comp.date.toDate ? comp.date.toDate() : comp.date
    );

    return {
      totalCompletions,
      currentStreak,
      bestStreak,
      habitXP,
      weekCompletions,
      weeklyCompletionRate,
      lastCompletionDate: habit.lastCompletionDate,
      completions: completionsAsDates, // For CalendarGrid compatibility
    };
  }, [habit, habitCompletions]);
};

// Hook to get completion data for a date range
export const useCompletionData = (habitId, startDate, endDate) => {
  const habitCompletions = useCompletionStore((state) => 
    state.completions[habitId] || []
  );

  return useMemo(() => {
    if (!startDate || !endDate) return [];

    return habitCompletions.filter((comp) => {
      const compDate = comp.date.toDate();
      return compDate >= startDate && compDate <= endDate;
    }).sort((a, b) => {
      const dateA = a.date.toDate ? a.date.toDate() : a.date;
      const dateB = b.date.toDate ? b.date.toDate() : b.date;
      return dateA - dateB;
    });
  }, [habitCompletions, startDate, endDate]);
};

// Hook to get loading and error states from all stores
export const useStoreStatus = () => {
  const habitLoading = useHabitStore((state) => state.loading);
  const habitError = useHabitStore((state) => state.error);
  const userLoading = useUserStore((state) => state.loading);
  const userError = useUserStore((state) => state.error);
  const completionLoading = useCompletionStore((state) => state.loading);
  const completionError = useCompletionStore((state) => state.error);

  return {
    isLoading: habitLoading || userLoading || completionLoading,
    hasError: !!(habitError || userError || completionError),
    errors: {
      habits: habitError,
      user: userError,
      completions: completionError,
    },
  };
};

