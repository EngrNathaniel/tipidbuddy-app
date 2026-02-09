import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, apiCall } from '@/app/utils/supabase';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: 'Food' | 'Transport' | 'School' | 'Entertainment' | 'Others';
  description: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  type: 'weekly' | 'monthly';
  amount: number;
  category?: string;
  startDate: string;
  endDate: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

interface AppContextType {
  user: User | null;
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'currentAmount'>) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addToSavings: (goalId: string, amount: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load data from localStorage on mount and check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User has an active Supabase session
        try {
          const userData = await apiCall('/auth/session');
          if (userData.user) {
            setUser(userData.user);
            setIsAuthenticated(true);
            setAccessToken(session.access_token);
            
            // Load user data from localStorage
            const storedExpenses = localStorage.getItem('tipidbuddy_expenses');
            const storedBudgets = localStorage.getItem('tipidbuddy_budgets');
            const storedGoals = localStorage.getItem('tipidbuddy_goals');

            if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
            if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
            if (storedGoals) setSavingsGoals(JSON.parse(storedGoals));
          }
        } catch (error) {
          console.error('Failed to get session:', error);
        }
      } else {
        // Fallback to localStorage-based auth for backward compatibility
        const storedUser = localStorage.getItem('tipidbuddy_user');
        const storedExpenses = localStorage.getItem('tipidbuddy_expenses');
        const storedBudgets = localStorage.getItem('tipidbuddy_budgets');
        const storedGoals = localStorage.getItem('tipidbuddy_goals');

        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
        if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
        if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
        if (storedGoals) setSavingsGoals(JSON.parse(storedGoals));
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAccessToken(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setAccessToken(null);
        setExpenses([]);
        setBudgets([]);
        setSavingsGoals([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('tipidbuddy_user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tipidbuddy_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('tipidbuddy_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('tipidbuddy_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  // Auth functions
  const login = async (email: string, password: string) => {
    try {
      // First, try to sign in with Supabase directly in the frontend
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.session && authData.user) {
        // Get user profile from backend
        const userData = await apiCall('/auth/session');
        
        setUser(userData.user || {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || 'User',
          createdAt: authData.user.created_at,
        });
        setIsAuthenticated(true);
        setAccessToken(authData.session.access_token);

        // Load user-specific data from localStorage
        const userExpenses = JSON.parse(localStorage.getItem('tipidbuddy_expenses') || '[]')
          .filter((e: Expense) => e.userId === authData.user.id);
        const userBudgets = JSON.parse(localStorage.getItem('tipidbuddy_budgets') || '[]')
          .filter((b: Budget) => b.userId === authData.user.id);
        const userGoals = JSON.parse(localStorage.getItem('tipidbuddy_goals') || '[]')
          .filter((g: SavingsGoal) => g.userId === authData.user.id);

        setExpenses(userExpenses);
        setBudgets(userBudgets);
        setSavingsGoals(userGoals);
        return;
      }
    } catch (error: any) {
      console.log('Supabase login failed, trying localStorage fallback:', error.message);
      // Fallback to localStorage auth
      const storedUsers = JSON.parse(localStorage.getItem('tipidbuddy_users') || '[]');
      const foundUser = storedUsers.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        setIsAuthenticated(true);
        
        // Load user-specific data
        const userExpenses = JSON.parse(localStorage.getItem('tipidbuddy_expenses') || '[]')
          .filter((e: Expense) => e.userId === foundUser.id);
        const userBudgets = JSON.parse(localStorage.getItem('tipidbuddy_budgets') || '[]')
          .filter((b: Budget) => b.userId === foundUser.id);
        const userGoals = JSON.parse(localStorage.getItem('tipidbuddy_goals') || '[]')
          .filter((g: SavingsGoal) => g.userId === foundUser.id);
        
        setExpenses(userExpenses);
        setBudgets(userBudgets);
        setSavingsGoals(userGoals);
      } else {
        throw new Error('Invalid email or password');
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Call backend to create user
      const data = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      if (data.user) {
        // Now sign in with Supabase in the frontend to establish session
        await login(email, password);
      }
    } catch (error: any) {
      console.log('Supabase registration failed, using localStorage fallback:', error.message);
      // Fallback to localStorage registration
      const storedUsers = JSON.parse(localStorage.getItem('tipidbuddy_users') || '[]');
      
      if (storedUsers.some((u: any) => u.email === email)) {
        throw new Error('Email already registered');
      }

      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      };

      storedUsers.push(newUser);
      localStorage.setItem('tipidbuddy_users', JSON.stringify(storedUsers));

      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    setExpenses([]);
    setBudgets([]);
    setSavingsGoals([]);
    localStorage.removeItem('tipidbuddy_user');
  };

  // Expense functions
  const addExpense = (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    
    const newExpense: Expense = {
      ...expense,
      id: `expense_${Date.now()}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    
    setExpenses([...expenses, newExpense]);
  };

  const updateExpense = (id: string, updatedExpense: Partial<Expense>) => {
    setExpenses(expenses.map(exp => 
      exp.id === id ? { ...exp, ...updatedExpense } : exp
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  // Budget functions
  const addBudget = (budget: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) return;
    
    const newBudget: Budget = {
      ...budget,
      id: `budget_${Date.now()}`,
      userId: user.id,
    };
    
    setBudgets([...budgets, newBudget]);
  };

  const updateBudget = (id: string, updatedBudget: Partial<Budget>) => {
    setBudgets(budgets.map(budget => 
      budget.id === id ? { ...budget, ...updatedBudget } : budget
    ));
  };

  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter(budget => budget.id !== id));
  };

  // Savings goal functions
  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'currentAmount'>) => {
    if (!user) return;
    
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
      userId: user.id,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
    };
    
    setSavingsGoals([...savingsGoals, newGoal]);
  };

  const updateSavingsGoal = (id: string, updatedGoal: Partial<SavingsGoal>) => {
    setSavingsGoals(savingsGoals.map(goal => 
      goal.id === id ? { ...goal, ...updatedGoal } : goal
    ));
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals(savingsGoals.filter(goal => goal.id !== id));
  };

  const addToSavings = (goalId: string, amount: number) => {
    setSavingsGoals(savingsGoals.map(goal => 
      goal.id === goalId 
        ? { ...goal, currentAmount: goal.currentAmount + amount }
        : goal
    ));
  };

  const value: AppContextType = {
    user,
    expenses,
    budgets,
    savingsGoals,
    isAuthenticated,
    accessToken,
    login,
    register,
    logout,
    addExpense,
    updateExpense,
    deleteExpense,
    addBudget,
    updateBudget,
    deleteBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addToSavings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};