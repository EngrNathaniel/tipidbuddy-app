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
  getCategoryBaseColor,
} from "@/app/components/CategoryIcon";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { CalendarIcon, PlusCircle } from "lucide-react";
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
    <div className="min-h-screen bg-background pb-28 pt-8">
      {/* Header */}
      <div className="max-w-lg mx-auto px-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
          Add Expense
        </h1>
        <p className="text-muted-foreground text-sm">
          Track your spending
        </p>
      </div>

      <div className="max-w-lg mx-auto px-6">
        <div className="p-6 bg-card border border-gray-200 dark:border-white/5 rounded-3xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-900 dark:text-white">Amount (₱)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                  ₱
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-14 text-2xl font-bold rounded-xl bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label className="text-gray-900 dark:text-white">Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-2xl border transition-all ${category === cat
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 dark:border-white/5 bg-background hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/10"
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`p-2.5 rounded-xl bg-${getCategoryBaseColor(cat)}-500/10 text-${getCategoryBaseColor(cat)}-600 dark:text-${getCategoryBaseColor(cat)}-400`}
                      >
                        <CategoryIcon
                          category={cat}
                          size={20}
                        />
                      </div>
                      <span className={`text-xs font-medium whitespace-normal text-center w-full leading-tight ${category === cat ? 'text-primary' : 'text-muted-foreground'}`}>
                        {cat}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900 dark:text-white">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Lunch at cafeteria"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-20 rounded-xl resize-none bg-background border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Date</Label>
              <Popover
                open={calendarOpen}
                onOpenChange={setCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 p-0 bg-transparent border-0 hover:bg-transparent"
                  >
                    <div className="flex items-center justify-start w-full h-12 px-4 text-left font-normal rounded-xl bg-background border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "PPP")}
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-card border-gray-200 dark:border-white/10 text-foreground"
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
                    className="bg-card text-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl text-base"
            >
              Add Expense
            </Button>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
          <div className="p-2 rounded-full bg-blue-500/20 text-blue-500 mt-0.5">
            <div className="w-4 h-4 flex items-center justify-center">💡</div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-500 text-sm mb-1">Quick Tip</h4>
            <p className="text-xs text-blue-400/80 leading-relaxed">
              Add expenses right away to maintain accurate tracking and better insights!
            </p>
          </div>
        </div>
      </div >
    </div >
  );
};