/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, UserCheck, Calendar, RefreshCw, Check, AlertCircle, FileText } from 'lucide-react';
import { DatabaseState, Registration } from '../lib/dbEngine.ts';

interface RegCrudPanelProps {
  dbState: DatabaseState | null;
  onRefresh: () => void;
  currentUser: any;
}

export default function RegCrudPanel({ dbState, onRefresh, currentUser }: RegCrudPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    const uId = selectedUserId || (currentUser ? currentUser.user_id : '');
    const eId = selectedEventId;

    if (!uId || !eId) {
      setLocalError("Input Validation: Please select both a student and an event.");
      return;
    }

    try {
      const res = await fetch('/api/registrations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(uId), eventId: Number(eId) })
      });
      const result = await res.json();
      if (result.success) {
        setLocalSuccess(`INSERT SUCCESS: Generated Registration ID #${result.data.registration.registration_id}. Auto-appended Payment and Attendance check-in rows.`);
        setSelectedUserId('');
        setSelectedEventId('');
        onRefresh();
      } else {
        setLocalError(result.error || "Failed registers.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Relational backend error.");
    }
  };

  const handleDelete = async (regId: number) => {
    if (!window.confirm(`Are you sure you want to run: DELETE FROM REGISTRATIONS WHERE registration_id = ${regId}? (This will cascade delete associated Payments, Attendance, and Certificates!)`)) {
      return;
    }
    setLocalError(null);
    setLocalSuccess(null);

    try {
      const res = await fetch('/api/registrations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: regId })
      });
      const result = await res.json();
      if (result.success) {
        setLocalSuccess(`Successfully DELETED Registration #${regId} and purged cascaded entries from PAYMENTS and ATTENDANCE charts.`);
        onRefresh();
      } else {
        setLocalError(result.error || "Foreign key delete blockage.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Failed cascades.");
    }
  };

  const getStudentInfo = (uId: number) => {
    const student = dbState?.users.find(u => u.user_id === uId);
    return student ? `${student.name} (${student.usn})` : `User #${uId}`;
  };

  const getEventInfo = (eId: number) => {
    const ev = dbState?.events.find(e => e.event_id === eId);
    return ev ? ev.event_name : `Event #${eId}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Event Registrations (REGISTRATIONS Table)</h2>
        <p className="text-xs text-slate-400">
          Sign up students for designated events. Demonstrates compound unique keys, event capacity domains, and cascading records deletes.
        </p>
      </div>

      {localError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-300 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{localError}</span>
        </div>
      )}
      {localSuccess && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 text-xs text-emerald-300 rounded-lg flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{localSuccess}</span>
        </div>
      )}

      {/* New Registration Form Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-350 uppercase font-mono mb-4 flex items-center space-x-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Registration (INSERT INTO REGISTRATIONS)</span>
        </h3>
        
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          
          {/* User selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Select Student (user_id PK) *</label>
            {currentUser && currentUser.role === 'STUDENT' ? (
              <div className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-emerald-400 rounded p-2.5">
                Active Student: {currentUser.name} ({currentUser.usn})
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-200 rounded p-2.5 outline-none focus:border-green-500"
              >
                <option value="">-- Choose Student --</option>
                {dbState?.users.map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name} ({u.usn})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Event selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Select College Event (event_id PK) *</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-200 rounded p-2.5 outline-none focus:border-green-500"
            >
              <option value="">-- Choose Event --</option>
              {dbState?.events.map(e => {
                const count = dbState.registrations.filter(r => r.event_id === e.event_id && r.status === 'CONFIRMED').length;
                return (
                  <option key={e.event_id} value={e.event_id}>
                    {e.event_name} (Fee: ₹{e.registration_fee} | Cap: {count}/{e.capacity})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:brightness-110 text-slate-950 font-bold py-2.5 px-4 rounded text-xs transition flex justify-center items-center space-x-1.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            <span>Enroll Student</span>
          </button>

        </form>
      </div>

      {/* Registrations List table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">registration_id (PK)</th>
                <th className="py-3 px-4">Student Name (FK)</th>
                <th className="py-3 px-4">Event Selected (FK)</th>
                <th className="py-3 px-4">Registration Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right font-mono">Purge Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {dbState?.registrations.map(r => (
                <tr key={r.registration_id} className="hover:bg-slate-850/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">#{r.registration_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{getStudentInfo(r.user_id)}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-100">{getEventInfo(r.event_id)}</td>
                  <td className="py-3.5 px-4 font-mono">{r.registration_date}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                      r.status === 'CONFIRMED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : r.status === 'PENDING' 
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/10'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(r.registration_id)}
                      className="inline-flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded text-red-550 hover:text-red-400 hover:border-red-500/30 transition text-xs"
                      title="Delete Registration (Cascades Payments/Attendance)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {(!dbState || dbState.registrations.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-mono text-slate-500">
                    No registrations found.
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
