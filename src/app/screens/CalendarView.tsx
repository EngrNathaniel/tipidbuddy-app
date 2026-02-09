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
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'} text-white p-6 rounded-b-3xl shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Financial Calendar</h1>
          <CalendarIcon className="w-8 h-8" />
        </div>

        {/* Month Summary */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 grid grid-cols-3 gap-3">
          <div>
            <p className="text-white/80 text-xs">Total</p>
            <p className="text-lg font-bold">₱{monthSummary.total.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-white/80 text-xs">Transactions</p>
            <p className="text-lg font-bold">{monthSummary.count}</p>
          </div>
          <div>
            <p className="text-white/80 text-xs">Average</p>
            <p className="text-lg font-bold">₱{monthSummary.average.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Month Navigation */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-md`}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
            </div>
            <button
              onClick={handleNextMonth}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium mb-4"
          >
            Go to Today
          </button>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
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
                  className={`aspect-square p-1 rounded-lg border transition-all ${
                    !isCurrentMonth
                      ? 'opacity-30 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-500 text-white border-blue-500 scale-95'
                      : isToday
                      ? isDarkMode
                        ? 'bg-gray-700 border-blue-400'
                        : 'bg-blue-50 border-blue-400'
                      : day.hasTransactions
                      ? getDayColor(day)
                      : isDarkMode
                      ? 'border-gray-700 hover:bg-gray-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-sm font-medium ${
                      isSelected
                        ? 'text-white'
                        : !isCurrentMonth
                        ? isDarkMode ? 'text-gray-600' : 'text-gray-400'
                        : isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {format(day.date, 'd')}
                    </span>
                    {day.hasTransactions && !isSelected && (
                      <span className={`text-xs font-bold ${
                        day.expenses > 500 ? 'text-red-500' :
                        day.expenses > 200 ? 'text-orange-500' :
                        day.expenses > 0 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        ₱{day.expenses.toFixed(0)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Expense Legend:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500"></div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>₱0 - 200</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500"></div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>₱200 - 500</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500"></div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>₱500+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {format(selectedDate, 'MMMM d, yyyy')}
            </h3>

            {selectedDateExpenses.length > 0 ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-red-50'} p-3 rounded-xl`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Expenses
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ₱{selectedDateExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} p-3 rounded-xl`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="w-4 h-4 text-blue-500" />
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Count
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedDateExpenses.length}
                    </p>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Transactions:
                  </p>
                  {selectedDateExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {expense.description}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {expense.category}
                        </p>
                      </div>
                      <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₱{expense.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
