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
  const { budgets, expenses, setBudget, updateBudget, deleteBudget } = useApp();
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

      setBudget({
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
    <div className="min-h-screen bg-background pb-28 pt-8">
      {/* Header */}
      <div className="max-w-lg mx-auto px-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
          Budget Manager
        </h1>
        <p className="text-muted-foreground text-sm">
          Control your spending
        </p>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-6">
        {/* Add Budget Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl shadow-sm font-medium text-base">
              <PlusCircle className="mr-2 h-5 w-5" />
              Set Budget Limit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-3xl">
            <DialogHeader>
              <DialogTitle>Set Budget Limit</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Set your weekly or monthly budget limit to track your spending.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Tabs value={budgetType} onValueChange={(v) => setBudgetType(v as 'weekly' | 'monthly')}>
                <TabsList className="grid w-full grid-cols-2 bg-secondary text-muted-foreground rounded-xl p-1">
                  <TabsTrigger
                    value="weekly"
                    className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    Weekly
                  </TabsTrigger>
                  <TabsTrigger
                    value="monthly"
                    className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    Monthly
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="budget-amount" className="text-gray-900 dark:text-white">
                  {budgetType === 'weekly' ? 'Weekly' : 'Monthly'} Budget (₱)
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                    ₱
                  </span>
                  <Input
                    id="budget-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="pl-8 h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                  />
                </div>
              </div>

              <Button
                onClick={handleSetBudget}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl"
              >
                Set Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Budget Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-3xl">
            <DialogHeader>
              <DialogTitle>Reset Budget</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Are you sure you want to reset your budget? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteBudget}
              >
                Reset Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Weekly Budget */}
        <div className="p-6 bg-card border border-gray-200 dark:border-white/5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-xl text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Weekly Budget</h3>
                <p className="text-sm text-muted-foreground">This week's spending</p>
              </div>
            </div>
            {weeklyBudget && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${weekProgress > 100 ? 'text-destructive' : 'text-gray-900 dark:text-white'
                  }`}>
                  {weekProgress.toFixed(0)}%
                </p>
              </div>
            )}
          </div>

          {weeklyBudget ? (
            <>
              <Progress value={Math.min(weekProgress, 100)} className="h-3 bg-secondary/50" indicatorClassName={weekProgress > 100 ? 'bg-destructive' : 'bg-primary'} />
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₱{stats.weekTotal.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-xl font-semibold text-gray-900/80 dark:text-white/80">₱{weeklyBudget.amount.toFixed(2)}</p>
                </div>
              </div>

              {weekProgress > 100 && (
                <div className="flex items-start gap-2 bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Budget Exceeded!</p>
                    <p className="text-xs text-destructive/80 mt-1">
                      You've spent ₱{(stats.weekTotal - weeklyBudget.amount).toFixed(2)} over your budget.
                    </p>
                  </div>
                </div>
              )}

              {weekProgress > 80 && weekProgress <= 100 && (
                <div className="flex items-start gap-2 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">Almost at limit!</p>
                    <p className="text-xs text-yellow-500/80 mt-1">
                      You have ₱{(weeklyBudget.amount - stats.weekTotal).toFixed(2)} left this week.
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => handleDeleteBudget(weeklyBudget.id, 'weekly')}
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-12 rounded-xl"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Reset Budget
              </Button>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No weekly budget set</p>
              <p className="text-xs mt-1 text-muted-foreground/50">Tap "Set Budget Limit" to get started</p>
            </div>
          )}
        </div>

        {/* Monthly Budget */}
        <div className="p-6 bg-card border border-gray-200 dark:border-white/5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/20 rounded-xl text-accent">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Monthly Budget</h3>
                <p className="text-sm text-muted-foreground">This month's spending</p>
              </div>
            </div>
            {monthlyBudget && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${monthProgress > 100 ? 'text-destructive' : 'text-gray-900 dark:text-white'
                  }`}>
                  {monthProgress.toFixed(0)}%
                </p>
              </div>
            )}
          </div>

          {monthlyBudget ? (
            <>
              <Progress value={Math.min(monthProgress, 100)} className="h-3 bg-secondary/50" indicatorClassName={monthProgress > 100 ? 'bg-destructive' : 'bg-accent'} />
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₱{stats.monthTotal.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-xl font-semibold text-gray-900/80 dark:text-white/80">₱{monthlyBudget.amount.toFixed(2)}</p>
                </div>
              </div>

              {monthProgress > 100 && (
                <div className="flex items-start gap-2 bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Budget Exceeded!</p>
                    <p className="text-xs text-destructive/80 mt-1">
                      You've spent ₱{(stats.monthTotal - monthlyBudget.amount).toFixed(2)} over your budget.
                    </p>
                  </div>
                </div>
              )}

              {monthProgress > 80 && monthProgress <= 100 && (
                <div className="flex items-start gap-2 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">Almost at limit!</p>
                    <p className="text-xs text-yellow-500/80 mt-1">
                      You have ₱{(monthlyBudget.amount - stats.monthTotal).toFixed(2)} left this month.
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => handleDeleteBudget(monthlyBudget.id, 'monthly')}
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-12 rounded-xl"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Reset Budget
              </Button>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No monthly budget set</p>
              <p className="text-xs mt-1 text-muted-foreground/50">Tap "Set Budget Limit" to get started</p>
            </div>
          )}
        </div>

        {/* Budgeting Tips */}
        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-4">
          <div className="p-2 rounded-full bg-primary/20 text-primary mt-0.5">
            <div className="w-4 h-4 flex items-center justify-center">💡</div>
          </div>
          <div>
            <h4 className="font-semibold text-primary text-sm mb-1">Budget Tips</h4>
            <ul className="text-xs text-primary/80 leading-relaxed space-y-1">
              <li>• Follow the 50/30/20 rule: needs, wants, savings</li>
              <li>• Review your budget weekly to stay on track</li>
              <li>• Adjust limits based on your actual spending patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};