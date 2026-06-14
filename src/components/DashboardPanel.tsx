/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Search, Filter, RefreshCw, Layers, Table, ArrowDownCircle } from 'lucide-react';
import { DatabaseState } from '../lib/dbEngine.ts';

interface DashboardPanelProps {
  dbState: DatabaseState | null;
  onRefresh: () => void;
}

type SelectedTable = 
  | 'users' 
  | 'events' 
  | 'registrations' 
  | 'payments' 
  | 'attendance' 
  | 'certificates' 
  | 'volunteers' 
  | 'event_log'
  | 'payment_audit';

export default function DashboardPanel({ dbState, onRefresh }: DashboardPanelProps) {
  const [activeTable, setActiveTable] = useState<SelectedTable>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');

  if (!dbState) {
    return (
      <div className="flex justify-center items-center py-20 bg-slate-900 border border-slate-850 rounded-xl">
        <div className="text-center font-mono space-y-2">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synchronizing relational system tables...</p>
        </div>
      </div>
    );
  }

  // Define tables schema metadata for dynamic columns matching
  const TABLE_SCHEMAS: Record<SelectedTable, { label: string; columns: string[]; searchField: string }> = {
    users: {
      label: 'USERS Table',
      columns: ['user_id', 'name', 'usn', 'email', 'phone', 'department', 'role'],
      searchField: 'name'
    },
    events: {
      label: 'EVENTS Table',
      columns: ['event_id', 'event_name', 'venue', 'event_date', 'event_time', 'capacity', 'registration_fee'],
      searchField: 'event_name'
    },
    registrations: {
      label: 'REGISTRATIONS Table',
      columns: ['registration_id', 'user_id', 'event_id', 'registration_date', 'status'],
      searchField: 'status'
    },
    payments: {
      label: 'PAYMENTS Table',
      columns: ['payment_id', 'registration_id', 'amount', 'payment_date', 'payment_status'],
      searchField: 'payment_status'
    },
    attendance: {
      label: 'ATTENDANCE Table',
      columns: ['attendance_id', 'registration_id', 'attendance_status', 'check_in_time'],
      searchField: 'attendance_status'
    },
    certificates: {
      label: 'CERTIFICATES Table',
      columns: ['certificate_id', 'registration_id', 'issue_date', 'certificate_status'],
      searchField: 'certificate_status'
    },
    volunteers: {
      label: 'VOLUNTEERS Table',
      columns: ['volunteer_id', 'user_id', 'event_id', 'assigned_role', 'hours_served'],
      searchField: 'assigned_role'
    },
    event_log: {
      label: 'EVENT_LOG Table (Trg 2 Audit)',
      columns: ['log_id', 'event_id', 'old_event_name', 'new_event_name', 'old_date', 'new_date', 'updated_at'],
      searchField: 'new_event_name'
    },
    payment_audit: {
      label: 'PAYMENT_AUDIT Table (Trg 3 Audit)',
      columns: ['audit_id', 'payment_id', 'registration_id', 'amount', 'action_timestamp'],
      searchField: 'amount'
    }
  };

  const getTableRows = (): any[] => {
    return dbState[activeTable] || [];
  };

  const filteredRows = getTableRows().filter(row => {
    // 1. Match search query on designated search fields or general row string match
    const searchVal = String(row[TABLE_SCHEMAS[activeTable].searchField] || '').toLowerCase();
    const matchesSearch = searchVal.includes(searchQuery.toLowerCase()) || 
                          JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Match filters if specified
    if (filterColumn && filterValue) {
      const cellVal = String(row[filterColumn] || '').toLowerCase();
      return cellVal === filterValue.toLowerCase();
    }

    return true;
  });

  // Get unique values for filter column
  const getFilterDropdownValues = () => {
    if (!filterColumn) return [];
    const values = getTableRows().map(r => r[filterColumn]).filter(v => v !== undefined && v !== null && v !== '');
    return Array.from(new Set(values));
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-sans">Interactive Database Dashboard & Workspace</h2>
          <p className="text-xs text-slate-400">
            Facilitate direct physical inspection of all SQL tables. Search rows, apply relational constraints, and examine log histories live.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-1.5 border border-slate-850 hover:border-slate-705 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-semibold text-white transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Synchronize Tables</span>
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Table Selector Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 lg:col-span-1 h-fit">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block px-2 mb-3">
            Physical System Tables
          </span>
          <div className="space-y-1">
            {(Object.keys(TABLE_SCHEMAS) as SelectedTable[]).map(tbl => {
              const active = activeTable === tbl;
              const size = dbState[tbl]?.length || 0;
              return (
                <button
                  key={tbl}
                  onClick={() => {
                    setActiveTable(tbl);
                    setSearchQuery('');
                    setFilterColumn('');
                    setFilterValue('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium font-mono text-left transition ${
                    active 
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow' 
                      : 'text-slate-350 hover:bg-slate-950 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Table className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tbl.toUpperCase()}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] leading-none ${active ? 'bg-slate-950 text-emerald-400 font-bold' : 'bg-slate-950 text-slate-500'}`}>
                    {size}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Live Table Roster Dashboard */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-850 pb-4">
            
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center space-x-2 self-start sm:self-auto font-mono uppercase">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>{TABLE_SCHEMAS[activeTable].label}</span>
            </h3>

            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full sm:w-auto">
              
              {/* Search bar */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-850 text-slate-200 rounded p-2 pl-8 outline-none focus:border-green-500"
                />
              </div>

              {/* Column selector */}
              <select
                value={filterColumn}
                onChange={(e) => {
                  setFilterColumn(e.target.value);
                  setFilterValue('');
                }}
                className="text-xs bg-slate-950 border border-slate-850 text-slate-300 rounded p-2 outline-none focus:border-green-500"
              >
                <option value="">-- View Column Filter --</option>
                {TABLE_SCHEMAS[activeTable].columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>

              {/* Value selector */}
              {filterColumn && (
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="text-xs bg-slate-950 border border-slate-850 text-slate-300 rounded p-2 outline-none focus:border-green-500"
                >
                  <option value="">-- Select Value --</option>
                  {getFilterDropdownValues().map(val => (
                    <option key={String(val)} value={String(val)}>{String(val)}</option>
                  ))}
                </select>
              )}

            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto border border-slate-850 rounded-lg">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-840">
                <tr>
                  {TABLE_SCHEMAS[activeTable].columns.map(col => (
                    <th key={col} className="py-3 px-4">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/50 transition whitespace-nowrap">
                    {TABLE_SCHEMAS[activeTable].columns.map(col => {
                      const isId = col.includes('_id');
                      const val = row[col];
                      return (
                        <td key={col} className={`py-3 px-4 ${isId ? 'text-emerald-400 font-bold' : 'text-slate-100'}`}>
                          {val === null || val === undefined || val === '' ? (
                            <span className="text-slate-650 italic font-medium font-sans">NULL</span>
                          ) : typeof val === 'number' && col.includes('fee') || col.includes('amount') ? (
                            `₹${val.toFixed(2)}`
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={TABLE_SCHEMAS[activeTable].columns.length} className="py-10 text-center text-slate-500 font-sans">
                      No matching tuples found in relation {activeTable.toUpperCase()}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Stats Summary Footer inside dashboard */}
          <div className="flex justify-between items-center bg-slate-955 p-3 rounded-lg border border-slate-850 text-xs text-slate-400 mt-2">
            <span>
              Showing <strong className="text-slate-200">{filteredRows.length}</strong> of <strong className="text-slate-200">{getTableRows().length}</strong> rows
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-550 uppercase">
              REACTION-RATE: &lt;1ms (In-Memory Index)
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
