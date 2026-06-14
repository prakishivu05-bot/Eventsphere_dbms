/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, Terminal, ShieldCheck, User as UserIcon, LogOut } from 'lucide-react';
import { ActiveTab } from '../types.ts';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: { name: string; role: 'STUDENT' | 'ORGANIZER' | 'VOLUNTEER'; userId?: number } | null;
  setCurrentUser: (user: any) => void;
}

export default function Header({ activeTab, setActiveTab, currentUser, setCurrentUser }: HeaderProps) {
  return (
    <header id="app-header" className="bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-lg shadow-sm">
              <Database className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-sans font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                EventSphere
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 block uppercase">
                DBMS Mini Project
              </span>
            </div>
          </div>

          {/* Quick Access Stats & Credentials */}
          <div className="hidden md:flex items-center space-x-4 text-xs font-mono">
            <span className="text-slate-500 px-2 py-1 bg-slate-950 border border-slate-800 rounded">
              DB Engine: <span className="text-emerald-400 font-bold text-xs">MySQL v8.0 / TS-WASM</span>
            </span>
            <span className="text-slate-500 px-2 py-1 bg-slate-950 border border-slate-800 rounded">
              Normalization: <span className="text-emerald-400 font-bold text-xs">3NF compliant</span>
            </span>
          </div>

          {/* Active User Controls */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-lg">
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-200">{currentUser.name}</div>
                  <div className="text-[9px] font-mono text-emerald-400">{currentUser.role}</div>
                </div>
                <button 
                  onClick={() => setCurrentUser(null)} 
                  title="Logout Session"
                  className="ml-2 p-1 text-slate-400 hover:text-red-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="flex items-center space-x-1 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-lg text-xs font-medium transition"
              >
                <span>Authorize Login</span>
              </button>
            )}
          </div>

        </div>
      </div>
      
      {/* Dynamic Sub-Navigation Header */}
      <nav className="bg-slate-950/80 backdrop-blur border-t border-slate-900 scrollbar-none overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 py-1">
          {[
            { id: 'home', label: 'Home System' },
            { id: 'dashboard', label: 'Database Dashboard' },
            { id: 'students', label: 'Students (USERS)' },
            { id: 'events', label: 'Events' },
            { id: 'registrations', label: 'Registrations' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'payments', label: 'Payments' },
            { id: 'certificates', label: 'Certificates (VIEW 2)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
