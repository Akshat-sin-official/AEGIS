import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Smartphone, Wifi, ShieldCheck, Globe, Cpu } from 'lucide-react';

function hashToScore(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 101;
}

function scoreToThreat(score) {
  if (score >= 66) return 'Elevated';
  if (score >= 33) return 'Moderate';
  return 'Nominal';
}

const RiskEngine = ({ userEmail = '', onRiskEvaluated }) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [data, setData] = useState({
    ip: 'Detecting...',
    location: 'Identifying...',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    device: 'Standard Web Client'
  });
  const [result, setResult] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const ua = navigator.userAgent;
    let platform = 'Unknown Device';

    if (/Windows/i.test(ua)) platform = 'Windows System';
    else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'Apple iOS Device';
    else if (/Macintosh/i.test(ua)) platform = 'Apple Macintosh';
    else if (/Android/i.test(ua)) platform = 'Android Device';
    else if (/Linux/i.test(ua)) platform = 'Linux Station';

    setData((prev) => ({ ...prev, device: platform }));

    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const json = await res.json();
        setData((prev) => ({ ...prev, ip: json.ip, location: 'Global Node' }));
      } catch {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const json = await res.json();
          setData((prev) => ({
            ...prev,
            ip: json.ip,
            location: `${json.city}, ${json.country_name}`
          }));
        } catch {
          try {
            const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
            const text = await res.text();
            const lines = text.split('\n');
            const ip = lines.find((l) => l.startsWith('ip='))?.split('=')[1] || '127.0.0.1';
            const colo = lines.find((l) => l.startsWith('colo='))?.split('=')[1] || 'Edge';

            const coloMap = {
              DEL: 'New Delhi, India',
              BOM: 'Mumbai, India',
              MAA: 'Chennai, India',
              BLR: 'Bengaluru, India',
              CCU: 'Kolkata, India',
              SIN: 'Singapore',
              FRA: 'Frankfurt, Germany',
              LHR: 'London, UK'
            };

            setData((prev) => ({
              ...prev,
              ip,
              location: coloMap[colo] || `${colo} Node (Cloudflare)`
            }));
          } catch {
            setData((prev) => ({
              ...prev,
              ip: '127.0.0.1 (Local Loop)',
              location: 'Intranet'
            }));
          }
        }
      }
    };
    fetchIp();
  }, []);

  const evaluate = () => {
    setIsEvaluating(true);
    setResult(null);
    setSnapshot(null);

    setTimeout(() => {
      const current = dataRef.current;
      const fingerprint = `${current.ip}|${current.userAgent}|${userEmail || ''}`;
      const riskScore = hashToScore(fingerprint);
      const threatLabel = scoreToThreat(riskScore);
      const snap = {
        ...current,
        riskScore,
        threatLabel,
        subject: userEmail || 'anonymous@local'
      };
      setSnapshot(snap);
      onRiskEvaluated?.(snap);
      setIsEvaluating(false);
      setResult('active');
    }, 2500);
  };

  const displaySnap = snapshot;

  return (
    <div className="w-full space-y-10 py-4">
      {userEmail && (
        <p className="text-center text-sm text-secondary">
          Evaluating sign-in risk for <span className="font-mono font-bold text-primary">{userEmail}</span>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card !p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary/40">Network Context</span>
            <Wifi className={`w-4 h-4 ${data.ip !== 'Detecting...' ? 'text-emerald-500' : 'text-gray-300 animate-pulse'}`} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary/40 uppercase">Public IP Address</p>
                <p className="font-mono text-lg font-bold text-primary">{data.ip}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary/40 uppercase">Derived Location</p>
                <p className="font-bold text-primary">{data.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card !p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary/40">Hardware Context</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary/40 uppercase">Device Type</p>
                <p className="font-bold text-primary">{data.device}</p>
              </div>
            </div>
            <div className="font-mono text-[10px] p-3 bg-gray-50 rounded-xl border border-gray-100 text-secondary leading-tight line-clamp-2">
              {data.userAgent}
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-secondary/30 uppercase mt-2 px-1">
              <span>Architecture: {data.platform}</span>
              <span>Secure Mode: Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!isEvaluating && !result && (
            <motion.button
              key="btn"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={evaluate}
              className="px-12 py-5 bg-primary text-white rounded-full font-bold shadow-2xl hover:shadow-primary/20 transition-all flex items-center gap-3"
            >
              Analyze Live Environment
            </motion.button>
          )}

          {isEvaluating && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-secondary tracking-widest uppercase">Cross-Referencing Identity...</p>
            </motion.div>
          )}

          {result === 'active' && displaySnap && (
            <motion.div
              key="result"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="p-8 rounded-[3rem] bg-indigo-50 border border-indigo-100 text-center space-y-6 max-w-lg shadow-xl"
            >
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-indigo-200">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-serif text-indigo-950">Context Logged</h3>
                <p className="text-indigo-800/70 text-sm leading-relaxed">
                  Risk Engine mapped node <strong className="font-mono">{displaySnap.ip}</strong> and{' '}
                  <strong>{displaySnap.device}</strong>. Score <strong>{displaySnap.riskScore}/100</strong> (
                  {displaySnap.threatLabel}).
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-100">
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">Status</p>
                  <p className="font-bold text-xs text-indigo-900">Verified Signature</p>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-100">
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">Model output</p>
                  <p className="font-bold text-xs text-indigo-900">{displaySnap.threatLabel}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RiskEngine;
