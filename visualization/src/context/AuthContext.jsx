import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { getDeviceFingerprint } from '../lib/deviceFingerprint';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [fp, setFp] = useState('');

  useEffect(() => {
    getDeviceFingerprint().then(setFp);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet('/api/auth/me');
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fp) return;
    refresh();
  }, [fp, refresh]);

  const register = useCallback(
    async (email, password) => {
      return apiPost('/api/auth/register', {
        email,
        password,
        deviceFingerprint: fp
      });
    },
    [fp]
  );

  const login = useCallback(
    async (email, password) => {
      const r = await apiPost('/api/auth/login', {
        email,
        password,
        deviceFingerprint: fp
      });
      if (r.status === 'authenticated' && r.user) setUser(r.user);
      return r;
    },
    [fp]
  );

  const verifyTotp = useCallback(
    async (tempToken, code) => {
      const r = await apiPost('/api/auth/verify-totp', {
        tempToken,
        code: String(code).replace(/\s/g, ''),
        deviceFingerprint: fp
      });
      if (r.status === 'authenticated') setUser(r.user);
      return r;
    },
    [fp]
  );

  const logout = useCallback(async () => {
    await apiPost('/api/auth/logout', { deviceFingerprint: fp });
    setUser(null);
  }, [fp]);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      deviceFingerprint: fp,
      refresh,
      register,
      login,
      verifyTotp,
      logout,
      isAuthenticated: Boolean(user?.email)
    }),
    [user, authLoading, fp, refresh, register, login, verifyTotp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
