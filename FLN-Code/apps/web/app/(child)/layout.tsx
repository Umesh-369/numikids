'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../lib/store';
import { useAudio } from '../../lib/useAudio';
import { apiFetch } from '../../lib/api';

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { playClick, playSuccess, playWrong } = useAudio();
  const { childProfile, childToken, soundEnabled, setSoundEnabled, logoutChild } = useAppStore();

  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [gateQuestion, setGateQuestion] = useState({ q: '', a: 0 });
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // If no child session exists, redirect back to login
    if (mounted && !childToken) {
      router.push('/login');
    }
  }, [mounted, childToken, router]);

  // Generate a random math equation for parent gate verification
  const openParentGate = () => {
    playClick();
    const num1 = Math.floor(Math.random() * 8) + 8; // 8-15
    const num2 = Math.floor(Math.random() * 7) + 3;  // 3-9
    setGateQuestion({
      q: `What is ${num1} + ${num2}?`,
      a: num1 + num2
    });
    setGateInput('');
    setGateError(false);
    setParentGateOpen(true);
  };

  const handleVerifyGate = () => {
    if (Number(gateInput) === gateQuestion.a) {
      playSuccess();
      setParentGateOpen(false);
      logoutChild();
      router.push('/parent/dashboard');
    } else {
      playWrong();
      setGateError(true);
      setGateInput('');
    }
  };

  if (!mounted || !childProfile) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center font-child">
        <div className="text-center">
          <span className="text-6xl block animate-bounce">🦉</span>
          <p className="text-xl font-bold mt-4 text-brand-text">Loading adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-background flex flex-col font-child select-none">
      
      {/* Persistent Child Header */}
      <header className="bg-brand-surface/75 backdrop-blur-md border-b-4 border-brand-muted/10 px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        
        {/* Left: Home / Navigation */}
        <div className="flex items-center gap-3">
          <Link href="/home" onClick={playClick} className="flex items-center gap-2">
            <span className="text-4xl animate-float">🦉</span>
            <span className="text-xl font-extrabold text-brand-primary hidden sm:inline">FLN</span>
          </Link>
          <nav className="flex gap-2">
            <Link href="/home" onClick={playClick}>
              <button className={`btn-3d px-4 py-2 text-sm min-h-[48px] ${pathname === '/home' ? 'btn-3d-primary' : 'btn-3d-light'}`}>
                🗺️ Map
              </button>
            </Link>
            <Link href="/games" onClick={playClick}>
              <button className={`btn-3d px-4 py-2 text-sm min-h-[48px] ${pathname === '/games' ? 'btn-3d-secondary' : 'btn-3d-light'}`}>
                🎮 Fun Zone
              </button>
            </Link>
          </nav>
        </div>

        {/* Center: Stars & Coins */}
        <div className="flex items-center gap-4 bg-brand-background py-1.5 px-4 rounded-full border-2 border-brand-muted/10 shadow-inner">
          <div className="flex items-center gap-1">
            <span className="text-xl">⭐</span>
            <span className="font-extrabold text-brand-text text-lg">{childProfile.totalStars}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xl">🪙</span>
            <span className="font-extrabold text-brand-text text-lg">{childProfile.coins}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xl">🔥</span>
            <span className="font-extrabold text-brand-text text-lg">{childProfile.streakDays}</span>
          </div>
        </div>

        {/* Right: Audio Control, Profile, Parent Gate */}
        <div className="flex items-center gap-2">
          {/* Audio Toggle (INV-UI-09) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-12 h-12 flex items-center justify-center bg-brand-surface border-2 border-brand-muted/10 rounded-full shadow hover:bg-slate-50 text-xl"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </motion.button>

          {/* Profile Circle (SVG Avatar) */}
          <Link href="/profile" onClick={playClick}>
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 bg-brand-warning/30 border-2 border-brand-warning rounded-full flex items-center justify-center overflow-hidden cursor-pointer shadow hover:border-brand-primary"
            >
              <span className="text-2xl">👦</span>
            </motion.div>
          </Link>

          {/* Exit Parent Gate */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={openParentGate}
            className="hidden md:flex px-4 py-2 border-2 border-dashed border-red-400 text-red-500 font-bold rounded-btn text-sm hover:bg-red-50 transition"
          >
            Parent Zone 🔑
          </motion.button>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>

      {/* Parent Gate Modal */}
      <AnimatePresence>
        {parentGateOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-surface rounded-card shadow-lg p-6 max-w-sm w-full border-4 border-red-200 text-center font-parent"
            >
              <span className="text-5xl block mb-2">🔒</span>
              <h3 className="text-xl font-bold text-brand-text mb-2">Parents Only!</h3>
              <p className="text-sm text-brand-muted mb-4">Please solve this simple equation to exit to settings:</p>
              
              <div className="text-2xl font-black text-brand-primary bg-brand-background p-3 rounded-btn border border-brand-muted/10 mb-4 tracking-wide">
                {gateQuestion.q}
              </div>

              {gateError && (
                <p className="text-red-500 text-xs font-bold mb-2">Oops, that wasn't correct! Let's try again.</p>
              )}

              <input
                type="number"
                placeholder="Your Answer"
                value={gateInput}
                onChange={(e) => setGateInput(e.target.value)}
                className="w-full text-center px-4 py-3 rounded-btn border border-brand-muted/20 text-lg font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyGate()}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => { playClick(); setParentGateOpen(false); }}
                  className="flex-1 py-3 border-2 border-brand-muted/20 font-bold rounded-btn text-brand-text hover:bg-slate-50 min-h-[50px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyGate}
                  className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-btn hover:opacity-90 min-h-[50px]"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
