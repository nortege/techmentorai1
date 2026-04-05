import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import './lib/i18n';
import { useEffect } from 'react';
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import DiaryPage from "./pages/DiaryPage";
import DiaryNewPage from "./pages/DiaryNewPage";
import NotebookPage from "./pages/NotebookPage";
import InnovationPage from "./pages/InnovationPage";
import RobotPage from "./pages/RobotPage";
import CoreValuesPage from "./pages/CoreValuesPage";
import ResearchPage from "./pages/ResearchPage";
import ChecklistPage from "./pages/ChecklistPage";
import ExportPage from "./pages/ExportPage";
import ProfilePage from "./pages/ProfilePage";
import ReviewsPage from "./pages/ReviewsPage";
import ChatbotPage from "./pages/ChatbotPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ForceDarkTheme() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('fll-theme', 'dark');
  }, []);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) {
    const redirectPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/diary" element={<ProtectedRoute><DiaryPage /></ProtectedRoute>} />
      <Route path="/diary/new" element={<ProtectedRoute><DiaryNewPage /></ProtectedRoute>} />
      <Route path="/notebook" element={<ProtectedRoute><NotebookPage /></ProtectedRoute>} />
      <Route path="/notebook/innovation" element={<ProtectedRoute><InnovationPage /></ProtectedRoute>} />
      <Route path="/notebook/robot" element={<ProtectedRoute><RobotPage /></ProtectedRoute>} />
      <Route path="/notebook/corevalues" element={<ProtectedRoute><CoreValuesPage /></ProtectedRoute>} />
      <Route path="/notebook/research" element={<ProtectedRoute><ResearchPage /></ProtectedRoute>} />
      <Route path="/checklist" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
      <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ForceDarkTheme />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
