import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Smartphone, QrCode, Key, RefreshCw, AlertCircle } from 'lucide-react';
import { TOTP } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import QRCode from 'qrcode';

const authenticator = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});

const MFASimulator = ({ userEmail = '', onMfaVerified }) => {
  const [step, setStep] = useState('setup');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const newSecret = authenticator.generateSecret();
      const otpauth = authenticator.toURI({
        issuer: 'ProjectAEGIS',
        label: userEmail || 'User@PEAS',
        secret: newSecret
      });
      const qrData = await QRCode.toDataURL(otpauth);
      if (cancelled) return;
      setSecret(newSecret);
      setQrCodeUrl(qrData);
      setStep('setup');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!secret) return;
    let cancelled = false;
    (async () => {
      const otpauth = authenticator.toURI({
        issuer: 'ProjectAEGIS',
        label: userEmail || 'User@PEAS',
        secret
      });
      const qrData = await QRCode.toDataURL(otpauth);
      if (!cancelled) setQrCodeUrl(qrData);
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail, secret]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(false);

    if (value && index < 5) {
      document.getElementById(`totp-${index + 1}`)?.focus();
    }

    if (newOtp.every((v) => v !== '')) {
      void verify(newOtp.join(''));
    }
  };

  const verify = async (token) => {
    try {
      const result = await authenticator.verify(token, {
        secret,
        epochTolerance: 30
      });

      if (result.valid) {
        setIsSuccess(true);
        setError(false);
        onMfaVerified?.();
      } else {
        setError(true);
        setTimeout(() => {
          setOtp(['', '', '', '', '', '']);
          document.getElementById('totp-0')?.focus();
        }, 1000);
      }
    } catch (err) {
      console.error('MFA Error:', err);
      setError(true);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 py-4">
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="interface"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="space-y-8"
          >
            {step === 'setup' ? (
              <div className="premium-card !p-8 animate-fade-in text-center space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif text-primary">Setup MFA Device</h3>
                    <p className="text-secondary text-sm">
                      Scan with Google Authenticator — account <span className="font-mono font-bold">{userEmail || 'User@PEAS'}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-inner inline-block mx-auto relative group">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-50">
                      <RefreshCw className="w-8 h-8 animate-spin text-gray-200" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Secure Protocol</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                  <p className="text-[10px] font-bold text-secondary/40 uppercase mb-2">Manual Secret Key</p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono font-bold text-indigo-900 break-all">{secret}</code>
                    <div className="flex gap-2 shrink-0">
                      <Key className="w-3 h-3 text-indigo-400" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  Code Scanned – Proceed to Verify
                </button>
              </div>
            ) : (
              <div className="premium-card !p-12 text-center space-y-10">
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-serif">Enter Code</h3>
                  <p className="text-secondary text-sm">
                    Validating active token for <b>ProjectAEGIS</b> / {userEmail || 'User@PEAS'}
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`totp-${i}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className={`w-12 h-16 text-center text-3xl font-bold rounded-2xl border bg-gray-50 outline-none transition-all ${
                        error
                          ? 'border-red-500 bg-red-50 ring-4 ring-red-100'
                          : 'border-gray-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600'
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-red-600 font-bold text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Invalid or Expired Token
                  </motion.div>
                )}

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('setup')}
                    className="text-xs font-bold text-secondary/40 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  >
                    Back to QR Code
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-8 py-12"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200">
                <ShieldCheck className="w-16 h-16" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-serif text-emerald-950">Identity Authenticated</h3>
              <p className="text-emerald-800/60 font-medium">TOTP Handshake successfully completed via AEGIS protocol.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MFASimulator;
