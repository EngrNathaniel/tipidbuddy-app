import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, API_BASE, apiCall } from '@/app/utils/supabase';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { toast } from 'sonner';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isOffline?: boolean;
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
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId'>) => Promise<void>;
  updateSavingsGoal: (id: string, amount: number) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load basic data from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('tipidbuddy_user');
    const storedToken = localStorage.getItem('tipidbuddy_token');
    const storedExpenses = localStorage.getItem('tipidbuddy_expenses');
    const storedBudgets = localStorage.getItem('tipidbuddy_budgets');
    const storedGoals = localStorage.getItem('tipidbuddy_goals');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }

    if (storedToken) {
      setAccessToken(JSON.parse(storedToken));
    }
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
    if (storedGoals) setSavingsGoals(JSON.parse(storedGoals));

    // Also check for existing Supabase session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AUTH EVENT:', event, session?.access_token ? 'Has Token' : 'No Token');

      if (event === 'SIGNED_IN' && session) {
        handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('SDK emitted SIGNED_OUT. Ignoring to prevent auto-logout loop on unstable network.');
        // setUser(null);
        // setIsAuthenticated(false);
        // setExpenses([]);
        // setBudgets([]);
        // setSavingsGoals([]);
        // setAccessToken(null);
        // localStorage.removeItem('tipidbuddy_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        handleSession(session);
      }
    } catch (error) {
      console.error("Session check error:", error);
    }
  };

  const handleSession = (session: any) => {
    setAccessToken(session.access_token);
    // Persist token manually to survive SDK failures
    if (session.access_token) {
      localStorage.setItem('tipidbuddy_token', JSON.stringify(session.access_token));
    }

    const authUser = session.user;
    if (authUser) {
      // Try to recover name from multiple sources
      let userName = authUser.user_metadata?.name;

      if (!userName || userName === 'User') {
        // Check if we already have a name in state for this user
        if (user?.id === authUser.id && user.name && user.name !== 'User') {
          userName = user.name;
        } else              // Check local storage
          try {
            // 1. Check current session storage
            const localUser = localStorage.getItem('tipidbuddy_user');
            if (localUser) {
              const parsed = JSON.parse(localUser);
              if (parsed.id === authUser.id && parsed.name && parsed.name !== 'User') {
                userName = parsed.name;
              }
            }

            // 2. Check full user registry (offline database)
            if (!userName || userName === 'User') {
              const allUsers = JSON.parse(localStorage.getItem('tipidbuddy_users') || '[]');
              const found = allUsers.find((u: any) => u.email === authUser.email);
              if (found && found.name) {
                userName = found.name;
              }
            }
          } catch (e) {
            console.warn('Could not recover local name');
          }
      }

      const userObj = {
        id: authUser.id,
        email: authUser.email || '',
        name: userName || 'User',
        createdAt: authUser.created_at
      };
      // Only update if different
      setUser(prev => prev?.id === userObj.id ? prev : userObj);
      setIsAuthenticated(true);
      fetchData(authUser.id).catch(e => console.error('Data fetch failed:', e));
    }
  };

  const fetchData = async (userId: string) => {
    // Fetch logic remains same, assuming API_BASE/apiCall works if session is set
    try {
      // Parallel fetch for speed
      const [fetchedExpenses, fetchedBudgets, fetchedGoals] = await Promise.all([
        apiCall('/expenses').then(data => data.expenses).catch(() => []),
        apiCall('/budgets').then(data => data.budgets).catch(() => []),
        apiCall('/savings-goals').then(data => data.goals).catch(() => [])
      ]);

      setExpenses(fetchedExpenses);
      setBudgets(fetchedBudgets);
      setSavingsGoals(fetchedGoals);

    } catch (e) {
      console.error("Fetch data error:", e);
    }
  };


  // Persist data
  useEffect(() => {
    if (user) {
      localStorage.setItem('tipidbuddy_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tipidbuddy_user');
    }
  }, [user]);

  // Auth functions - DIRECT API IMPLEMENTATION
  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting Login via Direct REST API...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const authUrl = `https://${projectId}.supabase.co/auth/v1/token?grant_type=password`;

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.msg || 'Login failed');
      }

      console.log('REST Login Success:', data);

      if (data.access_token) {
        // Manually hydrate the session in the SDK
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError) console.error('Error setting session:', sessionError);

        handleSession({
          access_token: data.access_token,
          user: data.user,
          refresh_token: data.refresh_token
        });
        return;
      }

    } catch (error: any) {
      console.error('Direct Login Failed:', error);

      // Fallback to localStorage auth as LAST RESORT
      const storedUsers = JSON.parse(localStorage.getItem('tipidbuddy_users') || '[]');
      const foundUser = storedUsers.find((u: any) => u.email === email && u.password === password);

      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        // Explicitly mark as offline
        const userObj: User = { ...userWithoutPassword, isOffline: true };
        setUser(userObj);
        setIsAuthenticated(true);
        // loadLocalData(foundUser.id);
        toast.info('Logged in via offline mode');
      } else {
        throw new Error(error.message || 'Login failed');
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    // Clean inputs
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name: cleanName },
        },
      });

      if (error) throw error;

      if (data.session) {
        handleSession(data.session);
      }
    } catch (error: any) {
      console.error('Supabase register failed:', error.message);

      // Local Fallback
      try {
        const storedUsers = JSON.parse(localStorage.getItem('tipidbuddy_users') || '[]');

        if (storedUsers.some((u: any) => u.email === cleanEmail)) {
          throw new Error('Email already exists (Offline check)');
        }

        // Safer ID generation
        const newId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

        const newUser: User & { password?: string } = {
          id: newId,
          name: cleanName,
          email: cleanEmail,
          createdAt: new Date().toISOString(),
          password,
          isOffline: true
        };

        const newStoredUsers = [...storedUsers, newUser];
        localStorage.setItem('tipidbuddy_users', JSON.stringify(newStoredUsers));

        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        setIsAuthenticated(true);
        toast.success('Account created locally (Offline mode)');
      } catch (fallbackError: any) {
        console.error('Offline register failed:', fallbackError);
        // If inputs were invalid or user exists, throw that error
        if (fallbackError.message.includes('Email already exists')) {
          throw fallbackError;
        }
        // Otherwise re-throw original if fallback failed completely
        throw new Error('Registration failed. Please check your connection.');
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    setExpenses([]);
    setBudgets([]);
    setSavingsGoals([]);
    localStorage.removeItem('tipidbuddy_user');
    localStorage.removeItem('tipidbuddy_token');
  };

  // Data helpers
  const loadLocalData = (userId: string) => {
    // Implement if needed for offline fallback full support
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const newExpense = { ...expense, userId: user.id };

    if (user.isOffline) {
      const localExpense = { ...newExpense, id: Date.now().toString(), createdAt: new Date().toISOString() } as Expense;
      const newExpenses = [localExpense, ...expenses];
      setExpenses(newExpenses);
      localStorage.setItem('tipidbuddy_expenses', JSON.stringify(newExpenses));
      toast.success('Expense added (Offline)');
      return;
    }

    // Cloud Sync
    try {
      const data = await apiCall('/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense)
      });
      // Optimistic update using returned data including ID
      setExpenses([data.expense, ...expenses]);
      toast.success('Expense added');
    } catch (e) {
      // Fallback or error
      toast.error('Could not save expense to cloud');
    }
  };

  const deleteExpense = async (id: string) => {
    if (user?.isOffline) {
      const newExpenses = expenses.filter(e => e.id !== id);
      setExpenses(newExpenses);
      localStorage.setItem('tipidbuddy_expenses', JSON.stringify(newExpenses));
      toast.success('Expense deleted (Offline)');
      return;
    }

    try {
      await apiCall(`/expenses/${id}`, { method: 'DELETE' });
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Expense deleted');
    } catch (e) {
      toast.error('Failed to delete expense');
    }
  };

  const setBudget = async (budget: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) return;
    const newBudget = { ...budget, userId: user.id };

    if (user.isOffline) {
      const localBudget = { ...newBudget, id: Date.now().toString() } as Budget;
      const newBudgets = [...budgets, localBudget];
      setBudgets(newBudgets);
      localStorage.setItem('tipidbuddy_budgets', JSON.stringify(newBudgets));
      toast.success('Budget set (Offline)');
      return;
    }

    try {
      const data = await apiCall('/budgets', {
        method: 'POST',
        body: JSON.stringify(newBudget)
      });
      setBudgets([...budgets, data.budget]);
      toast.success('Budget set');
    } catch (e) {
      toast.error('Failed to set budget');
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (user?.isOffline) {
      const newBudgets = budgets.map(b => b.id === id ? { ...b, ...updates } : b);
      setBudgets(newBudgets);
      localStorage.setItem('tipidbuddy_budgets', JSON.stringify(newBudgets));
      toast.success('Budget updated (Offline)');
      return;
    }

    try {
      const data = await apiCall(`/budgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      setBudgets(budgets.map(b => b.id === id ? data.budget : b));
      toast.success('Budget updated');
    } catch (e) {
      toast.error('Failed to update budget');
    }
  };

  const deleteBudget = async (id: string) => {
    if (user?.isOffline) {
      const newBudgets = budgets.filter(b => b.id !== id);
      setBudgets(newBudgets);
      localStorage.setItem('tipidbuddy_budgets', JSON.stringify(newBudgets));
      toast.success('Budget deleted (Offline)');
      return;
    }

    try {
      await apiCall(`/budgets/${id}`, { method: 'DELETE' });
      setBudgets(budgets.filter(b => b.id !== id));
      toast.success('Budget deleted');
    } catch (e) {
      toast.error('Failed to delete budget');
    }
  };


  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'userId'>) => {
    if (!user) return;
    const newGoal = { ...goal, userId: user.id };

    if (user.isOffline) {
      const localGoal = { ...newGoal, id: Date.now().toString() } as SavingsGoal;
      const newGoals = [...savingsGoals, localGoal];
      setSavingsGoals(newGoals);
      localStorage.setItem('tipidbuddy_goals', JSON.stringify(newGoals));
      toast.success('Savings goal added (Offline)');
      return;
    }

    try {
      const data = await apiCall('/savings-goals', {
        method: 'POST',
        body: JSON.stringify(newGoal)
      });
      setSavingsGoals([...savingsGoals, data.goal]);
      toast.success('Savings goal added');
    } catch (e) {
      toast.error('Failed to add savings goal');
    }
  };

  const updateSavingsGoal = async (id: string, amount: number) => {
    if (user?.isOffline) {
      const newGoals = savingsGoals.map(g => g.id === id ? { ...g, currentAmount: amount } : g);
      setSavingsGoals(newGoals);
      localStorage.setItem('tipidbuddy_goals', JSON.stringify(newGoals));
      toast.success('Savings goal updated (Offline)');
      return;
    }

    try {
      const data = await apiCall(`/savings-goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ currentAmount: amount })
      });
      setSavingsGoals(savingsGoals.map(g => g.id === id ? data.goal : g));
      toast.success('Savings goal updated');
    } catch (e) {
      toast.error('Failed to update savings goal');
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    if (user?.isOffline) {
      const newGoals = savingsGoals.filter(g => g.id !== id);
      setSavingsGoals(newGoals);
      localStorage.setItem('tipidbuddy_goals', JSON.stringify(newGoals));
      toast.success('Savings goal deleted (Offline)');
      return;
    }

    try {
      await apiCall(`/savings-goals/${id}`, { method: 'DELETE' });
      setSavingsGoals(savingsGoals.filter(g => g.id !== id));
      toast.success('Savings goal deleted');
    } catch (e) {
      toast.error('Failed to delete savings goal');
    }
  };

  const updateProfile = async (name: string) => {
    if (!user) return;

    try {
      // 1. Update Auth Metadata (Supabase)
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) throw error;

      // 2. Sync with KV Store (Groups)
      if (!user.isOffline) {
        await apiCall('/profile/update', {
          method: 'POST',
          body: JSON.stringify({ name })
        });
      }

      // 3. Update Local State
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      localStorage.setItem('tipidbuddy_user', JSON.stringify(updatedUser)); // Update offline cache

      // 4. Update Offline User Registry if needed
      if (user.isOffline) {
        // Update offline registry
        const storedUsers = JSON.parse(localStorage.getItem('tipidbuddy_users') || '[]');
        const newStoredUsers = storedUsers.map((u: any) =>
          u.id === user.id ? { ...u, name } : u
        );
        localStorage.setItem('tipidbuddy_users', JSON.stringify(newStoredUsers));
        toast.success('Profile updated (Offline)');
      } else {
        toast.success('Profile updated');
      }

    } catch (e: any) {
      console.error('Update profile error:', e);
      toast.error('Failed to update profile: ' + e.message);
    }
  };

  return (
    <AppContext.Provider
      value={{
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
        deleteExpense,
        setBudget,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        updateBudget,
        deleteBudget,
        updateProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};