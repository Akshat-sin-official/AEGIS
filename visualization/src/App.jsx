import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import Hero from './components/Hero';
import SecurityFlow from './components/SecurityFlow';
import AuthPortal from './components/AuthPortal';
import { useAuth } from './context/AuthContext';

function App() {
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const { user, authLoading, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background selection:bg-accent/20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {!authLoading && isAuthenticated && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 glass !px-4 !py-2 rounded-full border border-white/50 shadow-lg">
          <User className="w-4 h-4 text-accent shrink-0" />
          <span className="text-xs font-mono font-bold text-primary max-w-[200px] truncate" title={user.email}>
            {user.email}
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-red-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!isJourneyStarted ? (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16">
              <Hero onStart={() => setIsJourneyStarted(true)} />
              {!authLoading && !isAuthenticated && (
                <div className="max-w-lg mx-auto">
                  <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-secondary/50 mb-6">
                    Live backend — MySQL + risk-aware login
                  </p>
                  <AuthPortal />
                </div>
              )}
              {!authLoading && isAuthenticated && (
                <div className="text-center space-y-6 max-w-xl mx-auto">
                  <p className="text-secondary">
                    You’re signed in. The secure flow visualizer uses your session for the audit step. New IP or device
                    pairs require TOTP until trusted (like Google’s unfamiliar-device prompt).
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsJourneyStarted(true)}
                    className="px-10 py-4 bg-primary text-white rounded-full font-bold shadow-xl hover:shadow-primary/20 transition-all"
                  >
                    Explore the Secure Flow
                  </button>
                </div>
              )}
            </motion.div>
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
