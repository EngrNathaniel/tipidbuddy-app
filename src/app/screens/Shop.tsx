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
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white p-6 rounded-b-3xl shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Icon Shop</h1>
          <ShoppingBag className="w-8 h-8" />
        </div>
        
        {/* Coin Balance */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Your Coins</p>
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-300" />
              <p className="text-3xl font-bold">{coins}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-xs">Earn coins by saving!</p>
            <p className="text-sm font-medium">₱10 saved = 1 coin</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-purple-500 text-white'
                  : isDarkMode
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-white text-gray-700'
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
              className={`${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl p-4 shadow-md relative ${
                selectedIcon === item.id ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {/* Selected Badge */}
              {selectedIcon === item.id && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}

              {/* Icon Display */}
              <button
                onClick={() => handleSelectIcon(item.id)}
                className={`w-full aspect-square rounded-xl flex items-center justify-center text-5xl mb-2 ${
                  item.unlocked
                    ? isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                    : 'bg-gray-300 dark:bg-gray-900 relative overflow-hidden'
                } transition-colors`}
              >
                {item.unlocked ? (
                  item.emoji
                ) : (
                  <>
                    <span className="opacity-30">{item.emoji}</span>
                    <Lock className="absolute w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </>
                )}
              </button>

              {/* Name */}
              <p className={`text-sm font-medium text-center mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {item.name}
              </p>

              {/* Price/Status */}
              {item.unlocked ? (
                selectedIcon === item.id ? (
                  <div className="bg-purple-500 text-white text-xs py-1 px-2 rounded-lg text-center font-medium">
                    Using
                  </div>
                ) : (
                  <Button
                    onClick={() => handleSelectIcon(item.id)}
                    size="sm"
                    className="w-full text-xs bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Use
                  </Button>
                )
              ) : item.price === 0 ? (
                <Button
                  onClick={() => handlePurchase(item)}
                  size="sm"
                  className="w-full text-xs bg-green-500 hover:bg-green-600 text-white"
                >
                  Free
                </Button>
              ) : (
                <Button
                  onClick={() => handlePurchase(item)}
                  size="sm"
                  disabled={coins < item.price}
                  className={`w-full text-xs ${
                    coins >= item.price
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3 h-3 mr-1" />
                  {item.price}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            How to earn coins?
          </h3>
          <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Save money towards your goals
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Submit daily savings in groups
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Every ₱10 saved = 1 coin earned
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-500">💡</span>
              Use coins to unlock cool profile icons!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
