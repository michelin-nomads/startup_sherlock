import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingPageProps {
  onLoadingComplete: () => void;
}

export function LoadingPage({ onLoadingComplete }: LoadingPageProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const loadingSteps = [
    "Initializing Startup Sherlock...",
    "Preparing investment intelligence...",
    "Ready to investigate!"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onLoadingComplete, 800);
          return 100;
        }
        return prev + 3;
      });
    }, 70);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(stepTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(stepTimer);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-md mx-auto px-6 flex flex-col items-center">
        {/* Logo with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            duration: 1.2 
          }}
          className="mb-8"
        >
          <div className="relative">
            <motion.img
              src="/startupsherlock-light.png"
              alt="Startup Sherlock"
              className="w-48 h-48 mx-auto rounded-2xl shadow-2xl"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0.4)",
                  "0 0 0 20px rgba(59, 130, 246, 0)",
                  "0 0 0 0 rgba(59, 130, 246, 0)"
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
            {/* Rotating ring around logo */}
            <motion.div
              className="absolute inset-0 border-2 border-blue-400/30 rounded-2xl"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          </div>
        </motion.div>

        {/* Title with typewriter effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-2 text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-2 text-center">
            Startup Sherlock
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-blue-200 text-md font-medium whitespace-nowrap text-center"
          >
            Streamlining startup analysis for smarter investments
          </motion.p>
        </motion.div>

        {/* Loading progress bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mb-6 text-center w-full"
        >
          <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4 overflow-hidden text-center">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              />
            </motion.div>
          </div>
          <div className="text-blue-300 text-sm font-medium text-center">
            {loadingProgress.toFixed(2)}%
          </div>
        </motion.div>

        {/* Loading steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="min-h-[2rem] text-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-slate-300 text-sm text-center"
            >
              {loadingSteps[currentStep]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Pulsing dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.6 }}
          className="flex justify-center space-x-1 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
    </div>
  );
}
