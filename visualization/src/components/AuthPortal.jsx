import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Shield, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthPortal = () => {
  const { register, login, verifyTotp, authLoading } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [totpStep, setTotpStep] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [setup, setSetup] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await register(email, password);
      setSetup(r);
      setMode('done-register');
    } catch (ex) {
      setErr(ex.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await login(email, password);
      if (r.status === 'authenticated') {
        setTotpStep(null);
        setOtp(['', '', '', '', '', '']);
        return;
      }
      if (r.status === 'totp_required') {
        setTotpStep(r.tempToken);
        setOtp(['', '', '', '', '', '']);
        return;
      }
      setErr('Unexpected response');
    } catch (ex) {
      setErr(ex.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const submitTotp = async (explicitCode) => {
    const code = explicitCode ?? otp.join('');
    if (code.length !== 6) return;
    setErr('');
    setBusy(true);
    try {
      await verifyTotp(totpStep, code);
      setTotpStep(null);
      setOtp(['', '', '', '', '', '']);
    } catch (ex) {
      setErr(ex.message || 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  const onOtpChange = (i, v) => {
    if (v.length > 1) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) document.getElementById(`auth-totp-${i + 1}`)?.focus();
    if (next.every((x) => x !== '') && next.join('').length === 6) {
      void submitTotp(next.join(''));
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {mode === 'done-register' && setup ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card !p-8 space-y-4 text-left"
          >
            <h3 className="text-xl font-serif text-primary flex items-center gap-2">
              <Shield className="w-6 h-6 text-accent" />
              Save your authenticator
            </h3>
            <p className="text-sm text-secondary leading-relaxed">
              Scan the issuer <b>ProjectAEGIS</b> in your app, or enter the secret manually. You will need this code when
              you sign in from a <b>new network or browser</b> (same idea as Google’s new-device prompt).
            </p>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-mono text-xs break-all">{setup.totpSetup?.secret}</div>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setSetup(null);
              }}
              className="w-full py-3 rounded-2xl bg-primary text-white font-bold"
            >
              Continue to sign in
            </button>
          </motion.div>
        ) : totpStep ? (
          <motion.div
            key="totp"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card !p-8 space-y-6"
          >
            <div className="text-center space-y-2">
              <KeyRound className="w-10 h-10 mx-auto text-indigo-600" />
              <h3 className="text-xl font-serif">Step-up required</h3>
              <p className="text-sm text-secondary">
                This IP + device is not trusted yet. Enter the 6-digit code from your authenticator.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`auth-totp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => onOtpChange(i, e.target.value)}
                  className="w-10 h-12 text-center text-xl font-bold rounded-xl border border-gray-200"
                />
              ))}
            </div>
            {err && <p className="text-sm text-red-600 text-center font-bold">{err}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={() => submitTotp()}
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold disabled:opacity-50"
            >
              {busy ? 'Verifying…' : 'Verify & continue'}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={mode === 'register' ? handleRegister : handleLogin}
            className="premium-card !p-8 space-y-5 text-left"
          >
            <div className="flex rounded-2xl bg-gray-100 p-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErr('');
                }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-white shadow' : 'text-secondary'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErr('');
                }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-white shadow' : 'text-secondary'}`}
              >
                Register
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/40 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/40 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Password
              </label>
              <input
                type="password"
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {err && <p className="text-sm text-red-600 font-bold">{err}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-4 rounded-2xl bg-accent text-white font-bold shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
            <p className="text-[11px] text-secondary/70 leading-relaxed">
              Password policy: 8+ characters with uppercase, lowercase, and a digit. Server stores bcrypt hashes and
              evaluates <b>IP + device fingerprint</b> on each login.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPortal;
