/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, BookOpen, Layers, GitFork, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { NORMALIZATION_EXPLANATION, ER_DIAGRAM_DESCRIPTION, MYSQL_WORKBENCH_SCRIPTS } from '../data/dbDocs.ts';
import { SQLQueryResult } from '../lib/dbEngine.ts';

interface VivaPanelProps {
  onRefresh: () => void;
}

type ModeTab = 'terminal' | 'workbench' | 'normalization' | 'schema';

export default function VivaPanel({ onRefresh }: VivaPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<ModeTab>('terminal');
  const [sqlQuery, setSqlQuery] = useState<string>(
    `SELECT U.name, U.usn, E.event_name, R.status \nFROM USERS U \nINNER JOIN REGISTRATIONS R ON U.user_id = R.user_id \nINNER JOIN EVENTS E ON R.event_id = E.event_id;`
  );
  
  const [queryResult, setQueryResult] = useState<SQLQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [terminalError, setTerminalError] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return;
    setIsExecuting(true);
    setTerminalError(null);
    setQueryResult(null);

    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await res.json();
      if (data.result) {
        setQueryResult(data.result);
        if (data.result.message && data.result.columns[0] === 'error_message') {
          setTerminalError(data.result.message);
        }
        onRefresh(); // sync other components
      } else {
        setTerminalError("Query parser returned invalid structure.");
      }
    } catch (err: any) {
      setTerminalError(err.message || "Failed to contact database endpoint.");
    } finally {
      setIsExecuting(false);
    }
  };

  const setQueryTemplate = (queryStr: string) => {
    setSqlQuery(queryStr.trim() + ";");
    setQueryResult(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Introduction to VIVA page */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl" />
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <span>DBMS VIVA & Faculty Evaluation Hub</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Designed specifically to meet strict academic viva criteria. Present normalization schemas, copy full Workbench setups, or execute real JOIN queries in our integrated relational database command line console.
        </p>

        {/* Navigation tabs inside VIVA panel */}
        <div className="flex border-b border-slate-800 mt-6 space-x-4">
          {[
            { id: 'terminal', label: '1. SQL Command Terminal', icon: Terminal },
            { id: 'schema', label: '2. ER Schema Schema Map', icon: GitFork },
            { id: 'normalization', label: '3. Normalization (3NF)', icon: BookOpen },
            { id: 'workbench', label: '4. MySQL Workbench Scripts', icon: FileText },
          ].map(sb => {
            const ActiveIcon = sb.icon;
            return (
              <button
                key={sb.id}
                onClick={() => setActiveSubTab(sb.id as ModeTab)}
                className={`pb-3 text-xs font-semibold font-sans flex items-center space-x-1.5 border-b-2 transition ${
                  activeSubTab === sb.id 
                    ? 'border-emerald-500 text-emerald-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ActiveIcon className="w-3.5 h-3.5" />
                <span>{sb.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER CONTENT PANELS */}

      {/* A. SQL WEB TERMINAL */}
      {activeSubTab === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Query templates panel */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
              Faculty Query Presets
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any blueprint SQL query below to load it into the terminal. Demonstrates direct inner-joins, views, and stores.
            </p>
            
            <div className="space-y-2.5">
              
              <div>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">
                  Relational JOINS
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <button
                    onClick={() => setQueryTemplate(`SELECT U.name, E.event_name, R.status \nFROM USERS U \nINNER JOIN REGISTRATIONS R ON U.user_id = R.user_id \nINNER JOIN EVENTS E ON R.event_id = E.event_id`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 rounded hover:text-white transition font-mono whitespace-nowrap overflow-x-auto truncate"
                  >
                    1. INNER JOIN (Users + Registrations + Events)
                  </button>
                  <button
                    onClick={() => setQueryTemplate(`SELECT U.name, U.usn, R.registration_id, R.status \nFROM USERS U \nLEFT JOIN REGISTRATIONS R ON U.user_id = R.user_id`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 rounded hover:text-white transition font-mono truncate"
                  >
                    2. LEFT JOIN (Users not registered)
                  </button>
                  <button
                    onClick={() => setQueryTemplate(`SELECT E.event_name, E.venue, U.name AS student \nFROM REGISTRATIONS R \nINNER JOIN USERS U ON R.user_id = U.user_id \nRIGHT JOIN EVENTS E ON R.event_id = E.event_id`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 rounded hover:text-white transition font-mono truncate"
                  >
                    3. RIGHT JOIN (Events details emphasizing unassigned)
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">
                  VIEWS
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <button
                    onClick={() => setQueryTemplate(`SELECT * FROM EventParticipationView`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-350 rounded hover:text-white transition font-mono"
                  >
                    SELECT * FROM EventParticipationView
                  </button>
                  <button
                    onClick={() => setQueryTemplate(`SELECT * FROM CertificateStatusView`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-350 rounded hover:text-white transition font-mono"
                  >
                    SELECT * FROM CertificateStatusView
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">
                  STORED PROCEDURES
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <button
                    onClick={() => setQueryTemplate(`CALL GetParticipantCount()`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-350 rounded hover:text-white transition font-mono"
                  >
                    CALL GetParticipantCount()
                  </button>
                  <button
                    onClick={() => setQueryTemplate(`CALL GetRevenueSummary()`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-350 rounded hover:text-white transition font-mono"
                  >
                    CALL GetRevenueSummary()
                  </button>
                  <button
                    onClick={() => setQueryTemplate(`CALL GetEventDetails(1)`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-350 rounded hover:text-white transition font-mono"
                  >
                    CALL GetEventDetails(Event ID #1)
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">
                  TRIGGERS DEMONSTRATION
                </span>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Updating records below triggers automated stored logs.
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <button
                    onClick={() => setQueryTemplate(`UPDATE EVENTS SET event_name = 'AI Innovation Hackathon', venue = 'Main Auditorium' WHERE event_id = 1`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-emerald-500/20 text-slate-350 rounded hover:text-white transition font-mono text-[10px] truncate"
                  >
                    1. UPDATE EVENT (Triggers log insert)
                  </button>
                  <button
                    onClick={() => setQueryTemplate(`UPDATE ATTENDANCE SET attendance_status = 'PRESENT' WHERE attendance_id = 3`)}
                    className="w-full text-left p-2 bg-slate-950 border border-slate-850 hover:border-emerald-500/20 text-slate-350 rounded hover:text-white transition font-mono text-[10px] truncate"
                  >
                    2. SET PRESENT (Triggers Certificate Generation)
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Active Terminal execution column */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>EventSphere-SQL Prompt Terminal (MySQL dialect)</span>
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
                  Active
                </span>
              </div>

              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full h-40 p-4 font-mono text-xs bg-slate-950 text-emerald-400 outline-none leading-relaxed resize-y"
                placeholder="Type your SQL query here e.g. SELECT * FROM users;"
              />

              <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex justify-between items-center">
                <p className="text-[10px] text-slate-500 font-mono">
                  Press Command + Enter or hit compile
                </p>
                <button
                  onClick={handleRunQuery}
                  disabled={isExecuting}
                  className="flex items-center space-x-1 bg-emerald-500 hover:brightness-110 disabled:brightness-50 text-slate-950 px-4 py-1.5 rounded text-xs font-bold font-mono transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950 shrink-0" />
                  <span>Compile (RUN) Query</span>
                </button>
              </div>
            </div>

            {/* Error state */}
            {terminalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-300 rounded-lg flex items-start space-x-2 font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span>{terminalError}</span>
              </div>
            )}

            {/* Active Query Logs Trace */}
            {queryResult?.triggerLogs && queryResult.triggerLogs.length > 0 && (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg space-y-1 text-xs font-mono">
                <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                  &gt;&gt; RELATIONAL TRIGGER FIRED:
                </span>
                {queryResult.triggerLogs.map((log, lIdx) => (
                  <p key={lIdx} className="leading-relaxed font-semibold">{log}</p>
                ))}
              </div>
            )}

            {/* Render results spreadsheet output when queried */}
            {queryResult && !terminalError && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow transition">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    Response Set: [Rows: {queryResult.rowCount} | Compile: {queryResult.executionTimeMs}ms]
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">SQL_OK</span>
                </div>

                {queryResult.message && (
                  <p className="text-xs text-emerald-400 font-mono font-bold bg-slate-950/60 p-2.5 border border-slate-850 rounded">
                    {queryResult.message}
                  </p>
                )}

                {queryResult.rows && queryResult.rows.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-800 rounded">
                    <table className="w-full border-collapse text-left text-xs font-mono text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          {queryResult.columns.map((col, idx) => (
                            <th key={idx} className="py-2.5 px-3 uppercase text-[10px]">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 whitespace-nowrap">
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-950/40 transition">
                            {queryResult.columns.map((col, cIdx) => {
                              const cellVal = typeof row === 'object' ? row[col] : row;
                              return (
                                <td key={cIdx} className="py-2 px-3 text-slate-100">
                                  {cellVal === null || cellVal === undefined ? (
                                    <span className="text-slate-650 italic">NULL</span>
                                  ) : (
                                    String(cellVal)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono py-4 text-center border border-slate-850 rounded">
                    Empty rowset. Transaction completed successfully.
                  </p>
                )}

                {/* Explain Plan breakdown box (Highly educational for Viva!) */}
                {queryResult.explainPlan && (
                  <div className="p-3 bg-slate-950 rounded border border-slate-850 space-y-1">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block">
                      DBMS Optimizer Execution Plan (EXPLAIN)
                    </span>
                    {queryResult.explainPlan.map((step, sIdx) => (
                      <p key={sIdx} className="text-[10px] font-mono text-slate-400">&gt; {step}</p>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* B. ER SCHEMA DETAILS */}
      {activeSubTab === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{ER_DIAGRAM_DESCRIPTION.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review our normalized relational schema containing 8 primary entities mapped with appropriate primary-foreign keys constraints.
            </p>
          </div>

          {/* Relation mappings display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ER_DIAGRAM_DESCRIPTION.entities.map(ent => (
              <div key={ent.name} className="p-4 bg-slate-955 rounded-lg border border-slate-850">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-mono font-bold text-white uppercase">{ent.name} Table Attributes</h4>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">{ent.type}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950 p-2 border border-slate-850 rounded">
                  {ent.attr}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-955 rounded-lg border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
              Cardinality Schema Relationships
            </h4>
            <ul className="space-y-1 text-xs text-slate-330 list-disc list-inside">
              {ER_DIAGRAM_DESCRIPTION.relationships.map((rel, rIdx) => (
                <li key={rIdx}>{rel}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* C. NORMALIZATION 3NF REPORT */}
      {activeSubTab === 'normalization' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-emerald-400 font-mono text-xs uppercase font-bold tracking-widest mb-1">
              Active Normalization Document
            </h3>
            <h3 className="text-lg font-bold text-white leading-tight">University DBMS Certification Requirements</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {NORMALIZATION_EXPLANATION.summary}
            </p>
          </div>

          {/* Steps list */}
          <div className="space-y-4">
            {NORMALIZATION_EXPLANATION.steps.map((st, sIdx) => (
              <div key={sIdx} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl">
                <h4 className="text-sm font-semibold text-white tracking-tight font-sans">
                  {st.level}
                </h4>
                <p className="text-xs font-sans text-slate-400 italic mt-1 leading-relaxed border-l-2 border-indigo-500 pl-2">
                  {st.description}
                </p>
                <p className="text-xs font-sans text-slate-300 mt-2">
                  <strong>System Application:</strong> {st.application}
                </p>
              </div>
            ))}
          </div>

          {/* Functional Dependencies list */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
            <span className="text-xs font-mono font-bold uppercase text-emerald-400 block mb-2">
              Functional Dependencies (FDs) Verified:
            </span>
            <div className="space-y-1 font-mono text-[11px] text-slate-400">
              {NORMALIZATION_EXPLANATION.functionalDependencies.map((fd, fIdx) => (
                <div key={fIdx} className="p-1 px-2.5 bg-slate-955 border border-slate-850 rounded">
                  {fd}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* D. MYSQL WORKBENCH COPY-SCRIPTS */}
      {activeSubTab === 'workbench' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-white">MySQL Workbench Syntax Generators</h3>
            <p className="text-xs text-slate-400">
              Complete pre-written SQL scripts. Copy and run directly inside your local MySQL Workbench to establish the physical EventSphere database instantly!
            </p>
          </div>

          {/* CREATE SCHEMAS BOX */}
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-950/90 px-4 py-2 border-t border-x border-slate-850 rounded-t-lg">
              <span className="text-xs font-mono font-bold text-slate-300">Phase 1: Table Creation DDL Scripts</span>
              <button
                onClick={() => handleCopy(MYSQL_WORKBENCH_SCRIPTS.createSchema, 'ddl')}
                className="flex items-center space-x-1 p-1 px-2 border border-slate-800 hover:text-emerald-400 hover:bg-slate-900 transition text-xs font-mono rounded"
              >
                {copiedKey === 'ddl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ddl' ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border-r border-b border-l border-slate-850 text-[10px] font-mono leading-relaxed text-slate-400 overflow-x-auto rounded-b-lg select-all h-60">
              {MYSQL_WORKBENCH_SCRIPTS.createSchema}
            </pre>
          </div>

          {/* SEED DATA BOX */}
          <div className="space-y-3 col-span-2">
            <div className="flex justify-between items-center bg-slate-950/90 px-4 py-2 border-t border-x border-slate-850 rounded-t-lg">
              <span className="text-xs font-mono font-bold text-slate-300">Phase 2: Initial Rows Insertion DML</span>
              <button
                onClick={() => handleCopy(MYSQL_WORKBENCH_SCRIPTS.seedData, 'dml')}
                className="flex items-center space-x-1 p-1 px-2 border border-slate-800 hover:text-emerald-400 hover:bg-slate-900 transition text-xs font-mono rounded"
              >
                {copiedKey === 'dml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'dml' ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border-r border-b border-l border-slate-850 text-[10px] font-mono leading-relaxed text-slate-400 overflow-x-auto rounded-b-lg select-all h-60">
              {MYSQL_WORKBENCH_SCRIPTS.seedData}
            </pre>
          </div>

          {/* TRIGGERS BOX */}
          <div className="space-y-3 col-span-2">
            <div className="flex justify-between items-center bg-slate-950/90 px-4 py-2 border-t border-x border-slate-850 rounded-t-lg">
              <span className="text-xs font-mono font-bold text-slate-300">Phase 3: Database Triggers (Certificate/Audit and logs)</span>
              <button
                onClick={() => handleCopy(MYSQL_WORKBENCH_SCRIPTS.triggers, 'trg')}
                className="flex items-center space-x-1 p-1 px-2 border border-slate-800 hover:text-emerald-400 hover:bg-slate-900 transition text-xs font-mono rounded"
              >
                {copiedKey === 'trg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'trg' ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border-r border-b border-l border-slate-850 text-[10px] font-mono leading-relaxed text-slate-400 overflow-x-auto rounded-b-lg select-all h-60">
              {MYSQL_WORKBENCH_SCRIPTS.triggers}
            </pre>
          </div>

          {/* STORED PROCEDURES BOX */}
          <div className="space-y-3 col-span-2">
            <div className="flex justify-between items-center bg-slate-950/90 px-4 py-2 border-t border-x border-slate-850 rounded-t-lg">
              <span className="text-xs font-mono font-bold text-slate-300">Phase 4: Stored Procedures (Summarizations and maps)</span>
              <button
                onClick={() => handleCopy(MYSQL_WORKBENCH_SCRIPTS.procedures, 'proc')}
                className="flex items-center space-x-1 p-1 px-2 border border-slate-800 hover:text-emerald-400 hover:bg-slate-900 transition text-xs font-mono rounded"
              >
                {copiedKey === 'proc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'proc' ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border-r border-b border-l border-slate-850 text-[10px] font-mono leading-relaxed text-slate-400 overflow-x-auto rounded-b-lg select-all h-60">
              {MYSQL_WORKBENCH_SCRIPTS.procedures}
            </pre>
          </div>

          {/* VIEWS SYSTEM BOX */}
          <div className="space-y-3 col-span-2">
            <div className="flex justify-between items-center bg-slate-950/90 px-4 py-2 border-t border-x border-slate-850 rounded-t-lg">
              <span className="text-xs font-mono font-bold text-slate-300">Phase 5: Aggregation Views Creation</span>
              <button
                onClick={() => handleCopy(MYSQL_WORKBENCH_SCRIPTS.views, 'views')}
                className="flex items-center space-x-1 p-1 px-2 border border-slate-800 hover:text-emerald-400 hover:bg-slate-900 transition text-xs font-mono rounded"
              >
                {copiedKey === 'views' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'views' ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border-r border-b border-l border-slate-850 text-[10px] font-mono leading-relaxed text-slate-400 overflow-x-auto rounded-b-lg select-all h-40">
              {MYSQL_WORKBENCH_SCRIPTS.views}
            </pre>
          </div>

          {/* SAMPLE JOINS BOX */}
          <div className="space-y-3 col-span-2">
            <div className="flex justify-between items-center bg-slate-950/90 px-4 py-2 border-t border-x border-slate-850 rounded-t-lg">
              <span className="text-xs font-mono font-bold text-slate-300">Phase 6: Relational Algebra Joint Joins Sets</span>
              <button
                onClick={() => handleCopy(MYSQL_WORKBENCH_SCRIPTS.sampleJoins, 'joins')}
                className="flex items-center space-x-1 p-1 px-2 border border-slate-800 hover:text-emerald-400 hover:bg-slate-900 transition text-xs font-mono rounded"
              >
                {copiedKey === 'joins' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'joins' ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 border-r border-b border-l border-slate-850 text-[10px] font-mono leading-relaxed text-slate-400 overflow-x-auto rounded-b-lg select-all h-60">
              {MYSQL_WORKBENCH_SCRIPTS.sampleJoins}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
}
