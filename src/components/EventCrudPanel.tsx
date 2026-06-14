/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, RefreshCw, Check, AlertCircle, MapPin, Users, DollarSign } from 'lucide-react';
import { Event } from '../lib/dbEngine.ts';

interface EventCrudPanelProps {
  events: Event[];
  onRefresh: () => void;
  setTriggerLogs: (logs: string[]) => void;
}

export default function EventCrudPanel({ events, onRefresh, setTriggerLogs }: EventCrudPanelProps) {
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'none'>('none');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    event_name: '',
    event_description: '',
    event_date: '',
    event_time: '10:00:00',
    venue: '',
    capacity: 50,
    registration_fee: 0.00
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      event_name: '',
      event_description: '',
      event_date: '',
      event_time: '10:00:00',
      venue: '',
      capacity: 50,
      registration_fee: 0.00
    });
    setEditingEventId(null);
    setFormMode('none');
    setLocalError(null);
  };

  const startCreate = () => {
    setFormMode('create');
    setEditingEventId(null);
    setFormData({
      event_name: '',
      event_description: '',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '10:00:00',
      venue: 'CS Seminar Hall',
      capacity: 100,
      registration_fee: 100.00
    });
  };

  const startEdit = (ev: Event) => {
    setFormMode('edit');
    setEditingEventId(ev.event_id);
    setFormData({
      event_name: ev.event_name,
      event_description: ev.event_description,
      event_date: ev.event_date,
      event_time: ev.event_time,
      venue: ev.venue,
      capacity: ev.capacity,
      registration_fee: ev.registration_fee
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    // Assert inputs are sound
    if (!formData.event_name || !formData.event_date || !formData.event_time || !formData.venue) {
      setLocalError("Domain Constraint: Name, Date, Time, and Venue are strictly required.");
      return;
    }

    if (formData.capacity <= 0) {
      setLocalError("Check Constraint Violation: Capacity size must exceed exactly 0.");
      return;
    }

    if (formData.registration_fee < 0) {
      setLocalError("Check Constraint Violation: Registration fee cannot be negative values.");
      return;
    }

    try {
      if (formMode === 'create') {
        const res = await fetch('/api/events/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (result.success) {
          setLocalSuccess(`Successfully INSERTED Event "${formData.event_name}" (Auto ID #${result.data.event_id})`);
          onRefresh();
          setTimeout(resetForm, 1500);
        } else {
          setLocalError(result.error || "Failed to create event.");
        }
      } else {
        const res = await fetch('/api/events/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: editingEventId, ...formData })
        });
        const result = await res.json();
        if (result.success) {
          setLocalSuccess(`Successfully UPDATED Event properties.`);
          if (result.triggerLogs && result.triggerLogs.length > 0) {
            setTriggerLogs(result.triggerLogs);
          }
          onRefresh();
          setTimeout(resetForm, 1500);
        } else {
          setLocalError(result.error || "Failed to update event.");
        }
      }
    } catch (err: any) {
      setLocalError(err.message || "Endpoint error.");
    }
  };

  const handleDelete = async (eventId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to run: DELETE FROM EVENTS WHERE event_id = ${eventId}?`)) {
      return;
    }
    setLocalError(null);
    setLocalSuccess(null);

    try {
      const res = await fetch('/api/events/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      const result = await res.json();
      if (result.success) {
        setLocalSuccess(`Successfully DELETED event "${name}"`);
        onRefresh();
      } else {
        setLocalError(`Integrity Constraint Violation: ${result.error || "Students are actively registered for this event."}`);
      }
    } catch (err: any) {
      setLocalError(err.message || "Integrity error in cascade operations.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-sans">Event Catalog & Management (EVENTS Table)</h2>
          <p className="text-xs text-slate-400">
            Fulfill basic CRUD operations for events. Updates to name, date, or time dynamically fire Audit logging.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-800 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={startCreate}
            className="flex items-center space-x-1.5 bg-emerald-500 hover:brightness-110 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event (INSERT)</span>
          </button>
        </div>
      </div>

      {/* Embedded Crud logs */}
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

      {/* Form Section */}
      {formMode !== 'none' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner">
          <h3 className="text-sm font-bold text-slate-300 uppercase font-mono mb-4">
            {formMode === 'create' ? 'INSERT INTO EVENTS' : `UPDATE EVENTS WHERE event_id = ${editingEventId}`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Event Name (Update target) *</label>
                <input
                  type="text"
                  required
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500"
                  placeholder="AI Innovation Hackathon"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Venue Room / Lab (Update target) *</label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500"
                  placeholder="Main Auditorium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Brief Description</label>
              <textarea
                value={formData.event_description}
                onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500 h-16"
                placeholder="Give a short summary about the workshop/hackathon..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500 text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Time *</label>
                <input
                  type="text"
                  required
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500 font-mono"
                  placeholder="10:00:00"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Capacity (Max) *</label>
                <input
                  type="number"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Registration Fee (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.registration_fee}
                  onChange={(e) => setFormData({ ...formData, registration_fee: Number(e.target.value) })}
                  className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-800 bg-slate-950 text-slate-300 rounded text-xs hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 text-slate-950 rounded text-xs font-bold hover:brightness-110 transition cursor-pointer"
              >
                {formMode === 'create' ? 'INSERT Event' : 'UPDATE Event Values'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(ev => (
          <div key={ev.event_id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-emerald-400 bg-slate-950 border border-slate-850 px-2.5 py-0.5 rounded-full font-bold">
                  EVENT_ID #{ev.event_id}
                </span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                  ev.registration_fee > 0 ? 'bg-amber-400/10 text-amber-300 border border-amber-300/20' : 'bg-emerald-400/10 text-emerald-400'
                }`}>
                  {ev.registration_fee > 0 ? `₹${ev.registration_fee}` : 'FREE ENTRY'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white tracking-tight">{ev.event_name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{ev.event_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850 text-[11px] text-slate-300 font-mono">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{ev.event_date} @ {ev.event_time.substring(0, 5)}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{ev.venue}</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Capacity Block: <strong className="text-slate-100">{ev.capacity} students</strong> max</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-850">
              <button
                onClick={() => startEdit(ev)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition text-[11px] font-medium"
              >
                <Edit2 className="w-3 h-3" />
                <span>Modify (UPDATE)</span>
              </button>
              <button
                onClick={() => handleDelete(ev.event_id, ev.event_name)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-red-400 hover:text-red-300 transition text-[11px] font-medium"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete (DELETE)</span>
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-2 py-10 bg-slate-900 border border-slate-800 rounded-xl text-center font-mono text-slate-500 text-xs">
            No events registered in database catalog.
          </div>
        )}
      </div>

    </div>
  );
}
