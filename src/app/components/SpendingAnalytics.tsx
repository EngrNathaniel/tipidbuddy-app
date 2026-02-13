import React, { useMemo } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, isWithinInterval, subDays, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { getCategoryBaseColor } from '@/app/components/CategoryIcon';

const COLORS: Record<string, string> = {
    emerald: '#10b981',
    blue: '#3b82f6',
    purple: '#a855f7',
    yellow: '#eab308',
    gray: '#6b7280',
};

export const SpendingAnalytics: React.FC = () => {
    const { expenses } = useApp();

    // Pie Chart Data - Current Month Expenses by Category
    const pieChartData = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const monthlyExpenses = expenses.filter(e =>
            isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
        );

        const categoryTotals: Record<string, number> = {};

        monthlyExpenses.forEach(e => {
            if (categoryTotals[e.category]) {
                categoryTotals[e.category] += e.amount;
            } else {
                categoryTotals[e.category] = e.amount;
            }
        });

        return Object.entries(categoryTotals).map(([name, value]) => ({
            name,
            value,
            color: COLORS[getCategoryBaseColor(name)] || COLORS.gray,
        }));
    }, [expenses]);

    // Bar Chart Data - Last 7 Days Spending
    const barChartData = useMemo(() => {
        const today = new Date();
        const last7Days = eachDayOfInterval({
            start: subDays(today, 6),
            end: today,
        });

        return last7Days.map(day => {
            const dailyTotal = expenses
                .filter(e => isSameDay(new Date(e.date), day))
                .reduce((sum, e) => sum + e.amount, 0);

            return {
                name: format(day, 'EEE'), // Mon, Tue, etc.
                amount: dailyTotal,
            };
        });
    }, [expenses]);

    if (pieChartData.length === 0 && expenses.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Category Breakdown - Pie Chart */}
            <Card className="border-gray-200 dark:border-white/5 bg-card">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Spending by Category</CardTitle>
                    <CardDescription>Current Month</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `₱${value.toFixed(2)}`}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                            {pieChartData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Daily Spending - Bar Chart */}
            <Card className="border-gray-200 dark:border-white/5 bg-card">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Daily Spending</CardTitle>
                    <CardDescription>Last 7 Days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                                    formatter={(value: number) => `₱${value.toFixed(2)}`}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Bar
                                    dataKey="amount"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
