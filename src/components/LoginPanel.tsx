/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Star, Sparkles } from 'lucide-react';
import { User } from '../lib/dbEngine.ts';

interface LoginPanelProps {
  users: User[];
  setCurrentUser: (user: any) => void;
  setActiveTab: (tab: any) => void;
}

export default function LoginPanel({ users, setCurrentUser, setActiveTab }: LoginPanelProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  // Custom Role picker simulation
  const handleRoleLogin = (role: 'STUDENT' | 'ORGANIZER' | 'VOLUNTEER') => {
    let matchedUser = users.find(u => u.role === role);
    if (!matchedUser) {
      // fallback
      matchedUser = {
        user_id: 99,
        name: role === 'ORGANIZER' ? "Prof. CS Faculty" : `${role.toLowerCase()} user`,
        usn: role === 'ORGANIZER' ? "FACULTY_01" : "TEMP_001",
        email: "demo@bit-bangalore.edu.in",
        phone: "9999999999",
        department: "Computer Science",
        role: role
      };
    }
    setCurrentUser(matchedUser);
    setActiveTab('home');
  };

  const handleUserSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const u = users.find(x => x.user_id === Number(selectedUser));
    if (u) {
      setCurrentUser(u);
      setActiveTab('home');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Authorize Active Session</h3>
        <p className="text-xs text-slate-400">
          Log in with preconfigured database users or roles to simulate role-based event actions.
        </p>
      </div>

      {/* Role Picker */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block font-mono">
          Demo Role Fast-Login
        </span>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => handleRoleLogin('ORGANIZER')}
            className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 hover:border-emerald-500/50 hover:bg-slate-900 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500/20 transition">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Organizer Workspace</span>
                <span className="text-[10px] text-slate-500 block">Manage USERS and full EVENT CRUD operations</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition font-mono">
              Access &rarr;
            </span>
          </button>

          <button
            onClick={() => handleRoleLogin('VOLUNTEER')}
            className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 hover:border-emerald-500/50 hover:bg-slate-900 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500/20 transition">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Volunteer Workspace</span>
                <span className="text-[10px] text-slate-500 block">Assigned event roster coordinator</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition font-mono">
              Access &rarr;
            </span>
          </button>

          <button
            onClick={() => handleRoleLogin('STUDENT')}
            className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 hover:border-emerald-500/50 hover:bg-slate-900 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400 group-hover:bg-teal-500/20 transition">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Standard Student Panel</span>
                <span className="text-[10px] text-slate-500 block">Register for hackathons directly</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition font-mono">
              Access &rarr;
            </span>
          </button>
        </div>
      </div>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <span className="relative px-3 bg-slate-900 text-[10px] uppercase font-bold font-mono tracking-wider text-slate-500">
          Or Select Specific User
        </span>
      </div>

      {/* Select Specific Seed User */}
      <form onSubmit={handleUserSelect} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 font-mono mb-1">
            Preseeded Database Users
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full text-xs font-semibold bg-slate-950 border border-slate-855 text-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500/70"
          >
            <option value="">-- Choose User Tuple --</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.name} ({u.usn} - {u.role})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!selectedUser}
          className="w-full bg-emerald-500 hover:brightness-110 disabled:brightness-50 disabled:cursor-not-allowed text-slate-950 font-bold py-2 px-4 rounded-lg text-xs transition cursor-pointer"
        >
          Secure Auth Login
        </button>
      </form>

      <div className="mt-4 p-3 bg-slate-950 border border-slate-850 rounded-lg text-left">
        <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold block mb-1">DBMS VIVA TIP:</span>
        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
          Signing in sets the active actor in the app header, enabling realistic simulated registration actions.
        </p>
      </div>
    </div>
  );
}
