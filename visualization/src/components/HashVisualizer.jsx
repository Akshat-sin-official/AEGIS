import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, ShieldCheck, Activity } from 'lucide-react';
import bcrypt from 'bcryptjs';

const HashVisualizer = ({ password = '', onHashComplete }) => {
  const [rounds, setRounds] = useState(10);
  const [isHashing, setIsHashing] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);

  const startHashing = async () => {
    if (!password?.trim()) return;

    setIsHashing(true);
    setResult(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 95));
    }, 100);

    try {
      const salt = bcrypt.genSaltSync(rounds);
      const hash = bcrypt.hashSync(password, salt);

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setResult({ salt, hash });
        setIsHashing(false);
        onHashComplete?.({ hash, salt });
      }, 500);
    } catch (error) {
      console.error(error);
      clearInterval(interval);
      setIsHashing(false);
    }
  };

  return (
    <div className="w-full space-y-8 py-6">
      <div className="flex flex-col items-center gap-4">
        <label className="text-xs font-bold uppercase tracking-widest text-secondary/40">Password from User Input (step 1)</label>
        <div className="relative w-full max-w-sm">
          <input
            type="password"
            readOnly
            value={password ? '•'.repeat(Math.min(password.length, 32)) : ''}
            placeholder="Enter credentials in Step 01 first"
            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-center font-mono text-lg focus:ring-2 focus:ring-accent outline-none transition-all shadow-inner"
          />
          <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-20">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        {!password?.trim() && (
          <p className="text-xs font-bold text-amber-600 text-center max-w-sm">
            Go back to Step 01 and enter a password — this step hashes that exact value with bcrypt.
          </p>
        )}
      </div>

      <div className="relative h-48 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isHashing ? (
            <motion.div
              key="hashing"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-100"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="376.99"
                    strokeDashoffset={376.99 - (376.99 * progress) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="text-accent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold font-mono text-accent">{progress}%</p>
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary/60 animate-pulse">
                Running {rounds} cost rounds...
              </p>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full space-y-4"
            >
              <div className="premium-card !p-6 bg-emerald-50/50 border-emerald-100/50 space-y-4">
                <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-900 uppercase tracking-tight">Cryptographic Output</span>
                </div>
                <div className="space-y-4 font-mono text-[11px] break-all leading-relaxed">
                  <div>
                    <p className="text-emerald-600 font-bold mb-1">Generated Salt:</p>
                    <p className="p-2 bg-white/50 rounded-lg border border-emerald-100 text-emerald-800">{result.salt}</p>
                  </div>
                  <div>
                    <p className="text-emerald-600 font-bold mb-1">Final Hash:</p>
                    <p className="p-2 bg-white/50 rounded-lg border border-emerald-100 text-emerald-800">{result.hash}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-xs font-bold text-accent uppercase tracking-widest hover:underline mx-auto block"
              >
                Compute New Hash
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!password?.trim()}
              onClick={startHashing}
              className="px-10 py-5 bg-accent text-white rounded-full font-bold shadow-2xl shadow-accent/20 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-5 h-5" />
              Perform Real Bcrypt Hashing
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-secondary/40 uppercase mb-2">Adaptive Factor</p>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="8"
              max="14"
              step="1"
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value, 10))}
              className="w-full accent-accent"
            />
            <span className="text-sm font-bold text-primary font-mono">{rounds}</span>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-secondary/40 uppercase mb-1">Vulnerability</p>
            <p className="font-bold text-xs text-emerald-600">Zero-Plaintext</p>
          </div>
          <Activity className="w-5 h-5 text-emerald-400 opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default HashVisualizer;
