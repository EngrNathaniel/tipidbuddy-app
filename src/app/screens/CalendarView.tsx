import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useApp } from '@/app/context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

interface DayData {
  date: Date;
  expenses: number;
  income: number;
  balance: number;
  hasTransactions: boolean;
}

interface CalendarViewProps {
  onBack: () => void;
}

export function CalendarView({ onBack }: CalendarViewProps) {
  const { isDarkMode } = useTheme();
  const { expenses } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate calendar data
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayExpenses = expenses.filter(e => e.date === dateStr);

      const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        date,
        expenses: totalExpenses,
        income: 0, // Can be extended to track income
        balance: -totalExpenses,
        hasTransactions: dayExpenses.length > 0,
      } as DayData;
    });
  }, [currentMonth, expenses]);

  // Get expenses for selected date
  const selectedDateExpenses = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return expenses.filter(e => e.date === dateStr);
  }, [selectedDate, expenses]);

  // Calculate month summary
  const monthSummary = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const average = monthExpenses.length > 0 ? total / monthExpenses.length : 0;

    return {
      total,
      count: monthExpenses.length,
      average,
    };
  }, [currentMonth, expenses]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getDayColor = (day: DayData) => {
    if (!day.hasTransactions) return '';

    if (day.expenses > 500) return 'bg-red-500/20 border-red-500';
    if (day.expenses > 200) return 'bg-orange-500/20 border-orange-500';
    if (day.expenses > 0) return 'bg-yellow-500/20 border-yellow-500';
    return 'bg-green-500/20 border-green-500';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="max-w-lg mx-auto px-6 mb-8 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Calendar</h1>
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Month Summary */}
        <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="grid grid-cols-3 gap-3 divide-x divide-gray-100 dark:divide-white/5">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₱{monthSummary.total.toFixed(0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Transactions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{monthSummary.count}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Average</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₱{monthSummary.average.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-6">
        {/* Month Navigation */}
        <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-2.5 px-4 rounded-xl text-sm font-medium mb-6 transition-colors"
          >
            Go to Today
          </button>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className="text-center text-xs font-medium py-2 text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarData.map((day, index) => {
              const isCurrentMonth = isSameMonth(day.date, currentMonth);
              const isToday = isSameDay(day.date, new Date());
              const isSelected = selectedDate && isSameDay(day.date, selectedDate);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  disabled={!isCurrentMonth}
                  className={`aspect-square p-0.5 rounded-xl border transition-all ${!isCurrentMonth
                      ? 'opacity-0 cursor-default border-transparent'
                      : isSelected
                        ? 'bg-primary text-primary-foreground border-primary scale-105 shadow-md z-10'
                        : isToday
                          ? 'bg-primary/5 border-primary/50'
                          : day.hasTransactions
                            ? getDayColor(day)
                            : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-xs font-medium ${isSelected
                        ? 'text-primary-foreground'
                        : isToday
                          ? 'text-primary'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                      {format(day.date, 'd')}
                    </span>
                    {day.hasTransactions && !isSelected && (
                      <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${day.expenses > 500 ? 'bg-red-500' :
                          day.expenses > 200 ? 'bg-orange-500' :
                            day.expenses > 0 ? 'bg-yellow-500' :
                              'bg-emerald-500'
                        }`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
            <p className="text-xs font-medium mb-3 text-muted-foreground">
              Expense Legend:
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-muted-foreground">₱0-200</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-muted-foreground">₱200-500</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-muted-foreground">₱500+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h3>

            {selectedDateExpenses.length > 0 ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-muted-foreground">
                        Expenses
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      ₱{selectedDateExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Count
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedDateExpenses.length}
                    </p>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Transactions:
                  </p>
                  {selectedDateExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white mb-0.5">
                          {expense.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expense.category}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        ₱{expense.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No transactions on this date
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
