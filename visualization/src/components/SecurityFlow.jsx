import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint, Activity, ShieldCheck, Database, RefreshCw, Key, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserInputStep from './UserInputStep';
import HashVisualizer from './HashVisualizer';
import RiskEngine from './RiskEngine';
import AuditLedger from './AuditLedger';
import MFASimulator from './MFASimulator';
import SessionVisualizer from './SessionVisualizer';

const steps = [
  {
    id: 'input',
    title: 'User Input',
    icon: Lock,
    description: 'Entry of credentials with real-time strength validation. Passwords never leave the UI in plaintext.',
    color: 'blue'
  },
  {
    id: 'hashing',
    title: 'Bcrypt Hashing',
    icon: RefreshCw,
    description: 'Adaptive hashing with dynamic salting. This process is intentionally computed to be slow, resisting brute-force.',
    color: 'emerald',
    component: HashVisualizer
  },
  {
    id: 'risk',
    title: 'Contextual Risk',
    icon: Activity,
    description: 'The engine evaluates IP, Device ID, and login history to determine if secondary verification is needed.',
    color: 'amber',
    component: RiskEngine
  },
  {
    id: 'mfa',
    title: 'Multi-Factor',
    icon: Fingerprint,
    description: 'TOTP or Email OTP verification for suspicious contexts. Provides the secondary lock to the identity vault.',
    color: 'indigo',
    component: MFASimulator
  },
  {
    id: 'audit',
    title: 'Audit Ledger',
    icon: Database,
    description: 'Every attempt is logged in a tamper-proof repository to ensure traceability and detect patterns of abuse.',
    color: 'rose',
    component: AuditLedger
  },
  {
    id: 'session',
    title: 'Secure Session',
    icon: Key,
    description: 'Issuance of HTTP-only cookies and cryptographic handshake completion. The final digital key to your vault.',
    color: 'emerald',
    component: SessionVisualizer
  }
];

const AUDIT_KEY = 'peast_audit_logs';

