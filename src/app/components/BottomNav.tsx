import React from 'react';
import { Home, Plus, Wallet, User, Users } from 'lucide-react';
import { useGroupNotifications } from '@/app/hooks/useGroupNotifications';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { pendingCount } = useGroupNotifications();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'budget', icon: Wallet, label: 'Budget' },
    { id: 'add', icon: Plus, label: 'Add', highlight: true },
    { id: 'groups', icon: Users, label: 'Groups', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]" />

      <div className="relative flex justify-around items-center h-20 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const isAdd = item.id === 'add';

          if (isAdd) {
            return (
              <div key={item.id} className="relative -top-6">
                <motion.button
                  onClick={() => onNavigate(item.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-primary to-emerald-500 shadow-lg shadow-primary/40 text-primary-foreground relative z-10 group"
                >
                  <Icon className="h-8 w-8" />
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-2 group"
            >
              <div className={`relative p-2 rounded-xl transition-all duration-300`}>
                <Icon
                  className={`h-6 w-6 transition-all duration-300 ${isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-primary'
                    }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {item.badge && (
                  <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-bold px-1 ring-2 ring-background">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive
                  ? 'text-primary translate-y-0 opacity-100'
                  : 'text-muted-foreground translate-y-1 opacity-100'
                }`}>
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-2 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};