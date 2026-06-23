'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../../lib/store';
import { useAudio } from '../../../lib/useAudio';
import { apiFetch } from '../../../lib/api';
import { SKILL_DAG, SkillTreeService } from '../../../../../apps/api/src/services/SkillTreeService';

interface Island {
  id: string;
  name: string;
  label: string;
  skillId: string;
  emoji: string;
  x: number; // percentage coordinate
  y: number;
  color: string;
  accent: string;
}

const ISLANDS_DATA: Island[] = [
  { id: 'l1', name: 'Level 1: Quantity Comparison', label: 'Lvl 1', skillId: 'level-1', emoji: '🍎', x: 15, y: 90, color: 'bg-emerald-100 border-emerald-400', accent: 'text-emerald-500' },
  { id: 'l2', name: 'Level 2: Odd One Out', label: 'Lvl 2', skillId: 'level-2', emoji: '🐶', x: 32, y: 87, color: 'bg-teal-100 border-teal-400', accent: 'text-teal-500' },
  { id: 'l3', name: 'Level 3: Matching opposite & shape', label: 'Lvl 3', skillId: 'level-3', emoji: '📐', x: 49, y: 90, color: 'bg-sky-100 border-sky-400', accent: 'text-sky-500' },
  { id: 'l4', name: 'Level 4: Numbers 1-10', label: 'Lvl 4', skillId: 'level-4', emoji: '🔢', x: 66, y: 87, color: 'bg-blue-100 border-blue-400', accent: 'text-blue-500' },
  { id: 'l5', name: 'Level 5: Finger Counting', label: 'Lvl 5', skillId: 'level-5', emoji: '🖐️', x: 83, y: 90, color: 'bg-indigo-100 border-indigo-400', accent: 'text-indigo-500' },
  { id: 'l6', name: 'Level 6: After, Between, Before', label: 'Lvl 6', skillId: 'level-6', emoji: '⬅️', x: 90, y: 78, color: 'bg-purple-100 border-purple-400', accent: 'text-purple-500' },
  { id: 'l7', name: 'Level 7: Addition with Objects', label: 'Lvl 7', skillId: 'level-7', emoji: '➕', x: 80, y: 70, color: 'bg-rose-100 border-rose-400', accent: 'text-rose-500' },
  { id: 'l8', name: 'Level 8: Subtraction 1-10', label: 'Lvl 8', skillId: 'level-8', emoji: '➖', x: 63, y: 68, color: 'bg-amber-100 border-amber-400', accent: 'text-amber-500' },
  { id: 'l9', name: 'Level 9: Pattern Recognition', label: 'Lvl 9', skillId: 'level-9', emoji: '🔴', x: 46, y: 70, color: 'bg-yellow-100 border-yellow-400', accent: 'text-yellow-500' },
  { id: 'l10', name: 'Level 10: Comparison - Numeral', label: 'Lvl 10', skillId: 'level-10', emoji: '⚖️', x: 29, y: 68, color: 'bg-lime-100 border-lime-400', accent: 'text-lime-500' },
  { id: 'l11', name: 'Level 11: Review Assessment 1', label: 'Lvl 11', skillId: 'level-11', emoji: '📝', x: 14, y: 70, color: 'bg-emerald-100 border-emerald-400', accent: 'text-emerald-500' },
  { id: 'l12', name: 'Level 12: Tens and Ones', label: 'Lvl 12', skillId: 'level-12', emoji: '📦', x: 10, y: 58, color: 'bg-teal-100 border-teal-400', accent: 'text-teal-500' },
  { id: 'l13', name: 'Level 13: Numbers 11-30', label: 'Lvl 13', skillId: 'level-13', emoji: '🚀', x: 25, y: 52, color: 'bg-sky-100 border-sky-400', accent: 'text-sky-500' },
  { id: 'l14', name: 'Level 14: Counting & Trace', label: 'Lvl 14', skillId: 'level-14', emoji: '🎨', x: 42, y: 54, color: 'bg-blue-100 border-blue-400', accent: 'text-blue-500' },
  { id: 'l15', name: 'Level 15: Mixed practice', label: 'Lvl 15', skillId: 'level-15', emoji: '🌀', x: 59, y: 52, color: 'bg-indigo-100 border-indigo-400', accent: 'text-indigo-500' },
  { id: 'l16', name: 'Level 16: Addition 1-30', label: 'Lvl 16', skillId: 'level-16', emoji: '➕', x: 76, y: 54, color: 'bg-rose-100 border-rose-400', accent: 'text-rose-500' },
  { id: 'l17', name: 'Level 17: Subtraction 1-30', label: 'Lvl 17', skillId: 'level-17', emoji: '➖', x: 88, y: 46, color: 'bg-amber-100 border-amber-400', accent: 'text-amber-500' },
  { id: 'l18', name: 'Level 18: Ordering 1-30', label: 'Lvl 18', skillId: 'level-18', emoji: '📈', x: 78, y: 38, color: 'bg-orange-100 border-orange-400', accent: 'text-orange-500' },
  { id: 'l19', name: 'Level 19: Numbering 31-50', label: 'Lvl 19', skillId: 'level-19', emoji: '🏷️', x: 61, y: 36, color: 'bg-purple-100 border-purple-400', accent: 'text-purple-500' },
  { id: 'l20', name: 'Level 20: Skip Counting', label: 'Lvl 20', skillId: 'level-20', emoji: '🦓', x: 44, y: 38, color: 'bg-pink-100 border-pink-400', accent: 'text-pink-500' },
  { id: 'l21', name: 'Level 21: Comparison 1-50', label: 'Lvl 21', skillId: 'level-21', emoji: '⚖️', x: 27, y: 36, color: 'bg-lime-100 border-lime-400', accent: 'text-lime-500' },
  { id: 'l22', name: 'Level 22: Ordering 1-50', label: 'Lvl 22', skillId: 'level-22', emoji: '📉', x: 14, y: 38, color: 'bg-teal-100 border-teal-400', accent: 'text-teal-500' },
  { id: 'l23', name: 'Level 23: Review Assessment 2', label: 'Lvl 23', skillId: 'level-23', emoji: '🎓', x: 22, y: 22, color: 'bg-violet-100 border-violet-400', accent: 'text-violet-500' },
];

