import React from 'react';
import { PiggyBank, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const slides = [
    {
      icon: PiggyBank,
      title: 'Welcome to TipidBuddy!',
      description: 'Your friendly personal finance companion for smarter spending and saving.',
      color: 'text-emerald-500',
    },
    {
      icon: TrendingDown,
      title: 'Track Your Expenses',
      description: 'Easily log your daily expenses and see where your money goes.',
      color: 'text-blue-500',
    },
    {
      icon: Target,
      title: 'Set Savings Goals',
      description: 'Create goals and watch your savings grow towards your dreams.',
      color: 'text-yellow-500',
    },
    {
      icon: BarChart3,
      title: 'Smart Insights',
      description: 'Get visual analytics and tips to improve your spending habits.',
      color: 'text-purple-500',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-yellow-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`p-6 bg-white rounded-full shadow-lg ${currentSlideData.color}`}>
            <Icon className="h-20 w-20" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {currentSlideData.title}
          </h1>
          <p className="text-lg text-gray-600">
            {currentSlideData.description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'w-8 bg-emerald-500' 
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleNext}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg rounded-2xl"
          >
            {currentSlide === slides.length - 1 ? "Let's Get Started!" : 'Next'}
          </Button>
          
          {currentSlide < slides.length - 1 && (
            <Button 
              onClick={onComplete}
              variant="ghost"
              className="w-full text-gray-500"
            >
              Skip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
