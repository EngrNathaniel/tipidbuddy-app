import React, { useMemo } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, isWithinInterval, format, subDays } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { expenses } = useApp();

  const analytics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const weekExpenses = expenses.filter(e => 
      isWithinInterval(new Date(e.date), { start: weekStart, end: weekEnd })
    );
    const monthExpenses = expenses.filter(e => 
      isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
    );

    // Category breakdown for this month
    const categoryData = monthExpenses.reduce((acc, expense) => {
      const existing = acc.find(item => item.name === expense.category);
      if (existing) {
        existing.value += expense.amount;
      } else {
        acc.push({ name: expense.category, value: expense.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

    // Daily spending for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const dayExpenses = expenses.filter(e => 
        format(new Date(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        date: format(date, 'EEE'),
        amount: total,
      };
    });

    const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgDaily = monthExpenses.length > 0 ? monthTotal / new Date().getDate() : 0;

    return {
      categoryData,
      last7Days,
      weekTotal,
      monthTotal,
      avgDaily,
    };
  }, [expenses]);

  const COLORS = {
    Food: '#10B981',
    Transport: '#3B82F6',
    School: '#8B5CF6',
    Entertainment: '#FBBF24',
    Others: '#6B7280',
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border dark:border-gray-700">
          <p className="font-semibold dark:text-white">{payload[0].name}</p>
          <p className="text-emerald-600 dark:text-emerald-400">₱{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-yellow-100 mt-1">Understand your spending</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="text-center">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₱{analytics.weekTotal.toFixed(0)}</p>
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="text-center">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₱{analytics.monthTotal.toFixed(0)}</p>
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="text-center">
              <TrendingDown className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg/Day</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₱{analytics.avgDaily.toFixed(0)}</p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <Tabs defaultValue="category" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="category">By Category</TabsTrigger>
              <TabsTrigger value="daily">Daily Trend</TabsTrigger>
            </TabsList>

            <TabsContent value="category" className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Spending by Category</h3>
              {analytics.categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {analytics.categoryData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                          />
                          <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">₱{item.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <p>No data yet</p>
                  <p className="text-sm mt-1">Start tracking expenses to see insights</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="daily" className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Last 7 Days</h3>
              {analytics.last7Days.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.last7Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`₱${value.toFixed(2)}`, 'Spent']}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Bar dataKey="amount" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <p>No spending data</p>
                  <p className="text-sm mt-1">Add expenses to see your daily trend</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Insights */}
        <Card className="p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl shadow-sm border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Spending Insights</h4>
              {analytics.categoryData.length > 0 ? (
                <div className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
                  <p>• Your top category: <span className="font-semibold">
                    {analytics.categoryData.sort((a, b) => b.value - a.value)[0]?.name}
                  </span></p>
                  <p>• Daily average: <span className="font-semibold">₱{analytics.avgDaily.toFixed(2)}</span></p>
                  {analytics.avgDaily > 200 && (
                    <p className="text-yellow-900 dark:text-yellow-300 font-medium mt-2">
                      💰 Try to reduce daily spending by ₱50 to save ₱1,500/month!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  Start adding expenses to get personalized insights about your spending habits.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};