import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "@/app/context/AppContext";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { Onboarding } from "@/app/screens/Onboarding";
import { Auth } from "@/app/screens/Auth";
import { Dashboard } from "@/app/screens/Dashboard";
import { AddExpense } from "@/app/screens/AddExpense";
import { BudgetScreen } from "@/app/screens/BudgetScreen";
import { Analytics } from "@/app/screens/Analytics";
import { Profile } from "@/app/screens/Profile";
import { Groups } from "@/app/screens/Groups";
import { BottomNav } from "@/app/components/BottomNav";
import { AnimatePresence } from "motion/react";
import { PageTransition } from "@/app/components/PageTransition";
import { Toaster } from "@/app/components/ui/sonner";

function AppContent() {
  const { isAuthenticated } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem(
      "tipidbuddy_onboarding_complete",
    );
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(
      "tipidbuddy_onboarding_complete",
      "true",
    );
    setShowOnboarding(false);
  };

  // Show onboarding first
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Show auth if not authenticated
  if (!isAuthenticated) {
    return <Auth onSuccess={() => setCurrentPage("home")} />;
  }

  // Render the appropriate screen
  const renderScreen = () => {
    return (
      <PageTransition key={currentPage} className="h-full pb-20">
        {(() => {
          switch (currentPage) {
            case "home":
              return <Dashboard />;
            case "add":
              return <AddExpense />;
            case "budget":
              return <BudgetScreen />;
            case "groups":
              return <Groups />;
            case "analytics":
              return <Analytics />;
            case "profile":
              return <Profile />;
            default:
              return <Dashboard />;
          }
        })()}
      </PageTransition>
    );
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="h-screen overflow-auto bg-gray-50 dark:bg-gray-900">
          <AppContent />
          <Toaster position="top-center" />
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}