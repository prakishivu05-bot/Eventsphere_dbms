/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserCheck, CheckCircle2, XSquare, Clock, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { DatabaseState } from '../lib/dbEngine.ts';

interface AttendancePanelProps {
  dbState: DatabaseState | null;
  onRefresh: () => void;
  setTriggerLogs: (logs: string[]) => void;
  triggerLogs: string[];
}

export default function AttendancePanel({ dbState, onRefresh, setTriggerLogs, triggerLogs }: AttendancePanelProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdateStatus = async (attendanceId: number, status: 'PRESENT' | 'ABSENT' | 'PENDING') => {
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/attendance/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId, status })
      });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg(`UPDATED Attendance Row ID #${attendanceId} status to "${status}".`);
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
      
      {/* Module info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-sans">Student Attendance & Roaster (ATTENDANCE Table)</h2>
          <p className="text-xs text-slate-400 font-sans">
            Verify student check-in times. Displays how SQL triggers cascade and automate secondary tasks.
          </p>
        </div>
      </div>

      {/* Trigger 1 Alert Explanation */}
      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl space-y-1.5 text-xs">
        <h4 className="font-bold flex items-center space-x-2 text-indigo-200 uppercase font-mono">
          <Award className="w-4 h-4 text-indigo-400" />
          <span>DBMS Trigger 1: Certificate Generation Trigger</span>
        </h4>
        <p className="leading-relaxed">
          When a student's attendance status is updated to <span className="text-white hover:underline">PRESENT</span>, an active SQL database trigger detects this state and automatically inserts a certificate row associated with that student's registration.
        </p>
      </div>

      {/* Trigger Fired Log Drawer */}
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

      {/* Attendance Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">attendance_id (PK)</th>
                <th className="py-3 px-4">Student (Relation)</th>
                <th className="py-3 px-4">Target Event</th>
                <th className="py-3 px-4">Check-in Timestamp</th>
                <th className="py-3 px-4 text-center">Current Status</th>
                <th className="py-3 px-4 text-center">Set Status Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {dbState?.attendance.map(a => (
                <tr key={a.attendance_id} className="hover:bg-slate-850/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">#{a.attendance_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{getStudentInfo(a.registration_id)}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">{getEventName(a.registration_id)}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {a.check_in_time ? (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{a.check_in_time}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold italic">Not Checked-in</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                      a.attendance_status === 'PRESENT' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : a.attendance_status === 'ABSENT' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {a.attendance_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex space-x-1.5">
                      <button
                        onClick={() => handleUpdateStatus(a.attendance_id, 'PRESENT')}
                        className={`px-3 py-1 bg-slate-950 border border-slate-850 rounded hover:bg-slate-900 text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                          a.attendance_status === 'PRESENT' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 'text-slate-400'
                        }`}
                        title="Mark Present (Fires trigger)"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PRESENT</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(a.attendance_id, 'ABSENT')}
                        className={`px-3 py-1 bg-slate-950 border border-slate-850 rounded hover:bg-slate-900 text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                          a.attendance_status === 'ABSENT' ? 'text-red-400 border-red-500/30 bg-red-400/5' : 'text-slate-400'
                        }`}
                        title="Mark Absent"
                      >
                        <XSquare className="w-3.5 h-3.5" />
                        <span>ABSENT</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(a.attendance_id, 'PENDING')}
                        className="px-2 py-1 bg-slate-950 border border-slate-850 text-slate-500 rounded hover:bg-slate-900 text-[10px] font-bold transition"
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!dbState || dbState.attendance.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-mono text-slate-500">
                    No active student rosters found. Register students to populate attendance sheets.
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
