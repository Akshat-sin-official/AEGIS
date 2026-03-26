import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Fingerprint, Activity, Zap, ArrowRight } from 'lucide-react';
import Hero from './components/Hero';
import SecurityFlow from './components/SecurityFlow';

function App() {
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);

  return (
    <div className="min-h-screen bg-background selection:bg-accent/20">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!isJourneyStarted ? (
            <Hero key="hero" onStart={() => setIsJourneyStarted(true)} />
          ) : (
            <SecurityFlow key="flow" onBack={() => setIsJourneyStarted(false)} />
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-12 text-center text-secondary/40 text-sm font-medium tracking-widest uppercase">
        Project A.E.G.I.S — Secure Identity Visualizer
      </footer>
    </div>
  );
}

export default App;
