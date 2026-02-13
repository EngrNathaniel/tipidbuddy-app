import React from 'react';
import { UtensilsCrossed, Bus, GraduationCap, Gamepad2, ShoppingBag } from 'lucide-react';

interface CategoryIconProps {
  category: 'Food' | 'Transport' | 'School' | 'Entertainment' | 'Others';
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 20, className = '' }) => {
  const iconProps = { size, className };

  const icons = {
    Food: <UtensilsCrossed {...iconProps} />,
    Transport: <Bus {...iconProps} />,
    School: <GraduationCap {...iconProps} />,
    Entertainment: <Gamepad2 {...iconProps} />,
    Others: <ShoppingBag {...iconProps} />,
  };

  return icons[category];
};

export const getCategoryColor = (category: string): string => {
  const colors = {
    Food: 'bg-emerald-100 text-emerald-600',
    Transport: 'bg-blue-100 text-blue-600',
    School: 'bg-purple-100 text-purple-600',
    Entertainment: 'bg-yellow-100 text-yellow-600',
    Others: 'bg-gray-100 text-gray-600',
  };
  return colors[category as keyof typeof colors] || colors.Others;
};

export const getCategoryBaseColor = (category: string): string => {
  const colors: Record<string, string> = {
    Food: 'emerald',
    Transport: 'blue',
    School: 'purple',
    Entertainment: 'yellow',
    Others: 'gray',
  };
  return colors[category] || 'gray';
};
