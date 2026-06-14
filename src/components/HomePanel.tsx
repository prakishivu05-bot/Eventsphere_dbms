/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, UserCheck, CreditCard, Award, GraduationCap, Flame, ArrowRight, ShieldAlert, FolderKey } from 'lucide-react';
import { DatabaseState, Event } from '../lib/dbEngine.ts';
import { ActiveTab } from '../types.ts';

interface HomePanelProps {
  dbState: DatabaseState | null;
  participantCount: { total_registered: number; total_present_attendance: number } | null;
  revenueSummary: { total_revenue: number; successful_payments: number; failed_payments: number } | null;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: any;
}

export default function HomePanel({ dbState, participantCount, revenueSummary, setActiveTab, currentUser }: HomePanelProps) {
  const usersCount = dbState?.users?.length || 0;
  const eventsCount = dbState?.events?.length || 0;
  
  return (
    <div className="space-y-6">
      
      {/* Hero Welcome Info Card */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400 mb-4">
            <Flame className="w-3.5 h-3.5" />
            <span>Interactive Relational DBMS Demonstrator (v1.2)</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-sans font-bold text-white tracking-tight leading-tight">
            EventSphere: Smart Event Management System
          </h2>
          
          <p className="mt-3 text-slate-300 text-sm md:text-base leading-relaxed">
            A comprehensive DBMS Mini Project implementing 3NF normalization, real SQL trigger-hooks, views, compiled procedures, and cascading integrity constraints. Built specifically for CS evaluation panels and DBMS VIVA presentations.
          </p>

          {/* Student Credentials Module */}
          <div className="mt-6 p-4 bg-slate-950/70 border border-slate-800 rounded-xl max-w-xl">
            <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-2">
              EXAMINER BRIEFING & CREDENTIALS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 font-mono">
              <div>
                <span className="text-slate-500">Candidate USN:</span> <span className="text-white font-bold">1BI24CS154</span>
              </div>
              <div>
                <span className="text-slate-500">Department:</span> <span className="text-white">Computer Science & Eng.</span>
              </div>
              <div>
                <span className="text-slate-500">Institution:</span> <span className="text-white font-semibold">BIT Bangalore</span>
              </div>
              <div>
                <span className="text-slate-500">Project Type:</span> <span className="text-white">DBMS Mini Project (18CSL57)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 px-5 py-2.5 rounded-lg font-semibold text-sm shadow hover:brightness-110 transition cursor-pointer"
            >
              <span>Explore Database Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </div>

      {/* Stored Procedures Outputs Summary (Metrics Panel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">Database Size</span>
            <div className="p-2 bg-slate-950 rounded-lg text-slate-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-sans text-white">8 Tables</h3>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              {usersCount} Students • {eventsCount} Active Events
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">Registrations</span>
            <div className="p-2 bg-slate-950 rounded-lg text-slate-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-sans text-white">
              {participantCount?.total_registered || 0} enrolled
            </h3>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Active Attendance Check-ins: {participantCount?.total_present_attendance || 0}
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">Ledger Revenue</span>
            <div className="p-2 bg-slate-950 rounded-lg text-slate-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-sans text-emerald-400">
              ₹{(revenueSummary?.total_revenue || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Payments: {revenueSummary?.successful_payments || 0} Success • {revenueSummary?.failed_payments || 0} Failed
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">Certificates Issued</span>
            <div className="p-2 bg-slate-950 rounded-lg text-slate-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-sans text-teal-300">
              {dbState?.certificates?.length || 0} items
            </h3>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Trigger generated on PRESENT status
            </p>
          </div>
        </div>

      </div>

      {/* Relational Schema Constraints Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Features Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">Relational Database Schemas & Features</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
              <h4 className="text-sm font-medium text-emerald-400 flex items-center space-x-2">
                <span className="p-1 bg-emerald-500/10 rounded">1.</span>
                <span>Cascading Joins (1:N, M:N)</span>
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Connects User registries with particular Events mapping direct inner keys. Easily execute LEFT or RIGHT JOINS showing unassigned participants or vacant venues.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
              <h4 className="text-sm font-medium text-emerald-400 flex items-center space-x-2">
                <span className="p-1 bg-emerald-500/10 rounded">2.</span>
                <span>Certificate Triggers</span>
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Updating a student check-in to 'PRESENT' automatically generates a certificate row in Certificates table, proving active DBMS trigger cascades in real-time.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
              <h4 className="text-sm font-medium text-emerald-400 flex items-center space-x-2">
                <span className="p-1 bg-emerald-500/10 rounded">3.</span>
                <span>Transactional Safety</span>
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Includes maximum capacity constraint validation safeguards. Event registrations block immediately when capacity sizes overflow.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
              <h4 className="text-sm font-medium text-emerald-400 flex items-center space-x-2">
                <span className="p-1 bg-emerald-500/10 rounded">4.</span>
                <span>Active Audit Logging</span>
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Any modifications to Event properties (like changing venues, capacity or names) are captured to the EVENT_LOG as old and new value audits.
              </p>
            </div>

          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 text-[11px] text-indigo-300 rounded-lg flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <p>
              <strong>Academic Notice:</strong> This demonstrator operates on a real-time reactive in-memory relational system synced with Express. Every SQL command or CRUD click executes real atomic changes instantly reflected in the live reports!
            </p>
          </div>
        </div>

        {/* Database Quick Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center space-x-2">
              <FolderKey className="w-4 h-4 text-emerald-400" />
              <span>Entity Schema Map</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Verify foreign key dependencies and schema linkages.
            </p>
            
            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded flex justify-between items-center">
                <span className="text-slate-300">USERS (1)</span>
                <span className="text-slate-500">───►</span>
                <span className="text-emerald-400">REGISTRATIONS (M)</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-850 rounded flex justify-between items-center">
                <span className="text-slate-300">EVENTS (1)</span>
                <span className="text-slate-500">───►</span>
                <span className="text-emerald-400">REGISTRATIONS (M)</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-850 rounded flex justify-between items-center">
                <span className="text-slate-300">REGISTRATIONS (1)</span>
                <span className="text-slate-500">───►</span>
                <span className="text-teal-400">PAYMENTS (1)</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-850 rounded flex justify-between items-center">
                <span className="text-slate-300">REGISTRATIONS (1)</span>
                <span className="text-slate-500">───►</span>
                <span className="text-teal-400">ATTENDANCE (1)</span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-850 rounded flex justify-between items-center">
                <span className="text-slate-300">ATTENDANCE_PRESENT</span>
                <span className="text-slate-550">───►</span>
                <span className="text-indigo-400">CERTIFICATES (1)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-2">PROJECT CREATOR</span>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center font-bold text-xs text-emerald-400">
                VS
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Vikram Sen</div>
                <div className="text-[10px] font-mono text-slate-400">1BI24CS154 • BIT Engineering</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
