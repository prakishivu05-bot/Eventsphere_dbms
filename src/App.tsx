/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import HomePanel from './components/HomePanel.tsx';
import LoginPanel from './components/LoginPanel.tsx';
import UserCrudPanel from './components/UserCrudPanel.tsx';
import EventCrudPanel from './components/EventCrudPanel.tsx';
import RegCrudPanel from './components/RegCrudPanel.tsx';
import AttendancePanel from './components/AttendancePanel.tsx';
import PaymentPanel from './components/PaymentPanel.tsx';
import CertificatePanel from './components/CertificatePanel.tsx';
import DashboardPanel from './components/DashboardPanel.tsx';
import { DatabaseState, User } from './lib/dbEngine.ts';
import { ActiveTab, UIState } from './types.ts';
import { RefreshCw, PlaySquare, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  
  // Dynamic aggregations mapped to stored procedures/views
  const [participantCount, setParticipantCount] = useState<any | null>(null);
  const [revenueSummary, setRevenueSummary] = useState<any | null>(null);
  const [eventParticipationView, setEventParticipationView] = useState<any[] | null>(null);
  const [certificateStatusView, setCertificateStatusView] = useState<any[] | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [triggerLogs, setTriggerLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronize state with Express server
  const fetchDbState = async () => {
    try {
      const res = await fetch('/api/db/state');
      const data = await res.json();
      if (data) {
        setDbState(data.state);
        setParticipantCount(data.participantCount);
        setRevenueSummary(data.revenueSummary);
        setEventParticipationView(data.eventParticipationView);
        setCertificateStatusView(data.certificateStatusView);
      }
    } catch (err) {
      console.error("Express API offline, fallback to direct memory state.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbState();
  }, []);

  const handleResetDb = async () => {
    if (!window.confirm("Restore database tables back to pre-seeded raw values? This wipes existing custom entries.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/db/reset', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        fetchDbState();
        setTriggerLogs([]);
        alert("Success: Database re-seeded.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      
      <div>
        {/* Navigation header */}
        <Header 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setTriggerLogs([]); // wipe logs on pane switches
          }} 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
        />

        {/* Core Main container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3 font-mono">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-500">Initiating EventSphere Relational Engine...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Reset database banner for the assessor */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap gap-4 items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive Evaluator: Feel free to reset at any time during tests.</span>
                </div>
                <button
                  onClick={handleResetDb}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-red-500/10 text-slate-350 hover:text-red-400 border border-slate-800 hover:border-red-500/20 rounded font-bold transition cursor-pointer"
                >
                  Truncate & Re-Seed (RESET DATABASE)
                </button>
              </div>

              {/* RENDER CURRENT VIEW TAB */}
              {activeTab === 'home' && (
                <HomePanel 
                  dbState={dbState} 
                  participantCount={participantCount} 
                  revenueSummary={revenueSummary} 
                  setActiveTab={setActiveTab}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'login' && (
                <LoginPanel 
                  users={dbState?.users || []} 
                  setCurrentUser={setCurrentUser} 
                  setActiveTab={setActiveTab} 
                />
              )}

              {activeTab === 'students' && (
                <UserCrudPanel 
                  users={dbState?.users || []} 
                  onRefresh={fetchDbState}
                  setErrorState={() => {}}
                />
              )}

              {activeTab === 'events' && (
                <EventCrudPanel 
                  events={dbState?.events || []} 
                  onRefresh={fetchDbState}
                  setTriggerLogs={setTriggerLogs}
                />
              )}

              {activeTab === 'registrations' && (
                <RegCrudPanel 
                  dbState={dbState} 
                  onRefresh={fetchDbState} 
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendancePanel 
                  dbState={dbState} 
                  onRefresh={fetchDbState} 
                  setTriggerLogs={setTriggerLogs}
                  triggerLogs={triggerLogs}
                />
              )}

              {activeTab === 'payments' && (
                <PaymentPanel 
                  dbState={dbState} 
                  onRefresh={fetchDbState} 
                  setTriggerLogs={setTriggerLogs}
                  triggerLogs={triggerLogs}
                />
              )}

              {activeTab === 'certificates' && (
                <CertificatePanel 
                  dbState={dbState}
                  certificateStatusView={certificateStatusView}
                  onRefresh={fetchDbState}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardPanel 
                  dbState={dbState} 
                  onRefresh={fetchDbState} 
                />
              )}

            </div>
          )}

        </main>
      </div>

      {/* Dynamic footer credentials block */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono space-y-1 mt-12">
        <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
          EventSphere DBMS Mini Project (College Lab Assessment)
        </p>
        <p>
          Student Name: <strong className="text-slate-350">Vikram Sen</strong> • USN: <strong className="text-slate-350">1BI24CS154</strong>
        </p>
        <p>
          Faculty Evaluated under Bangalore Institute of Technology, VTU Board, India (2026).
        </p>
      </footer>

    </div>
  );
}
