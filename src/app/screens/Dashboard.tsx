import React, { useMemo, useState } from "react";
import { useApp } from "@/app/context/AppContext";
import {
  Wallet,
  TrendingUp,
  Target,
  Calendar,
  Trash2,
  Bell,
} from "lucide-react";
import {
  CategoryIcon,
  getCategoryColor,
} from "@/app/components/CategoryIcon";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
} from "date-fns";

export const Dashboard: React.FC = () => {
  const {
    user,
    expenses,
    budgets,
    savingsGoals,
    deleteExpense,
  } = useApp();
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<
    string | null
  >(null);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const weekExpenses = expenses.filter((e) =>
      isWithinInterval(new Date(e.date), {
        start: weekStart,
        end: weekEnd,
      }),
    );
    const monthExpenses = expenses.filter((e) =>
      isWithinInterval(new Date(e.date), {
        start: monthStart,
        end: monthEnd,
      }),
    );

    const weekTotal = weekExpenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );
    const monthTotal = monthExpenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );

    // Get budgets
    const weeklyBudget = budgets.find(
      (b) => b.type === "weekly",
    );
    const monthlyBudget = budgets.find(
      (b) => b.type === "monthly",
    );

    const totalSavings = savingsGoals.reduce(
      (sum, g) => sum + g.currentAmount,
      0,
    );
    const totalSavingsGoal = savingsGoals.reduce(
      (sum, g) => sum + g.targetAmount,
      0,
    );

    return {
      weekTotal,
      monthTotal,
      weeklyBudget: weeklyBudget?.amount || 0,
      monthlyBudget: monthlyBudget?.amount || 0,
      totalSavings,
      totalSavingsGoal,
      recentExpenses: expenses
        .slice(0, 5)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime(),
        ),
    };
  }, [expenses, budgets, savingsGoals]);

  const weekProgress =
    stats.weeklyBudget > 0
      ? (stats.weekTotal / stats.weeklyBudget) * 100
      : 0;
  const monthProgress =
    stats.monthlyBudget > 0
      ? (stats.monthTotal / stats.monthlyBudget) * 100
      : 0;
  const savingsProgress =
    stats.totalSavingsGoal > 0
      ? (stats.totalSavings / stats.totalSavingsGoal) * 100
      : 0;

  const handleDeleteExpense = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete);
      toast.success("Expense deleted!");
      setExpenseToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-2xl font-bold">
                Hello, {user?.name}!{" "}
              </h1>
              <p className="text-emerald-100">
                Here's your financial overview
              </p>
            </div>
            <button className="relative p-2 hover:bg-emerald-400/30 rounded-full transition-colors">
              <Bell className="h-6 w-6" />
              {/* Notification badge - shows if there are budget warnings */}
              {((stats.weeklyBudget > 0 && weekProgress > 90) ||
                (stats.monthlyBudget > 0 && monthProgress > 90)) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This Week
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ₱{stats.weekTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-xl">
                <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This Month
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ₱{stats.monthTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Budget Overview */}
        {stats.weeklyBudget > 0 && (
          <Card className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Weekly Budget
                  </h3>
                </div>
                <span
                  className={`text-sm font-medium ${
                    weekProgress > 100
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {weekProgress.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(weekProgress, 100)}
                className="h-2"
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  ₱{stats.weekTotal.toFixed(2)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  of ₱{stats.weeklyBudget.toFixed(2)}
                </span>
              </div>
              {weekProgress > 90 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-2 rounded-lg">
                  ⚠️ You're close to your weekly budget limit!
                </p>
              )}
            </div>
          </Card>
        )}

        {stats.monthlyBudget > 0 && (
          <Card className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Monthly Budget
                  </h3>
                </div>
                <span
                  className={`text-sm font-medium ${
                    monthProgress > 100
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {monthProgress.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(monthProgress, 100)}
                className="h-2"
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  ₱{stats.monthTotal.toFixed(2)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  of ₱{stats.monthlyBudget.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Savings Goals */}
        {savingsGoals.length > 0 && (
          <Card className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Savings Goals
                </h3>
              </div>
              <div className="space-y-3">
                {savingsGoals.slice(0, 2).map((goal) => {
                  const progress =
                    (goal.currentAmount / goal.targetAmount) *
                    100;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {goal.name}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(progress, 100)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          ₱{goal.currentAmount.toFixed(2)}
                        </span>
                        <span>
                          of ₱{goal.targetAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Recent Expenses */}
        <Card className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Recent Expenses
          </h3>
          {stats.recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {stats.recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`p-2 rounded-xl ${getCategoryColor(expense.category)}`}
                    >
                      <CategoryIcon
                        category={expense.category}
                        size={20}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(
                          new Date(expense.date),
                          "MMM dd, yyyy",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₱{expense.amount.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 h-8 w-8 p-0"
                      onClick={() =>
                        handleDeleteExpense(expense.id)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p>No expenses yet</p>
              <p className="text-sm mt-1">
                Tap the + button to add one
              </p>
            </div>
          )}
        </Card>

        {/* Tips */}
        <Card className="p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl shadow-sm border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                Tipid Tip!
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Try packing lunch from home to save ₱50-100 per
                day. That's up to ₱2,000/month!
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Expense Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will
              permanently delete the expense.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteExpense}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};