import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Gauge } from 'lucide-react';

function scorePassword(pw) {
  if (!pw) return { score: 0, label: 'Empty', color: 'text-gray-400' };
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['text-red-500', 'text-amber-500', 'text-yellow-600', 'text-emerald-600', 'text-emerald-700'];
  const idx = Math.min(s, 4);
  return { score: idx, label: labels[idx], color: colors[idx] };
}

const UserInputStep = ({ email, password, onEmailChange, onPasswordChange }) => {
  const strength = useMemo(() => scorePassword(password), [password]);

  return (
    <div className="w-full max-w-md mx-auto space-y-8 py-4">
      <div className="premium-card !p-8 space-y-6 text-left">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/40 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            Email
          </label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-mono text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/40 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Never sent to a server in this demo"
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-mono text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
          />
        </div>
      </div>

      <div className="px-2 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-secondary/40">
          <span className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Live strength
          </span>
          <span className={strength.color}>{strength.label}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${(strength.score / 4) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <p className="text-[11px] text-secondary/60 leading-relaxed">
          Values stay in this browser tab for the demo flow. The next step hashes the password you enter here with bcrypt.
        </p>
      </div>
    </div>
  );
};

export default UserInputStep;
