import React, { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { useTheme } from "@/app/context/ThemeContext";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  User,
  Mail,
  Calendar as CalendarIcon,
  LogOut,
  Target,
  PiggyBank,
  TrendingUp,
  Trash2,
  Award,
  Pencil,
  Moon,
  Sun,
  ShoppingBag,
} from "lucide-react";
import {
  CategoryIcon,
  getCategoryColor,
} from "@/app/components/CategoryIcon";
import { Shop } from "@/app/screens/Shop";
import { CalendarView } from "@/app/screens/CalendarView";
import { toast } from "sonner";
import { format } from "date-fns";

export const Profile: React.FC = () => {
  const {
    user,
    expenses,
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    logout,
    updateProfile,
  } = useApp();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] =
    useState(false);
  const [selectedGoal, setSelectedGoal] = useState<
    string | null
  >(null);
  const [showShop, setShowShop] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [addAmount, setAddAmount] = useState("");

  // Get user's selected icon
  const [selectedIcon, setSelectedIcon] = useState('👤');
  React.useEffect(() => {
    const userSelectedIcon = localStorage.getItem(`tipidbuddy_selected_icon_${user?.id}`);
    if (userSelectedIcon) {
      const SHOP_ITEMS = [
        { id: 'default', emoji: '👤' },
        { id: 'smile', emoji: '😊' },
        { id: 'cat', emoji: '🐱' },
        { id: 'dog', emoji: '🐶' },
        { id: 'panda', emoji: '🐼' },
        { id: 'tiger', emoji: '🐯' },
        { id: 'monkey', emoji: '🐵' },
        { id: 'penguin', emoji: '🐧' },
        { id: 'pizza', emoji: '🍕' },
        { id: 'burger', emoji: '🍔' },
        { id: 'donut', emoji: '🍩' },
        { id: 'icecream', emoji: '🍦' },
        { id: 'sushi', emoji: '🍣' },
        { id: 'fire', emoji: '🔥' },
        { id: 'star', emoji: '⭐' },
        { id: 'rainbow', emoji: '🌈' },
        { id: 'lightning', emoji: '⚡' },
        { id: 'moon', emoji: '🌙' },
        { id: 'crown', emoji: '👑' },
        { id: 'gem', emoji: '💎' },
        { id: 'trophy', emoji: '🏆' },
        { id: 'rocket', emoji: '🚀' },
        { id: 'unicorn', emoji: '🦄' },
      ];
      const icon = SHOP_ITEMS.find(i => i.id === userSelectedIcon);
      if (icon) setSelectedIcon(icon.emoji);
    }
  }, [user?.id]);

  // If showing shop or calendar, render those instead
  if (showShop) {
    return <Shop onBack={() => setShowShop(false)} />;
  }

  if (showCalendar) {
    return <CalendarView onBack={() => setShowCalendar(false)} />;
  }

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const totalSavings = savingsGoals.reduce(
    (sum, g) => sum + g.currentAmount,
    0,
  );

  const handleAddGoal = () => {
    if (!goalName.trim() || !goalAmount || !goalDeadline) {
      toast.error("Please fill in all fields");
      return;
    }

    addSavingsGoal({
      name: goalName.trim(),
      targetAmount: parseFloat(goalAmount),
      deadline: new Date(goalDeadline).toISOString(),
    });

    toast.success("Savings goal created! 🎯");
    setGoalName("");
    setGoalAmount("");
    setGoalDeadline("");
    setGoalDialogOpen(false);
  };

  const handleAddMoney = () => {
    if (
      !selectedGoal ||
      !addAmount ||
      parseFloat(addAmount) <= 0
    ) {
      toast.error("Please enter a valid amount");
      return;
    }

    const goal = savingsGoals.find((g) => g.id === selectedGoal);
    if (goal) {
      updateSavingsGoal(goal.id, goal.currentAmount + parseFloat(addAmount));
      toast.success("Money added to savings! 💰");
      setAddAmount("");
      setAddMoneyDialogOpen(false);
      setSelectedGoal(null);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    await updateProfile(newName.trim());
    setEditProfileOpen(false);
  };


  // Calculate streak (simplified - just count days with expenses)
  const streak = new Set(
    expenses.map((e) => format(new Date(e.date), "yyyy-MM-dd")),
  ).size;

  return (
    <div className="min-h-screen bg-background pb-28 pt-8">
      {/* Header */}
      <div className="max-w-lg mx-auto px-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account and settings
        </p>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-6">
        {/* User Card */}
        <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-4xl border border-primary/20">
            {selectedIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user?.name}
              </h2>
              <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setNewName(user?.name || "")}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-muted-foreground transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-md bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Update your display name. This will be visible in your savings groups.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-900 dark:text-white">Display Name</Label>
                      <Input
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Your Name"
                        className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                      />
                    </div>
                    <Button
                      onClick={handleUpdateProfile}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl"
                    >
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>


        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowShop(true)}
            className="h-20 bg-card hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm transition-all"
          >
            <ShoppingBag className="h-6 w-6 text-purple-500" />
            <span className="text-sm font-medium">Icon Shop</span>
          </Button>
          <Button
            onClick={() => setShowCalendar(true)}
            className="h-20 bg-card hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm transition-all"
          >
            <CalendarIcon className="h-6 w-6 text-blue-500" />
            <span className="text-sm font-medium">Calendar</span>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 bg-card border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm text-center">
            <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ₱{totalExpenses.toFixed(0)}
            </p>
          </Card>

          <Card className="p-4 bg-card border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm text-center">
            <PiggyBank className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Saved</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ₱{totalSavings.toFixed(0)}
            </p>
          </Card>

          <Card className="p-4 bg-card border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm text-center">
            <Award className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {streak} days
            </p>
          </Card>
        </div>

        {/* Savings Goals */}
        <Card className="p-6 bg-card border border-gray-200 dark:border-white/5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Savings Goals
            </h3>
            <Dialog
              open={goalDialogOpen}
              onOpenChange={setGoalDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                >
                  <Target className="mr-1 h-4 w-4" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl max-w-md bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <DialogHeader>
                  <DialogTitle>Create Savings Goal</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Set a new savings goal to track your progress.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-name" className="text-gray-900 dark:text-white">Goal Name</Label>
                    <Input
                      id="goal-name"
                      placeholder="e.g., New Phone"
                      value={goalName}
                      onChange={(e) =>
                        setGoalName(e.target.value)
                      }
                      className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal-amount" className="text-gray-900 dark:text-white">
                      Target Amount (₱)
                    </Label>
                    <Input
                      id="goal-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={goalAmount}
                      onChange={(e) =>
                        setGoalAmount(e.target.value)
                      }
                      className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal-deadline" className="text-gray-900 dark:text-white">
                      Deadline
                    </Label>
                    <Input
                      id="goal-deadline"
                      type="date"
                      value={goalDeadline}
                      onChange={(e) =>
                        setGoalDeadline(e.target.value)
                      }
                      className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>

                  <Button
                    onClick={handleAddGoal}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl"
                  >
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {savingsGoals.length > 0 ? (
            <div className="space-y-4">
              {savingsGoals.map((goal) => {
                const progress =
                  (goal.currentAmount / goal.targetAmount) *
                  100;
                return (
                  <div
                    key={goal.id}
                    className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {goal.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Deadline:{" "}
                          {format(
                            new Date(goal.deadline),
                            "MMM dd, yyyy",
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          deleteSavingsGoal(goal.id);
                          toast.success("Goal deleted");
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          ₱{(goal.currentAmount || 0).toFixed(2)} / ₱
                          {(goal.targetAmount || 0).toFixed(2)}
                        </span>
                        <span className="text-primary font-semibold">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedGoal(goal.id);
                        setAddMoneyDialogOpen(true);
                      }}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl h-10"
                    >
                      Add Money
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No savings goals yet</p>
              <p className="text-xs mt-1">
                Create one to start saving!
              </p>
            </div>
          )}
        </Card>

        {/* Add Money Dialog */}
        <Dialog
          open={addMoneyDialogOpen}
          onOpenChange={setAddMoneyDialogOpen}
        >
          <DialogContent className="rounded-3xl max-w-md bg-card border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <DialogHeader>
              <DialogTitle>Add Money to Savings</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add money to your selected savings goal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="add-amount" className="text-gray-900 dark:text-white">Amount (₱)</Label>
                <Input
                  id="add-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="h-12 rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50"
                />
              </div>

              <Button
                onClick={handleAddMoney}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl"
              >
                Add to Savings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Account Info */}
        <Card className="p-6 bg-card border border-gray-200 dark:border-white/5 rounded-3xl shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Member Since
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.createdAt &&
                    format(
                      new Date(user.createdAt),
                      "MMMM dd, yyyy",
                    )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="p-6 bg-card border border-gray-200 dark:border-white/5 rounded-3xl shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Appearance
          </h3>
          <Button
            onClick={toggleDarkMode}
            variant="outline"
            className="w-full h-14 rounded-xl flex items-center justify-between bg-background border-gray-200 dark:border-white/5 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-white/20'} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </Button>
        </Card>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 rounded-xl text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground pb-4">
          <p>TipidBuddy v1.0.0</p>
          <p className="mt-1">Your Budget, Your Buddy </p>
        </div>
      </div>
    </div>
  );
};