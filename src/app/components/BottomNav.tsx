import React from 'react';
import { Home, PlusCircle, Wallet, TrendingUp, User, Users, Calendar, ShoppingBag } from 'lucide-react';
import { useGroupNotifications } from '@/app/hooks/useGroupNotifications';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { pendingCount } = useGroupNotifications();
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'budget', icon: Wallet, label: 'Budget' },
    { id: 'add', icon: PlusCircle, label: 'Add', highlight: true },
    { id: 'groups', icon: Users, label: 'Groups', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                item.highlight 
                  ? 'text-emerald-500 dark:text-emerald-400' 
                  : isActive 
                  ? 'text-emerald-500 dark:text-emerald-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.highlight ? (
                <div className={`w-14 h-14 -mt-6 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-emerald-500 dark:bg-emerald-600'
                } shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              ) : (
                <>
                  <Icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-xs mt-1">{item.label}</span>
                </>
              )}
              {item.badge && (
                <span className="absolute top-2 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};