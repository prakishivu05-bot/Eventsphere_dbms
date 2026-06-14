/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CreditCard, Check, ShieldAlert, Coins, Sparkles, RefreshCw } from 'lucide-react';
import { DatabaseState } from '../lib/dbEngine.ts';

interface PaymentPanelProps {
  dbState: DatabaseState | null;
  onRefresh: () => void;
  setTriggerLogs: (logs: string[]) => void;
  triggerLogs: string[];
}

export default function PaymentPanel({ dbState, onRefresh, setTriggerLogs, triggerLogs }: PaymentPanelProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdateStatus = async (paymentId: number, status: 'SUCCESS' | 'FAILED' | 'PENDING') => {
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/payments/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status })
      });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg(`UPDATED Ledger payment status.`);
        if (result.triggerLogs && result.triggerLogs.length > 0) {
          setTriggerLogs(result.triggerLogs);
        } else {
          setTriggerLogs([]);
        }
        onRefresh();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const getStudentInfo = (regId: number) => {
    const reg = dbState?.registrations.find(r => r.registration_id === regId);
    if (!reg) return 'N/A';
    const student = dbState?.users.find(u => u.user_id === reg.user_id);
    return student ? `${student.name} (${student.usn})` : `Reg #${regId}`;
  };

  const getEventName = (regId: number) => {
    const reg = dbState?.registrations.find(r => r.registration_id === regId);
    if (!reg) return 'N/A';
    const ev = dbState?.events.find(e => e.event_id === reg.event_id);
    return ev ? ev.event_name : `Event #${reg.event_id}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Payment Ledger & Invoicing (PAYMENTS Table)</h2>
        <p className="text-xs text-slate-400">
          Verify transactional financial balances for registrations. Demonstrates state audits.
        </p>
      </div>

      {/* Trigger 3 description block */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl space-y-1.5 text-xs">
        <h4 className="font-bold flex items-center space-x-2 text-purple-200 uppercase font-mono">
          <Coins className="w-4 h-4 text-purple-400" />
          <span>DBMS Trigger 3: Payment Audit Trigger</span>
        </h4>
        <p className="leading-relaxed">
          When payment status becomes <span className="text-white hover:underline">SUCCESS</span>, a SQL Trigger automatically captures security logs and populates a dedicated transactional audit log table called <span className="text-white font-mono">PAYMENT_AUDIT</span> directly on the server.
        </p>
      </div>

      {/* Live Server Trigger Log Trace */}
      {triggerLogs.length > 0 && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl space-y-1 text-xs font-mono animate-pulse">
          <span className="font-bold uppercase tracking-wide block text-emerald-400">
            [DBMS SERVER TRACE: TRIGGER ENGAGED]
          </span>
          {triggerLogs.map((log, idx) => (
            <p key={idx} className="leading-relaxed">&gt; {log}</p>
          ))}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-slate-900 border border-slate-800 text-xs text-emerald-400 rounded-lg">
          {successMsg}
        </div>
      )}

      {/* Payments table list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">payment_id (PK)</th>
                <th className="py-3 px-4">Student (Relation)</th>
                <th className="py-3 px-4">Target Event</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Commit Ledger Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {dbState?.payments.map(p => (
                <tr key={p.payment_id} className="hover:bg-slate-850/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">#{p.payment_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{getStudentInfo(p.registration_id)}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">{getEventName(p.registration_id)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                    ₹{p.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                      p.payment_status === 'SUCCESS' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : p.payment_status === 'FAILED' 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                        : 'bg-slate-850 text-slate-400 border border-slate-700'
                    }`}>
                      {p.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {p.payment_status === 'PENDING' ? (
                      <div className="inline-flex space-x-1.5">
                        <button
                          onClick={() => handleUpdateStatus(p.payment_id, 'SUCCESS')}
                          className="px-3 py-1 bg-emerald-500 hover:brightness-110 text-slate-950 rounded text-[10px] font-bold transition cursor-pointer flex items-center space-x-0.5"
                          title="Confirm Payment (Fires Trigger 3)"
                        >
                          <Check className="w-3 h-3 text-slate-950" />
                          <span>MARK PAID (SUCCESS)</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(p.payment_id, 'FAILED')}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-red-500/20 rounded text-[10px] text-red-400 font-bold transition"
                        >
                          FAIL
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(p.payment_id, 'PENDING')}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-500 rounded hover:bg-slate-900 text-[10px] font-bold transition"
                      >
                        Revert Pending
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(!dbState || dbState.payments.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-mono text-slate-500">
                    No active invoice sheets. Register students to establish invoice ledgers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
