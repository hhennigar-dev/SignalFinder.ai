
import React, { useState, useEffect } from 'react';

const steps = [
  "Searching Reddit and niche forums...",
  "Filtering low-quality sources...",
  "Analyzing 50-100 discussions for pain patterns...",
  "Extracting evidence-backed quotes...",
  "Detecting urgency and sentiment signals...",
  "Scoring monetization potential...",
  "Ranking findings by opportunity strength..."
];

export const LoadingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 p-6 text-center">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-white animate-pulse">
          Hunting for Signals...
        </h2>
        <div className="flex flex-col items-center gap-2">
          {steps.map((step, idx) => (
            <p
              key={idx}
              className={`text-sm transition-all duration-700 ${
                idx === currentStep
                  ? "text-purple-400 font-medium scale-105"
                  : idx < currentStep
                  ? "text-zinc-500 line-through opacity-50"
                  : "text-zinc-700"
              }`}
            >
              {step}
            </p>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-zinc-500 italic max-w-sm">
        "This usually takes 30-60 seconds as we analyze thousands of words across dozens of real-world discussions."
      </p>
    </div>
  );
};
