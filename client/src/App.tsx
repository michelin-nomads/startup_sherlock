import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LoadingPage } from "@/components/loading-page";
import { motion, AnimatePresence } from "framer-motion";
import { exchangeRateManager } from "@/lib/exchangeRate";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

// Pages
import DashboardPage from "@/pages/dashboard";
import UploadPage from "@/pages/upload";
import AnalysisPage from "@/pages/analysis";
import RiskPage from "@/pages/risk";
import BenchmarksPage from "@/pages/benchmarks";
import NotFound from "@/pages/not-found";
import ComparisonPage from "@/pages/comparison";
import ResearchTestPage from "@/pages/research-test"; // NEW: Hybrid Research Test
import PublicDataAnalysisPage from "@/pages/public-data-analysis"; // NEW: Public Source Due Diligence
import SignInPage from "@/pages/signin"; // NEW: Sign In
import SignUpPage from "@/pages/signup"; // NEW: Sign Up
import { ProtectedRoute } from "./components/protected-route";
import { AuthProvider } from "./contexts/AuthContext";

// Wrapper components to handle params
function AnalysisWrapper() {
  const params = useParams();
  return <AnalysisPage params={params as Record<string, string>} />;
}

function ComparisonWrapper() {
  const params = useParams();
  return <ComparisonPage params={params as Record<string, string>} />;
}

function AppHeader() {
  const { open } = useSidebar();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        {!open && (
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
            data-testid="header-logo-home-link"
          >
            <img src="/startupsherlock-light.png" alt="Startup Sherlock" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Startup Sherlock</h1>
              <p className="text-xs text-muted-foreground">Streamlining startup analysis for smarter investments</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has seen the landing page in this session
    const hasSeenLanding = sessionStorage.getItem('startup-sherlock-landing-seen');
    
    if (!hasSeenLanding) {
      setIsLoading(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    // Mark that user has seen the landing page in this session
    sessionStorage.setItem('startup-sherlock-landing-seen', 'true');
    setIsLoading(false);
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingPage key="loading" onLoadingComplete={handleLoadingComplete} />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex h-screen w-full"
        >
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <AppHeader />
            <main className="flex-1 overflow-auto p-6">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/analysis" element={<AnalysisWrapper />} />
                <Route path="/analysis/:id" element={<AnalysisWrapper />} />
                <Route path="/benchmarks" element={<BenchmarksPage />} />
                <Route path="/benchmarks/comparison/:startupId" element={<ComparisonWrapper />} />
                <Route path="/risk" element={<RiskPage />} />
                <Route path="/research-test" element={<ResearchTestPage />} />
                <Route path="/public-data-analysis/:startupId" element={<PublicDataAnalysisPage />} />
                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
                <Route path="/analysis" element={<ProtectedRoute><AnalysisWrapper /></ProtectedRoute>} />
                <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisWrapper /></ProtectedRoute>} />
                <Route path="/benchmarks" element={<ProtectedRoute><BenchmarksPage /></ProtectedRoute>} />
                <Route path="/benchmarks/comparison/:startupId" element={<ProtectedRoute><ComparisonWrapper /></ProtectedRoute>} />
                <Route path="/risk" element={<ProtectedRoute><RiskPage /></ProtectedRoute>} />
                <Route path="/public-data-analysis/:startupId" element={<ProtectedRoute><PublicDataAnalysisPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  // Custom sidebar width for the analyst platform
  const style = {
    "--sidebar-width": "20rem",       // 320px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  // Initialize exchange rate on app load
  useEffect(() => {
    exchangeRateManager.initialize().catch(err => {
      console.error('Failed to initialize exchange rate:', err);
    });
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="startup-sherlock-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Router>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* Protected App Routes */}
                <Route
                  path="/*"
                  element={
                    <SidebarProvider style={style as React.CSSProperties}>
                      <AppContent />
                    </SidebarProvider>
                  }
                />
              </Routes>
              <Toaster />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;