const SecurityFlow = ({ onBack }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hashFingerprint, setHashFingerprint] = useState(null);
  const [riskSnapshot, setRiskSnapshot] = useState(null);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUDIT_KEY);
      if (raw) {
        setAuditLog(JSON.parse(raw));
        return;
      }
      const initial = [
        { id: 1, time: new Date().toLocaleTimeString(), event: 'AEGIS Kernel initialized', status: 'system' },
        { id: 2, time: new Date().toLocaleTimeString(), event: 'Persistence layer verified', status: 'system' }
      ];
      setAuditLog(initial);
      localStorage.setItem(AUDIT_KEY, JSON.stringify(initial));
    } catch {
      setAuditLog([]);
    }
  }, []);

  const appendAudit = useCallback((event, status = 'verified') => {
    setAuditLog((prev) => {
      const row = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        event,
        status
      };
      const next = [row, ...prev].slice(0, 50);
      localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const threatDisplay = useMemo(() => {
    if (!riskSnapshot) {
      return { label: 'Pending', className: 'text-secondary' };
    }
    const t = riskSnapshot.threatLabel;
    if (t === 'Elevated') return { label: 'Elevated', className: 'text-amber-600' };
    if (t === 'Moderate') return { label: 'Moderate', className: 'text-amber-500' };
    return { label: 'Nominal', className: 'text-blue-500' };
  }, [riskSnapshot]);

  const renderStepBody = () => {
    if (activeStep === 0) {
      return (
        <UserInputStep
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
        />
      );
    }
    const common = { key: activeStep };
    switch (steps[activeStep].id) {
      case 'hashing':
        return (
          <HashVisualizer
            {...common}
            password={password}
            onHashComplete={({ hash, salt }) => {
              setHashFingerprint(hash.slice(0, 16));
              appendAudit(
                `Password hashed (bcrypt) for ${email || 'user'} — salt rounds applied`,
                'verified'
              );
            }}
          />
        );
      case 'risk':
        return (
          <RiskEngine
            {...common}
            userEmail={email}
            onRiskEvaluated={(snap) => {
              setRiskSnapshot(snap);
              appendAudit(
                `Risk evaluated: ${snap.threatLabel} (${snap.riskScore}/100) — ${snap.ip}`,
                'verified'
              );
            }}
          />
        );
      case 'mfa':
        return (
          <MFASimulator
            {...common}
            userEmail={email}
            onMfaVerified={() => {
              setMfaVerified(true);
              appendAudit(`TOTP verified for ${email || 'user'}`, 'verified');
            }}
          />
        );
      case 'audit':
        return (
          <AuditLedger
            {...common}
            logs={auditLog}
            onLogsChange={(next) => {
              setAuditLog(next);
              localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
            }}
            journeyHint={{ email, hashFingerprint, riskSnapshot, mfaVerified }}
          />
        );
      case 'session':
        return (
          <SessionVisualizer
            {...common}
            userEmail={email}
            riskSnapshot={riskSnapshot}
            mfaVerified={mfaVerified}
            onSessionIssued={(token) => {
              setSessionToken(token);
              appendAudit(`Session cookie issued for ${email || 'user'}`, 'verified');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <button
          onClick={onBack}
          className="text-secondary hover:text-primary transition-all flex items-center gap-2 group w-fit"
        >
          <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="font-bold text-sm tracking-tight uppercase">Return to Overview</span>
        </button>
        <div className="flex items-center gap-6 glass !p-2 px-6 rounded-2xl border-white/50">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30">System Guard</p>
            <div className="text-sm font-bold text-accent flex items-center gap-2 justify-end">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" aria-hidden />
              Operational
            </div>
          </div>
          <div className="w-[1px] h-10 bg-gray-100" />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30">Threat Level</p>
            <p className={`text-sm font-bold ${threatDisplay.className}`}>{threatDisplay.label}</p>
          </div>
          {(email || sessionToken) && (
            <>
              <div className="w-[1px] h-10 bg-gray-100 hidden sm:block" />
              <div className="text-right min-w-0 max-w-[200px] hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30">Subject</p>
                <p className="text-sm font-bold text-primary truncate font-mono" title={email}>
                  {email || '—'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-3">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            const isCompleted = idx < activeStep;
            const Icon = step.icon;

            return (
              <motion.button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`w-full premium-card !p-5 flex items-center gap-5 text-left transition-all ${
                  isActive ? 'ring-4 ring-accent/10 border-accent/20 bg-emerald-50/10' : 'opacity-40 hover:opacity-100'
                }`}
                whileHover={{ x: 10, scale: 1.02 }}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-110' : 'bg-gray-50 text-secondary'
                  }`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-secondary/40 mb-1">Step 0{idx + 1}</h3>
                  <h3 className={`font-bold text-lg leading-none ${isActive ? 'text-primary' : 'text-secondary'}`}>
                    {step.title}
                  </h3>
                </div>
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="lg:col-span-8 bg-white/50 backdrop-blur-3xl rounded-[3rem] p-16 shadow-2xl border border-white/50 min-h-[600px] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck className="w-64 h-64 -rotate-12" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 1.1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col h-full items-center justify-center"
            >
              <div className="text-center space-y-6 max-w-xl w-full">
                <div className="space-y-4">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-serif text-primary"
                  >
                    {steps[activeStep].title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-secondary text-lg leading-relaxed"
                  >
                    {steps[activeStep].description}
                  </motion.p>
                </div>

                <div className="py-12 w-full min-h-[300px] flex items-center justify-center">
                  {renderStepBody() ?? (
                    <div className="p-12 glass rounded-[2rem] border-dashed border-gray-200 flex flex-col items-center justify-center text-secondary/30 space-y-4">
                      <RefreshCw className="w-12 h-12 animate-spin-slow opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest italic font-serif">Awaiting Simulation Data...</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-center pt-8">
                  <motion.button
                    type="button"
                    whileHover={{ x: -10 }}
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((s) => s - 1)}
                    className="px-8 py-3 rounded-full border border-gray-100 bg-white text-sm font-bold text-secondary hover:shadow-xl hover:bg-gray-50 disabled:opacity-30 transition-all flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Protocol
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ x: 10, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (activeStep === steps.length - 1 ? onBack() : setActiveStep((s) => s + 1))}
                    className="px-10 py-3 bg-primary text-white rounded-full text-sm font-bold hover:shadow-2xl hover:shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    {activeStep === steps.length - 1 ? 'Complete Journey' : 'Proceed to Next Level'}
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SecurityFlow;
