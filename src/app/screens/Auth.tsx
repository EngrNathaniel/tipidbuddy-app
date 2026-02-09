import React, { useState } from 'react';
import { PiggyBank, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useApp } from '@/app/context/AppContext';
import { useTheme } from '@/app/context/ThemeContext';
import { toast } from 'sonner';

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useApp();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back to TipidBuddy!');
      } else {
        await register(name, email, password);
        toast.success('Account created successfully!');
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-emerald-50 via-blue-50 to-yellow-50'
    }`}>
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-500 rounded-full shadow-lg">
              <PiggyBank className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            TipidBuddy
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Your Budget, Your Buddy
          </p>
        </div>

        {/* Form */}
        <div className={`rounded-3xl shadow-xl p-8 space-y-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLogin ? 'Login to continue' : 'Join TipidBuddy today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <Input
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={`pl-10 h-12 rounded-xl ${
                      isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <Input
                  type="email"
                  placeholder="juan@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`pl-10 h-12 rounded-xl ${
                    isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`pl-10 h-12 rounded-xl ${
                    isDarkMode ? 'bg-gray-700 text-white border-gray-600' : ''
                  }`}
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl text-base"
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className={`rounded-xl p-4 text-sm text-center ${
          isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
        }`}>
          <p className={`font-medium mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
            Demo Mode
          </p>
          <p className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
            Create an account or use any email/password to test the app
          </p>
        </div>
      </div>
    </div>
  );
};