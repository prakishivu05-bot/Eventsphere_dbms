/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Award, Printer, ShieldCheck, CreditCard, RefreshCw } from 'lucide-react';
import { DatabaseState } from '../lib/dbEngine.ts';

interface CertificatePanelProps {
  dbState: DatabaseState | null;
  certificateStatusView: Array<{ student_name: string; usn: string; event_name: string; certificate_status: string; issue_date: string }> | null;
  onRefresh: () => void;
}

export default function CertificatePanel({ dbState, certificateStatusView, onRefresh }: CertificatePanelProps) {
  const [activeCert, setActiveCert] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-sans">Certificate Registry (CERTIFICATES View)</h2>
          <p className="text-xs text-slate-400 font-sans">
            Lists students with marked PRESENT attendance rosters. Generated dynamically from database view schema.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-1 border border-slate-800 bg-slate-900 rounded p-1.5 text-xs text-slate-450 hover:text-white transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Synchronize View</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left pane - Table view listing generated certificates */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-950 p-3 border-b border-slate-800">
            <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">
              SELECT * FROM CertificateStatusView (Relational VIEW 2)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead className="bg-slate-955 border-b border-primary text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">USN</th>
                  <th className="py-3 px-4">Enrolled Event</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4 text-center">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {certificateStatusView?.map((cert, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">{cert.student_name}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{cert.usn}</td>
                    <td className="py-3 px-4 text-slate-200">{cert.event_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{cert.issue_date}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setActiveCert(cert)}
                        className="p-1 px-2.5 bg-slate-950 border border-slate-850 text-[10px] text-emerald-450 rounded hover:border-emerald-500/30 transition hover:bg-slate-900 font-mono font-semibold"
                      >
                        VIEW CREDENTIALS
                      </button>
                    </td>
                  </tr>
                ))}
                {(!certificateStatusView || certificateStatusView.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center font-mono text-slate-500">
                      No certificates generated yet. Set student attendance to PRESENT on Attendance tab to initiate Trigger 1.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right pane - Certificate visualizer mockup preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-fit min-h-96 shadow">
          {activeCert ? (
            <div className="space-y-6">
              
              {/* Actual Certificate Map Frame */}
              <div className="p-6 bg-slate-950 border-4 border-double border-slate-800 relative rounded-lg text-center text-slate-350 space-y-4">
                
                {/* Academic Crest */}
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
                    Bangalore Institute of Technology
                  </h4>
                  <h3 className="text-sm font-bold text-slate-100 uppercase font-sans">
                    Certificate of Excellence
                  </h3>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  This is to certify that student
                </p>

                <div className="space-y-0.5">
                  <h2 className="text-sm font-extrabold text-white tracking-wide font-sans">{activeCert.student_name}</h2>
                  <p className="text-[9px] font-mono text-emerald-400">USN: {activeCert.usn}</p>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed px-2">
                  has successfully attended and qualified the college technical session on 
                  <strong className="text-slate-100 block mt-1 font-semibold">"{activeCert.event_name}"</strong>
                </p>

                <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 pt-4 border-t border-slate-900">
                  <div>
                    <span>DATE: {activeCert.issue_date}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold border border-emerald-505 px-1 py-0.5 rounded leading-none">
                      VERIFIED_DB
                    </span>
                  </div>
                  <div>
                    <span>REGT: {activeCert.certificate_status}</span>
                  </div>
                </div>

              </div>

              {/* Utility buttons */}
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center space-x-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 font-bold text-xs py-2 px-4 rounded-lg transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Physical Copy</span>
              </button>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Award className="w-12 h-12 text-slate-650" />
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">Creds Preview Frame</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Select a student credential record from the left table view to display the accredited university merit certificate layout instantly.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
