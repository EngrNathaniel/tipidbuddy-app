import React, { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  CategoryIcon,
  getCategoryColor,
} from "@/app/components/CategoryIcon";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const AddExpense: React.FC = () => {
  const { addExpense } = useApp();
  const categories: Array<
    "Food" | "Transport" | "School" | "Entertainment" | "Others"
  > = [
    "Food",
    "Transport",
    "School",
    "Entertainment",
    "Others",
  ];

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<
    "Food" | "Transport" | "School" | "Entertainment" | "Others"
  >("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Please add a description");
      return;
    }

    addExpense({
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      date: date.toISOString(),
    });

    toast.success("Expense added successfully! 🎉");

    // Reset form
    setAmount("");
    setDescription("");
    setCategory("Food");
    setDate(new Date());
  };

  return (
    <div className="min-full overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Add Expense</h1>
          <p className="text-blue-100 mt-1">
            Track your spending
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
                  ₱
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-14 text-2xl font-bold rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      category === cat
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`p-3 rounded-xl ${getCategoryColor(cat)}`}
                      >
                        <CategoryIcon
                          category={cat}
                          size={24}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {cat}
                      </span>
                      {category === cat && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Lunch at cafeteria"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-20 rounded-xl resize-none"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover
                open={calendarOpen}
                onOpenChange={setCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 justify-start text-left font-normal rounded-xl"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setDate(newDate);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 rounded-xl text-base"
            >
              Add Expense
            </Button>
          </form>
        </Card>

        {/* Quick Tips */}
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-sm">
          <p className="text-blue-800 dark:text-blue-300 font-medium mb-1">
            💡 Quick Tip
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            Add expenses right away to maintain accurate
            tracking and better insights!
          </p>
        </div>
      </div>
    </div>
  );
};