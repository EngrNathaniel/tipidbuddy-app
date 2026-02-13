import React, { useMemo, useState } from "react";
import { useApp } from "@/app/context/AppContext";
import {
  Wallet,
  Calendar,
  Trash2,
  Bell,
  ArrowUpRight,
} from "lucide-react";
import {
  CategoryIcon,
  getCategoryColor,
  getCategoryBaseColor,
} from "@/app/components/CategoryIcon";
import { SpendingAnalytics } from "@/app/components/SpendingAnalytics";
import { Card } from "@/app/components/ui/card";
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
    deleteExpense,
  } = useApp();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

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

    // Check budget limits
    const weeklyBudget = budgets.find(b => b.type === 'weekly');
    const monthlyBudget = budgets.find(b => b.type === 'monthly');

    const isWeeklyExceeded = weeklyBudget ? weekTotal > weeklyBudget.amount : false;
    const isMonthlyExceeded = monthlyBudget ? monthTotal > monthlyBudget.amount : false;
    const hasNotification = isWeeklyExceeded || isMonthlyExceeded;

    return {
      weekTotal,
      monthTotal,
      hasNotification,
      recentExpenses: expenses
        .slice(0, 5)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime(),
        ),
    };
  }, [expenses, budgets]);

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
    <div className="min-h-screen bg-background pb-28 pt-8">
      {/* Header */}
      <div className="max-w-lg mx-auto px-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
              Hello, {user?.name || "Natty"}!
            </h1>
            <p className="text-muted-foreground text-sm">
              Here's your financial overview
            </p>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-card/50 border border-gray-200 dark:border-white/5 flex items-center justify-center hover:bg-card/80 transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {stats.hasNotification && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card shadow-sm animate-pulse" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Weekly Stat */}
          <div className="p-4 rounded-3xl bg-card border border-gray-200 dark:border-white/5 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between relative z-10">
              <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">This Week</span>
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">₱{stats.weekTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            {/* Decorative BG Gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          </div>

          {/* Monthly Stat */}
          <div className="p-4 rounded-3xl bg-card border border-gray-200 dark:border-white/5 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between relative z-10">
              <div className="p-2.5 rounded-xl bg-accent/20 text-accent">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">This Month</span>
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">₱{stats.monthTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            {/* Decorative BG Gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Spending Analytics */}
        <SpendingAnalytics />

        {/* Recent Expenses List */}
        <div className="bg-card rounded-3xl border border-gray-200 dark:border-white/5 p-6 min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Expenses</h3>

          {stats.recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {stats.recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center bg-${getCategoryBaseColor(expense.category)}-500/10 text-${getCategoryBaseColor(expense.category)}-600 dark:text-${getCategoryBaseColor(expense.category)}-400`}
                    >
                      <CategoryIcon
                        category={expense.category}
                        size={18}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {expense.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      -₱{expense.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <p className="text-muted-foreground mb-2">No expenses yet</p>
              <p className="text-xs text-muted-foreground/50">
                Tap the + button to add one
              </p>
            </div>
          )}
        </div>

        {/* Tipid Tip */}
        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-4">
          <div className="p-2 rounded-full bg-primary/20 text-primary mt-0.5">
            <div className="w-4 h-4 flex items-center justify-center">💡</div>
          </div>
          <div>
            <h4 className="font-semibold text-primary text-sm mb-1">Tipid Tip!</h4>
            <p className="text-xs text-primary/80 leading-relaxed">
              Use the 50/30/20 rule: needs, wants, and savings.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Expense Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px] bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. This will
              permanently delete the expense.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
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