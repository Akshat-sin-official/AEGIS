import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Shield, History, Trash2, ShieldAlert } from 'lucide-react';

const AuditLedger = ({ logs = [], onLogsChange, journeyHint }) => {
  const clearLogs = () => {
    const reset = [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        event: 'Ledger cleared by administrator',
        status: 'alert'
      }
    ];
    onLogsChange?.(reset);
  };

  const addManualLog = () => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      event: 'Manual security check triggered',
      status: 'verified'
    };
    onLogsChange?.([newLog, ...logs].slice(0, 50));
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center">
            <Database className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Persistent Audit Repository</h3>
            <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-[0.2em]">Synced from your current journey</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addManualLog}
            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-secondary hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
          >
            <History className="w-3.5 h-3.5" />
            Manual Audit
          </button>
          <button
            type="button"
            onClick={clearLogs}
            className="px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 hover:bg-red-100 flex items-center gap-2 shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge Trail
          </button>
        </div>
      </div>

      {journeyHint && (journeyHint.email || journeyHint.hashFingerprint || journeyHint.riskSnapshot) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-[9px] font-bold text-secondary/40 uppercase mb-1">Subject</p>
            <p className="text-xs font-mono font-bold text-primary truncate" title={journeyHint.email}>
              {journeyHint.email || '—'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-[9px] font-bold text-secondary/40 uppercase mb-1">Hash prefix</p>
            <p className="text-xs font-mono font-bold text-primary truncate">
              {journeyHint.hashFingerprint ? `${journeyHint.hashFingerprint}…` : '—'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-[9px] font-bold text-secondary/40 uppercase mb-1">Last risk</p>
            <p className="text-xs font-bold text-primary">
              {journeyHint.riskSnapshot
                ? `${journeyHint.riskSnapshot.threatLabel} (${journeyHint.riskSnapshot.riskScore})`
                : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="premium-card !p-0 overflow-hidden border border-gray-200 shadow-2xl bg-white">
        <div className="flex items-center gap-4 px-8 py-5 border-b border-gray-100 bg-gray-50/30">
          <Shield className="w-5 h-5 text-accent" />
          <span className="text-sm font-bold text-primary">Read-Only Secure Ledger</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sync Active</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-200">
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-3 text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-3 text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Security Event</th>
                  <th className="px-8 py-3 text-[10px] font-bold text-secondary/40 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-8 py-4 font-mono text-xs text-secondary/60">{log.time}</td>
                      <td className="px-8 py-4 text-sm font-medium text-primary">
                        <span className="flex items-center gap-3">
                          {log.status === 'alert' && <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          {log.event}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${
                            log.status === 'system'
                              ? 'bg-blue-50 text-blue-600'
                              : log.status === 'alert'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="py-20 text-center space-y-3 opacity-20">
                <History className="w-12 h-12 mx-auto" />
                <p className="text-sm font-bold uppercase tracking-[0.3em]">No Historical Data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 border-dashed">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-[11px] text-amber-900 leading-tight">
          <b>Security Note:</b> This ledger is persisted in your browser (localStorage) for this demo. Production systems
          stream these events to a hardened store with row-level encryption.
        </p>
      </div>
    </div>
  );
};

export default AuditLedger;