export default function WorldMap() {
  const router = useRouter();
  const { playClick, playSuccess, playWrong } = useAudio();
  const { childProfile, setSelectedChild } = useAppStore();

  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [islandProgress, setIslandProgress] = useState<Record<string, number>>({});
  const [lockedIslands, setLockedIslands] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (childProfile) {
      calculateLocksAndProgress();
    }
  }, [childProfile]);

  const calculateLocksAndProgress = () => {
    if (!childProfile) return;
    const progress: Record<string, number> = {};
    const locks: Record<string, boolean> = {};

    ISLANDS_DATA.forEach(island => {
      // 1. Get mastery percentage
      const skillState = childProfile.skillTree[island.skillId];
      const mastery = skillState ? skillState.mastery : 0;
      progress[island.id] = mastery;

      // 2. Check if locked using DAG prerequisites
      const config = SKILL_DAG[island.skillId];
      let locked = false;
      if (config) {
        for (const prereq of config.prerequisites) {
          const prereqState = childProfile.skillTree[prereq];
          if (!prereqState || prereqState.mastery < 80) {
            locked = true;
            break;
          }
        }
      }
      locks[island.id] = locked;
    });

    setIslandProgress(progress);
    setLockedIslands(locks);
  };

  const handleIslandClick = (island: Island) => {
    if (lockedIslands[island.id]) {
      playWrong();
      return;
    }
    playClick();
    setSelectedIsland(island);
  };

  const handleStartLesson = async (island: Island) => {
    playClick();
    if (!childProfile) return;

    // Fetch recommended lesson for this child's profile
    // If they clicked a specific island, we fetch lessons matching that skillId
    const res = await apiFetch(`/lessons?skillId=${island.skillId}&ageGroup=${childProfile.ageGroup}`);
    
    if (res.success && res.data && res.data.length > 0) {
      // Go to play lesson!
      router.push(`/play/${res.data[0]._id}`);
    } else {
      // Fallback: request dynamic recommendation
      const recRes = await apiFetch(`/lessons/recommended/${childProfile._id}`);
      if (recRes.success && recRes.data) {
        router.push(`/play/${recRes.data._id || 'recommended'}`);
      } else {
        alert('Oops, could not load a lesson right now. Please try again!');
      }
    }
  };

  // Find where Numi (the Owl) should sit: first unlocked, lowest mastery island
  const getNumiSitingIsland = (): Island => {
    const unlocked = ISLANDS_DATA.filter(island => !lockedIslands[island.id]);
    if (unlocked.length === 0) return ISLANDS_DATA[0];
    
    // Return the one with lowest mastery
    let target = unlocked[0];
    let minMastery = 101;
    unlocked.forEach(island => {
      const mast = islandProgress[island.id] || 0;
      if (mast < minMastery) {
        minMastery = mast;
        target = island;
      }
    });
    return target;
  };

  const numiIsland = getNumiSitingIsland();

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative select-none">
      
      {/* Drifting Clouds (CSS Backgrounds) */}
      <div className="absolute top-10 left-5 text-4xl opacity-20 select-none animate-float" style={{ animationDelay: '1s' }}>☁️</div>
      <div className="absolute top-28 right-10 text-5xl opacity-15 select-none animate-float" style={{ animationDelay: '3s' }}>☁️</div>
      <div className="absolute bottom-1/3 left-1/3 text-4xl opacity-10 select-none animate-float" style={{ animationDelay: '2s' }}>☁️</div>
      
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-black text-brand-text">
          Where shall we go today, <span className="text-brand-primary">{childProfile?.name}</span>? 🗺️
        </h2>
        <p className="text-brand-muted text-base mt-1">Tap an unlocked level to start a math adventure!</p>
      </div>

      {/* SVG Map Canvas */}
      <div className="w-full max-w-4xl aspect-[4/3] bg-sky-100 rounded-card border-4 border-blue-200 relative overflow-hidden shadow-card">
        {/* Rippling Sea Waves */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <circle cx="20%" cy="30%" r="50" fill="none" stroke="blue" strokeWidth="2" className="wave-ripple" style={{ animationDelay: '0s' }} />
            <circle cx="50%" cy="60%" r="70" fill="none" stroke="blue" strokeWidth="2" className="wave-ripple" style={{ animationDelay: '1.5s' }} />
            <circle cx="80%" cy="20%" r="40" fill="none" stroke="blue" strokeWidth="2" className="wave-ripple" style={{ animationDelay: '0.8s' }} />
          </svg>
        </div>

        {/* Draw Winding Path dynamic connector lines overlay representing progress */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <svg width="100%" height="100%">
            {ISLANDS_DATA.map((island, index) => {
              if (index === ISLANDS_DATA.length - 1) return null;
              const nextIsland = ISLANDS_DATA[index + 1];
              const isNextLocked = lockedIslands[nextIsland.id];
              return (
                <g key={island.id}>
                  {/* Underlay thick path */}
                  <line
                    x1={`${island.x}%`}
                    y1={`${island.y}%`}
                    x2={`${nextIsland.x}%`}
                    y2={`${nextIsland.y}%`}
                    stroke="#D1D5DB"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Overlay progress dash */}
                  <line
                    x1={`${island.x}%`}
                    y1={`${island.y}%`}
                    x2={`${nextIsland.x}%`}
                    y2={`${nextIsland.y}%`}
                    stroke={isNextLocked ? "#9CA3AF" : "#F59E0B"}
                    strokeWidth="4"
                    strokeDasharray="6,6"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Islands rendering */}
        {ISLANDS_DATA.map((island) => {
          const isLocked = lockedIslands[island.id];
          const isNumiHere = numiIsland.id === island.id;
          const mastery = islandProgress[island.id] || 0;

          return (
            <div
              key={island.id}
              style={{ left: `${island.x}%`, top: `${island.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              {/* Pulsing glow if Numi is here */}
              {isNumiHere && !isLocked && (
                <div className="absolute -inset-4 rounded-full bg-brand-warning/30 animate-ping pointer-events-none" />
              )}

              <motion.button
                whileHover={!isLocked ? { scale: 1.1 } : {}}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleIslandClick(island)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex flex-col items-center justify-center relative shadow-card transition-all cursor-pointer ${
                  isLocked 
                    ? 'bg-slate-300 border-slate-400 opacity-60 cursor-not-allowed grayscale' 
                    : `${island.color} ${isNumiHere ? 'animate-pulse-glow ring-4 ring-brand-warning' : ''}`
                } min-h-[50px] min-w-[50px]`}
              >
                {/* Padlock Icon if locked */}
                {isLocked ? (
                  <span className="text-xl md:text-2xl select-none">🔒</span>
                ) : (
                  <>
                    <span className="text-2xl md:text-3xl select-none">{island.emoji}</span>
                    <span className="text-[8px] md:text-[10px] font-black text-brand-text bg-white/80 py-0.5 px-1 rounded-full border mt-0.5 shadow-sm">
                      {mastery}%
                    </span>
                  </>
                )}

                {/* Animated Numi Owl Character Sitting on the Island */}
                {isNumiHere && !isLocked && (
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute -top-10 text-3xl filter drop-shadow-md select-none"
                  >
                    🦉
                  </motion.div>
                )}
              </motion.button>

              {/* Island Label */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap bg-brand-surface py-0.5 px-2 rounded-full border border-brand-muted/10 shadow-sm text-[10px] md:text-xs font-black text-brand-text">
                {island.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popup Island Card Drawer */}
      <AnimatePresence>
        {selectedIsland && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-brand-surface rounded-card border-4 border-brand-secondary shadow-lg p-6 max-w-sm w-full text-center relative"
            >
              {/* Close Button */}
              <button
                onClick={() => { playClick(); setSelectedIsland(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-lg text-brand-text cursor-pointer"
              >
                ✕
              </button>

              <span className="text-6xl block mb-2">{selectedIsland.emoji}</span>
              <h3 className="text-2xl font-black text-brand-text">{selectedIsland.name}</h3>
              
              <div className="my-4 bg-brand-background p-4 rounded-card border-2 border-brand-muted/10">
                <p className="text-sm text-brand-muted mb-2 font-parent font-semibold">Your Skill Mastery</p>
                <div className="w-full bg-slate-200 h-6 rounded-full overflow-hidden relative border shadow-inner">
                  <div
                    className="bg-brand-success h-full transition-all duration-500"
                    style={{ width: `${islandProgress[selectedIsland.id] || 0}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center font-black text-sm text-slate-800">
                    {islandProgress[selectedIsland.id] || 0}%
                  </span>
                </div>
                <p className="text-xs text-brand-muted font-parent mt-2">Reach 80% to unlock the next island!</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleStartLesson(selectedIsland)}
                className="w-full py-4 bg-brand-primary text-white font-black text-xl rounded-btn shadow hover:opacity-90 transition min-h-[56px]"
              >
                Let's Go! 🚀
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
