'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../lib/useAudio';
import { apiFetch } from '../../../lib/api';

export default function ChildrenManagement() {
  const { playClick, playSuccess, playWrong } = useAudio();

  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Create state
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<'3-4' | '5-6' | '7-8'>('5-6');
  const [creating, setCreating] = useState(false);

  // Edit settings state
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState(30);
  const [editSound, setEditSound] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    const res = await apiFetch('/children');
    setLoading(false);
    if (res.success && res.data) {
      setChildren(res.data);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setError('');

    if (!name.trim()) return;

    setCreating(true);
    const res = await apiFetch('/children', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), ageGroup })
    });
    setCreating(false);

    if (res.success && res.data) {
      playSuccess();
      setChildren(prev => [...prev, res.data]);
      setName('');
    } else {
      playWrong();
      setError(res.error || 'Failed to create child profile');
    }
  };

  const handleOpenEdit = (child: any) => {
    playClick();
    setEditingChildId(child._id);
    setEditLimit(child.settings?.dailyTimeLimitMinutes || 30);
    setEditSound(child.settings?.soundEnabled !== false);
  };

  const handleSaveSettings = async (childId: string) => {
    playClick();
    const res = await apiFetch(`/children/${childId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        settings: {
          soundEnabled: editSound,
          voiceInputEnabled: false,
          dailyTimeLimitMinutes: editLimit
        }
      })
    });

    if (res.success && res.data) {
      playSuccess();
      setChildren(prev => prev.map(c => c._id === childId ? res.data : c));
      setEditingChildId(null);
    } else {
      playWrong();
      alert('Failed to save child profile settings');
    }
  };

  const handleDeleteProfile = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child profile? This action is permanent and deletes all history.')) return;
    playClick();

    const res = await apiFetch(`/children/${childId}`, {
      method: 'DELETE'
    });

    if (res.success) {
      playSuccess();
      setChildren(prev => prev.filter(c => c._id !== childId));
      if (editingChildId === childId) setEditingChildId(null);
    } else {
      playWrong();
      alert('Failed to delete child profile');
    }
  };

  return (
    <div className="flex flex-col gap-8 font-parent text-slate-800">
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Column: Children list & settings */}
        <div className="flex-1 w-full flex flex-col gap-4">
          <h3 className="text-xl font-bold text-slate-800">Active Child Profiles</h3>
          
          {loading && children.length === 0 && (
            <p className="text-slate-400 text-sm">Loading children list...</p>
          )}

          {children.length === 0 && !loading && (
            <div className="bg-white border rounded-card p-6 text-center shadow-sm">
              <p className="text-slate-400 text-sm font-semibold">No profiles created yet. Create one using the form on the right!</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {children.map((child) => {
              const isEditing = editingChildId === child._id;

              return (
                <div key={child._id} className="bg-white border rounded-card p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">👦</span>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">{child.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">Age group: {child.ageGroup} years | Coins: 🪙 {child.coins} | Stars: ⭐ {child.totalStars}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(child)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-btn text-xs font-semibold min-h-[36px]"
                      >
                        Settings ⚙️
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(child._id)}
                        className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-btn text-xs font-semibold min-h-[36px]"
                      >
                        Delete ✕
                      </button>
                    </div>
                  </div>

                  {/* Expanded Settings Form */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t pt-4 flex flex-col gap-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Daily Time Limit</label>
                            <select
                              value={editLimit}
                              onChange={(e) => setEditLimit(Number(e.target.value))}
                              className="w-full px-3 py-2 border rounded-btn bg-slate-50 text-sm focus:outline-none"
                            >
                              <option value={15}>15 Minutes</option>
                              <option value={30}>30 Minutes (Recommended)</option>
                              <option value={45}>45 Minutes</option>
                              <option value={60}>60 Minutes</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">In-App Audio</label>
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                id={`sound-${child._id}`}
                                checked={editSound}
                                onChange={(e) => setEditSound(e.target.checked)}
                                className="h-5 w-5 accent-brand-primary"
                              />
                              <label htmlFor={`sound-${child._id}`} className="text-sm font-semibold text-slate-600">
                                Enable Sound Cues & TTS Voice
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingChildId(null)}
                            className="px-4 py-2 border text-slate-500 rounded-btn text-xs font-bold min-h-[36px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveSettings(child._id)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-btn text-xs font-bold shadow hover:opacity-90 min-h-[36px]"
                          >
                            Save Settings 💾
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Add child profile form */}
        <div className="w-full md:w-80 bg-white border rounded-card p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Create Child Profile</h3>
          
          {error && (
            <div className="mb-4 bg-red-100 text-red-700 p-2.5 rounded-btn text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleAddChild} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Child Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Chiku"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-btn text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Age Group & Difficulty Level</label>
              <select
                value={ageGroup}
                onChange={(e: any) => setAgeGroup(e.target.value)}
                className="w-full px-4 py-2 border rounded-btn text-sm focus:outline-none bg-slate-50"
              >
                <option value="3-4">Class 3–4 Years (Level 1: Counting & Shapes)</option>
                <option value="5-6">Class 5–6 Years (Level 2: Addition & Patterns)</option>
                <option value="7-8">Class 7–8 Years (Level 3: Math Story Problems)</option>
              </select>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={creating}
              className="w-full py-3 mt-2 bg-brand-secondary text-white font-bold text-sm rounded-btn shadow hover:opacity-90 transition min-h-[48px]"
            >
              {creating ? 'Creating...' : 'Create Profile ➕'}
            </motion.button>
          </form>
        </div>

      </div>

    </div>
  );
}
