import React, { useState, useMemo } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Progress } from '@/app/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { PlusCircle, Wallet, TrendingUp, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const BudgetScreen: React.FC = () => {
  const { budgets, expenses, addBudget, updateBudget, deleteBudget } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [budgetType, setBudgetType] = useState<'weekly' | 'monthly'>('weekly');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Calculate spending
  const stats = useMemo(() => {
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

    const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { weekTotal, monthTotal };
  }, [expenses]);

  const weeklyBudget = budgets.find(b => b.type === 'weekly');
  const monthlyBudget = budgets.find(b => b.type === 'monthly');

  const weekProgress = weeklyBudget ? (stats.weekTotal / weeklyBudget.amount) * 100 : 0;
  const monthProgress = monthlyBudget ? (stats.monthTotal / monthlyBudget.amount) * 100 : 0;

  const handleSetBudget = () => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const now = new Date();
    const existingBudget = budgets.find(b => b.type === budgetType);

    if (existingBudget) {
      updateBudget(existingBudget.id, {
        amount: parseFloat(budgetAmount),
      });
      toast.success(`${budgetType === 'weekly' ? 'Weekly' : 'Monthly'} budget updated!`);
    } else {
      const startDate = budgetType === 'weekly' ? startOfWeek(now) : startOfMonth(now);
      const endDate = budgetType === 'weekly' ? endOfWeek(now) : endOfMonth(now);

      addBudget({
        type: budgetType,
        amount: parseFloat(budgetAmount),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      toast.success(`${budgetType === 'weekly' ? 'Weekly' : 'Monthly'} budget set!`);
    }

    setBudgetAmount('');
    setDialogOpen(false);
  };

  const handleDeleteBudget = (budgetId: string, type: 'weekly' | 'monthly') => {
    setBudgetToDelete(budgetId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBudget = () => {
    if (budgetToDelete) {
      deleteBudget(budgetToDelete);
      const budgetTypeLabel = budgets.find(b => b.id === budgetToDelete)?.type === 'weekly' ? 'Weekly' : 'Monthly';
      toast.success(`${budgetTypeLabel} budget reset!`);
      setBudgetToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Budget Manager</h1>
          <p className="text-purple-100 mt-1">Control your spending</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Add Budget Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white h-14 rounded-2xl shadow-sm">
              <PlusCircle className="mr-2 h-5 w-5" />
              Set Budget Limit
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle>Set Budget Limit</DialogTitle>
              <DialogDescription>
                Set your weekly or monthly budget limit to track your spending.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Tabs value={budgetType} onValueChange={(v) => setBudgetType(v as 'weekly' | 'monthly')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="budget-amount">
                  {budgetType === 'weekly' ? 'Weekly' : 'Monthly'} Budget (₱)
                </Label>
                <Input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <Button 
                onClick={handleSetBudget}
                className="w-full bg-purple-500 hover:bg-purple-600 h-12 rounded-xl"
              >
                Set Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Budget Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Budget</DialogTitle>
              <DialogDescription>
                Are you sure you want to reset your budget? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Button 
                onClick={confirmDeleteBudget}
                className="w-full bg-red-500 hover:bg-red-600 h-12 rounded-xl"
              >
                Reset Budget
              </Button>
              <Button 
                onClick={() => setDeleteDialogOpen(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 h-12 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Weekly Budget */}
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Weekly Budget</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This week's spending</p>
                </div>
              </div>
              {weeklyBudget && (
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    weekProgress > 100 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {weekProgress.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>

            {weeklyBudget ? (
              <>
                <Progress value={Math.min(weekProgress, 100)} className="h-3" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₱{stats.weekTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">₱{weeklyBudget.amount.toFixed(2)}</p>
                  </div>
                </div>

                {weekProgress > 100 && (
                  <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 p-3 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">Budget Exceeded!</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        You've spent ₱{(stats.weekTotal - weeklyBudget.amount).toFixed(2)} over your budget.
                      </p>
                    </div>
                  </div>
                )}

                {weekProgress > 80 && weekProgress <= 100 && (
                  <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Almost at limit!</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        You have ₱{(weeklyBudget.amount - stats.weekTotal).toFixed(2)} left this week.
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => handleDeleteBudget(weeklyBudget.id, 'weekly')}
                  className="w-full bg-red-500 hover:bg-red-600 h-12 rounded-xl"
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Reset Budget
                </Button>
              </>
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No weekly budget set</p>
                <p className="text-xs mt-1">Tap "Set Budget Limit" to get started</p>
              </div>
            )}
          </div>
        </Card>

        {/* Monthly Budget */}
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Monthly Budget</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This month's spending</p>
                </div>
              </div>
              {monthlyBudget && (
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    monthProgress > 100 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {monthProgress.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>

            {monthlyBudget ? (
              <>
                <Progress value={Math.min(monthProgress, 100)} className="h-3" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₱{stats.monthTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">₱{monthlyBudget.amount.toFixed(2)}</p>
                  </div>
                </div>

                {monthProgress > 100 && (
                  <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 p-3 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">Budget Exceeded!</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        You've spent ₱{(stats.monthTotal - monthlyBudget.amount).toFixed(2)} over your budget.
                      </p>
                    </div>
                  </div>
                )}

                {monthProgress > 80 && monthProgress <= 100 && (
                  <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Almost at limit!</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        You have ₱{(monthlyBudget.amount - stats.monthTotal).toFixed(2)} left this month.
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => handleDeleteBudget(monthlyBudget.id, 'monthly')}
                  className="w-full bg-red-500 hover:bg-red-600 h-12 rounded-xl"
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Reset Budget
                </Button>
              </>
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No monthly budget set</p>
                <p className="text-xs mt-1">Tap "Set Budget Limit" to get started</p>
              </div>
            )}
          </div>
        </Card>

        {/* Budgeting Tips */}
        <Card className="p-5 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl shadow-sm border-purple-200 dark:border-purple-800">
          <div className="flex gap-3">
            <div className="text-2xl">📊</div>
            <div>
              <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Budget Tips</h4>
              <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
                <li>• Follow the 50/30/20 rule: needs, wants, savings</li>
                <li>• Review your budget weekly to stay on track</li>
                <li>• Adjust limits based on your actual spending patterns</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};