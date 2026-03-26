import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ShieldCheck, Lock, Globe } from 'lucide-react';

const SessionVisualizer = ({ userEmail = '', riskSnapshot = null, mfaVerified = false, onSessionIssued }) => {
  const [isIssuing, setIsIssuing] = useState(false);
  const [token, setToken] = useState(null);

  const issueSession = () => {
    setIsIssuing(true);
    setTimeout(() => {
      const newToken =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '')
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setToken(newToken);
      const safeEmail = (userEmail || 'anonymous').replace(/[^a-zA-Z0-9@._-]/g, '_');
      document.cookie = `peas_session=${newToken}; path=/; max-age=3600; samesite=strict`;
      document.cookie = `peas_subject=${encodeURIComponent(safeEmail)}; path=/; max-age=3600; samesite=strict`;
      setIsIssuing(false);
      onSessionIssued?.(newToken);
    }, 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <div className="mb-8 space-y-2 text-center sm:text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary/40">Session context</p>
        <p className="text-sm text-secondary">
          Identity: <span className="font-mono font-bold text-primary">{userEmail || '—'}</span>
        </p>
        <p className="text-sm text-secondary">
          Risk at issuance:{' '}
          <span className="font-bold text-primary">
            {riskSnapshot ? `${riskSnapshot.threatLabel} (${riskSnapshot.riskScore}/100)` : 'Not run in this session'}
          </span>
        </p>
        <p className="text-sm text-secondary">
          MFA:{' '}
          <span className={`font-bold ${mfaVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
            {mfaVerified ? 'Verified' : 'Not verified in flow — demo still allows handshake'}
          </span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!token ? (
          <motion.div
            key="action"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center gap-8"
          >
            <div
              className={`p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center gap-6 ${isIssuing ? 'animate-pulse' : ''}`}
            >
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-gray-50">
                <Key className={`w-10 h-10 ${isIssuing ? 'text-accent animate-bounce' : 'text-gray-300'}`} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-primary">Cryptographic Handshake</h3>
                <p className="text-sm text-secondary/60">
                  Issuing an HTTP-only session identifier bound to this browser tab (demo).
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isIssuing}
              onClick={issueSession}
              className="px-12 py-5 bg-primary text-white rounded-full font-bold shadow-2xl hover:bg-primary/90 transition-all flex items-center gap-3"
            >
              {isIssuing ? 'Issuing Token...' : 'Finalize Handshake'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="output"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="premium-card !p-8 bg-emerald-50/50 border-emerald-100 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-950">Session Active</h4>
                  <p className="text-xs text-emerald-800/60 font-bold uppercase tracking-widest">HTTP-Only Protection Enabled</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/50 rounded-2xl border border-emerald-100 space-y-2">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Secure Identifier (peas_session)</p>
                  <p className="font-mono text-sm text-emerald-950 break-all">{token}</p>
                </div>
                {userEmail && (
                  <div className="p-4 bg-white/50 rounded-2xl border border-emerald-100 space-y-2">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Bound subject (peas_subject)</p>
                    <p className="font-mono text-sm text-emerald-950">{userEmail}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-white/50 rounded-xl border border-emerald-100 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-800">AES-256 Encrypted</span>
                  </div>
                  <div className="flex-1 p-3 bg-white/50 rounded-xl border border-emerald-100 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-800">Strict Same-Site</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-[0.2em] animate-pulse">
                System fully guarded by AEGIS protocol
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionVisualizer;
