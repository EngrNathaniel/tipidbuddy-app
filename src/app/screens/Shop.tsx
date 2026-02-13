import React, { useState, useEffect } from 'react';
import { ShoppingBag, Coins, Check, Lock, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

interface ProfileIcon {
  id: string;
  emoji: string;
  name: string;
  price: number;
  category: 'animals' | 'food' | 'nature' | 'objects' | 'premium';
  unlocked: boolean;
}

const SHOP_ITEMS: Omit<ProfileIcon, 'unlocked'>[] = [
  // Free starter icons
  { id: 'default', emoji: '👤', name: 'Default', price: 0, category: 'objects' },
  { id: 'smile', emoji: '😊', name: 'Smile', price: 0, category: 'objects' },

  // Animals - 100 coins
  { id: 'cat', emoji: '🐱', name: 'Cat', price: 100, category: 'animals' },
  { id: 'dog', emoji: '🐶', name: 'Dog', price: 100, category: 'animals' },
  { id: 'panda', emoji: '🐼', name: 'Panda', price: 100, category: 'animals' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', price: 100, category: 'animals' },
  { id: 'monkey', emoji: '🐵', name: 'Monkey', price: 100, category: 'animals' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', price: 100, category: 'animals' },

  // Food - 150 coins
  { id: 'pizza', emoji: '🍕', name: 'Pizza', price: 150, category: 'food' },
  { id: 'burger', emoji: '🍔', name: 'Burger', price: 150, category: 'food' },
  { id: 'donut', emoji: '🍩', name: 'Donut', price: 150, category: 'food' },
  { id: 'icecream', emoji: '🍦', name: 'Ice Cream', price: 150, category: 'food' },
  { id: 'sushi', emoji: '🍣', name: 'Sushi', price: 150, category: 'food' },

  // Nature - 200 coins
  { id: 'fire', emoji: '🔥', name: 'Fire', price: 200, category: 'nature' },
  { id: 'star', emoji: '⭐', name: 'Star', price: 200, category: 'nature' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', price: 200, category: 'nature' },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', price: 200, category: 'nature' },
  { id: 'moon', emoji: '🌙', name: 'Moon', price: 200, category: 'nature' },

  // Premium - 500 coins
  { id: 'crown', emoji: '👑', name: 'Crown', price: 500, category: 'premium' },
  { id: 'gem', emoji: '💎', name: 'Diamond', price: 500, category: 'premium' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', price: 500, category: 'premium' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', price: 500, category: 'premium' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', price: 500, category: 'premium' },
];

interface ShopProps {
  onBack: () => void;
}

export function Shop({ onBack }: ShopProps) {
  const { isDarkMode } = useTheme();
  const { user } = useApp();
  const [coins, setCoins] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState('default');
  const [unlockedIcons, setUnlockedIcons] = useState<string[]>(['default', 'smile']);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Load user's coins and unlocked icons from localStorage
    const userCoins = localStorage.getItem(`tipidbuddy_coins_${user?.id}`);
    const userUnlocked = localStorage.getItem(`tipidbuddy_unlocked_icons_${user?.id}`);
    const userSelectedIcon = localStorage.getItem(`tipidbuddy_selected_icon_${user?.id}`);

    if (userCoins) setCoins(parseInt(userCoins));
    if (userUnlocked) setUnlockedIcons(JSON.parse(userUnlocked));
    if (userSelectedIcon) setSelectedIcon(userSelectedIcon);
  }, [user?.id]);

  // Calculate coins from savings goals progress
  useEffect(() => {
    const savingsGoals = JSON.parse(localStorage.getItem('tipidbuddy_goals') || '[]');
    const totalSaved = savingsGoals.reduce((sum: number, goal: any) => sum + goal.currentAmount, 0);
    const earnedCoins = Math.floor(totalSaved / 10); // 1 coin per ₱10 saved

    const newCoins = earnedCoins;
    setCoins(newCoins);
    localStorage.setItem(`tipidbuddy_coins_${user?.id}`, newCoins.toString());
  }, [user?.id]);

  const handlePurchase = (item: Omit<ProfileIcon, 'unlocked'>) => {
    if (unlockedIcons.includes(item.id)) {
      toast.error('You already own this icon!');
      return;
    }

    if (coins < item.price) {
      toast.error('Not enough coins! Save more to earn coins.');
      return;
    }

    const newCoins = coins - item.price;
    const newUnlocked = [...unlockedIcons, item.id];

    setCoins(newCoins);
    setUnlockedIcons(newUnlocked);
    localStorage.setItem(`tipidbuddy_coins_${user?.id}`, newCoins.toString());
    localStorage.setItem(`tipidbuddy_unlocked_icons_${user?.id}`, JSON.stringify(newUnlocked));

    toast.success(`${item.name} icon unlocked! 🎉`);
  };

  const handleSelectIcon = (iconId: string) => {
    if (!unlockedIcons.includes(iconId)) {
      toast.error('Purchase this icon first!');
      return;
    }

    setSelectedIcon(iconId);
    localStorage.setItem(`tipidbuddy_selected_icon_${user?.id}`, iconId);
    toast.success('Profile icon updated!');
  };

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'animals', name: 'Animals' },
    { id: 'food', name: 'Food' },
    { id: 'nature', name: 'Nature' },
    { id: 'premium', name: 'Premium' },
  ];

  const filteredItems = SHOP_ITEMS.filter(item =>
    selectedCategory === 'all' || item.category === selectedCategory
  ).map(item => ({
    ...item,
    unlocked: unlockedIcons.includes(item.id)
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="max-w-lg mx-auto px-6 mb-8 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Icon Shop</h1>
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Coin Balance */}
        <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Your Balance</p>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-500" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{coins}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Earn coins by saving!</p>
              <div className="inline-block bg-primary/10 px-3 py-1 rounded-full">
                <p className="text-xs font-medium text-primary">₱10 saved = 1 coin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-6">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors text-sm font-medium ${selectedCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-gray-200 dark:border-white/5 text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Shop Items Grid */}
        <div className="grid grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-4 shadow-sm relative flex flex-col items-center ${selectedIcon === item.id ? 'ring-2 ring-primary border-transparent' : ''
                }`}
            >
              {/* Selected Badge */}
              {selectedIcon === item.id && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}

              {/* Icon Display */}
              <button
                onClick={() => handleSelectIcon(item.id)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 transition-colors ${item.unlocked
                  ? 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                  : 'bg-gray-100 dark:bg-white/5 opacity-50'
                  }`}
              >
                {item.unlocked ? (
                  item.emoji
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                )}
              </button>

              {/* Name */}
              <p className="text-xs font-semibold text-gray-900 dark:text-white mb-3 text-center">
                {item.name}
              </p>

              {/* Price/Status */}
              <div className="w-full mt-auto">
                {item.unlocked ? (
                  selectedIcon === item.id ? (
                    <div className="w-full bg-primary/10 text-primary text-[10px] py-1.5 rounded-lg text-center font-bold uppercase tracking-wider">
                      Active
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSelectIcon(item.id)}
                      size="sm"
                      className="w-full h-8 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 rounded-lg"
                    >
                      Use
                    </Button>
                  )
                ) : item.price === 0 ? (
                  <Button
                    onClick={() => handlePurchase(item)}
                    size="sm"
                    className="w-full h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                  >
                    Free
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePurchase(item)}
                    size="sm"
                    disabled={coins < item.price}
                    className={`w-full h-8 text-xs rounded-lg ${coins >= item.price
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-gray-100 dark:bg-white/5 text-muted-foreground cursor-not-allowed'
                      }`}
                  >
                    <Coins className="w-3 h-3 mr-1" />
                    {item.price}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="bg-card border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
            How to earn coins?
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-emerald-500 text-xs">✓</span>
              </div>
              Save money towards your goals
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-emerald-500 text-xs">✓</span>
              </div>
              Submit daily savings in groups
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-emerald-500 text-xs">✓</span>
              </div>
              Every ₱10 saved = 1 coin earned
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xs">💡</span>
              </div>
              Use coins to unlock cool profile icons!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
