/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { User } from '../lib/dbEngine.ts';

interface UserCrudPanelProps {
  users: User[];
  onRefresh: () => void;
  setErrorState: (msg: string | null) => void;
}

export default function UserCrudPanel({ users, onRefresh, setErrorState }: UserCrudPanelProps) {
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'none'>('none');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    email: '',
    phone: '',
    department: '',
    role: 'STUDENT' as 'STUDENT' | 'ORGANIZER' | 'VOLUNTEER'
  });
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      usn: '',
      email: '',
      phone: '',
      department: '',
      role: 'STUDENT'
    });
    setEditingUserId(null);
    setFormMode('none');
    setLocalError(null);
  };

  const startCreate = () => {
    setFormMode('create');
    setEditingUserId(null);
    setFormData({
      name: '',
      usn: '',
      email: '',
      phone: '',
      department: 'Computer Science',
      role: 'STUDENT'
    });
  };

  const startEdit = (u: User) => {
    setFormMode('edit');
    setEditingUserId(u.user_id);
    setFormData({
      name: u.name,
      usn: u.usn,
      email: u.email,
      phone: u.phone,
      department: u.department,
      role: u.role
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    // Basic Validation
    if (!formData.name || !formData.usn || !formData.email || !formData.phone || !formData.department) {
      setLocalError("Domain Constraint Error: All fields are required.");
      return;
    }

    // USN pattern check
    if (!/^[1-9][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/i.test(formData.usn)) {
      setLocalError("Constraint Check Error: Invalid VTU USN format. (Example: 1BI22CS001)");
      return;
    }

    try {
      if (formMode === 'create') {
        const res = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (result.success) {
          setLocalSuccess(`Successfully INSERTED user "${formData.name}" (Auto-increment ID #${result.data.user_id})`);
          onRefresh();
          setTimeout(resetForm, 1500);
        } else {
          setLocalError(result.error || "Failed to create user.");
        }
      } else {
        const res = await fetch('/api/users/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: editingUserId, ...formData })
        });
        const result = await res.json();
        if (result.success) {
          setLocalSuccess(`Successfully UPDATED user "${formData.name}"`);
          onRefresh();
          setTimeout(resetForm, 1500);
        } else {
          setLocalError(result.error || "Failed to update user.");
        }
      }
    } catch (err: any) {
      setLocalError(err.message || "Endpoint network error.");
    }
  };

  const handleDelete = async (userId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to run: DELETE FROM USERS WHERE user_id = ${userId}?`)) {
      return;
    }
    setLocalError(null);
    setLocalSuccess(null);

    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const result = await res.json();
      if (result.success) {
        setLocalSuccess(`Successfully DELETED User "${name}"`);
        onRefresh();
      } else {
        setLocalError(`Integrity Constraint Violation: ${result.error || "Referenced key collision in child tables."}`);
      }
    } catch (err: any) {
      setLocalError(err.message || "Failed to delete user due to foreign key referencing registers.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-sans">Student Management (USERS Table)</h2>
          <p className="text-xs text-slate-400">
            Fulfill basic CRUD operations for students. Demonstrates Primary Key uniqueness and cascade dependencies.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-800 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition"
            title="Reload Tables"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={startCreate}
            className="flex items-center space-x-1.5 bg-emerald-500 hover:brightness-110 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student (INSERT)</span>
          </button>
        </div>
      </div>

      {/* Embedded CRUD Alerts */}
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
            {formMode === 'create' ? 'INSERT INTO USERS' : `UPDATE USERS WHERE user_id = ${editingUserId}`}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Full Student Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500"
                placeholder="Rahul Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">University USN (Unique) *</label>
              <input
                type="text"
                required
                disabled={formMode === 'edit'}
                value={formData.usn}
                onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500 disabled:opacity-55"
                placeholder="1BI22CS001"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Web Email Addr *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500"
                placeholder="name@bit-bangalore.edu.in"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500"
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Acad Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500"
              >
                <option value="Computer Science">Computer Science & Eng.</option>
                <option value="Information Science">Information Science & Eng.</option>
                <option value="Electronics & Communication">Electronics & Comm.</option>
                <option value="Electrical & Electronics">Electrical & Elec.</option>
                <option value="Mechanical Engineering">Mechanical Eng.</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Assigned Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-100 rounded p-2.5 outline-none focus:border-green-500"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="VOLUNTEER">VOLUNTEER</option>
                <option value="ORGANIZER">ORGANIZER</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end space-x-2 pt-2">
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
                {formMode === 'create' ? 'INSERT Tuple' : 'COMMIT Updates'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users DataTable Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">user_id (PK)</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">USN (Unique)</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Actions Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {users.map(u => (
                <tr key={u.user_id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">#{u.user_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{u.name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{u.usn}</td>
                  <td className="py-3.5 px-4">{u.email}</td>
                  <td className="py-3.5 px-4 text-slate-400">{u.department}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                      u.role === 'ORGANIZER' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                        : u.role === 'VOLUNTEER' 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => startEdit(u)}
                      className="inline-flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded text-slate-400 hover:text-white hover:border-slate-600 transition"
                      title="Update Row"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.user_id, u.name)}
                      className="inline-flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded text-red-500/80 hover:text-red-400 hover:border-red-500/30 transition"
                      title="Delete Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center font-mono text-slate-500">
                    No records found in relations.
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
