'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAppStore } from '../../lib/store';
import { useAudio } from '../../lib/useAudio';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { playClick } = useAudio();
  const { parentToken, parentUser, logoutParent } = useAppStore();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Redirect to login if not parent authenticated
    if (mounted && !parentToken) {
      router.push('/login');
    }
  }, [mounted, parentToken, router]);

  const handleLogout = () => {
    playClick();
    logoutParent();
    router.push('/login');
  };

  if (!mounted || !parentToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-parent">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-700">Checking credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-parent">
      {/* Top Navbar */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🦉</span>
          <span className="text-2xl font-black text-brand-primary tracking-wide">FLN Parent Zone</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{parentUser?.email}</p>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">
              {parentUser?.role} account
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-btn hover:bg-slate-50 transition text-sm min-h-[44px]"
          >
            Log Out 🚪
          </button>
        </div>
      </header>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-white border-r p-4 flex flex-col gap-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
          <Link href="/parent/dashboard" onClick={playClick}>
            <button className={`w-full text-left px-4 py-3 rounded-btn font-semibold text-sm transition flex items-center gap-2 ${
              pathname === '/parent/dashboard' ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-600 hover:bg-slate-50'
            } min-h-[48px]`}>
              <span>📊</span> Analytics Overview
            </button>
          </Link>
          <Link href="/parent/children" onClick={playClick}>
            <button className={`w-full text-left px-4 py-3 rounded-btn font-semibold text-sm transition flex items-center gap-2 ${
              pathname === '/parent/children' ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-600 hover:bg-slate-50'
            } min-h-[48px]`}>
              <span>👦</span> Child Profiles
            </button>
          </Link>
          
          <hr className="my-4 border-slate-100" />
          
          <Link href="/login" onClick={playClick}>
            <button className="w-full text-left px-4 py-3 rounded-btn font-semibold text-sm text-brand-secondary hover:bg-teal-50/50 transition flex items-center gap-2 min-h-[48px]">
              <span>🎮</span> Enter Play Mode
            </button>
          </Link>
        </aside>

        {/* Content body */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
