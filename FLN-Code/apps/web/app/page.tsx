'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAudio } from '../lib/useAudio';

export default function LandingPage() {
  const { playClick } = useAudio();

  return (
    <div className="min-h-screen bg-brand-background flex flex-col justify-between p-6 md:p-12 font-child">
      {/* Header */}
      <header className="flex justify-between items-center max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-4xl">🦉</span>
          <span className="text-3xl font-extrabold text-brand-primary tracking-wide">FLN</span>
        </div>
        <Link href="/login" onClick={playClick}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="btn-3d btn-3d-light px-6 py-3 min-h-[56px] min-w-[120px]"
          >
            Parent Zone 🔑
          </motion.button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 max-w-6xl w-full mx-auto my-8">
        {/* Mascot / Art */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative w-72 h-72 md:w-96 md:h-96 bg-brand-warning/20 rounded-full flex items-center justify-center border-4 border-dashed border-brand-warning/40"
        >
          <div className="text-center">
            <span className="text-[120px] md:text-[180px] select-none block animate-float">🦉</span>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-brand-surface py-2 px-6 rounded-full border-2 border-brand-warning font-black text-brand-text shadow-card text-lg whitespace-nowrap">
              Hi, I am Numi! Let's play math! 🌟
            </div>
          </div>
        </motion.div>

        {/* Text and Actions */}
        <div className="flex flex-col max-w-lg text-center md:text-left items-center md:items-start gap-6">
          <h1 className="text-4xl md:text-6xl font-black leading-tight text-brand-text">
            Play with Numbers, <br />
            <span className="text-brand-primary">Unlock Adventures!</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-muted leading-relaxed font-medium">
            FLN is a gamified, safe learning space for kids aged 3–8. Learn counting, addition, shapes, and earn coins to dress up Numi!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Link href="/login" className="w-full" onClick={playClick}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="btn-3d btn-3d-primary w-full sm:w-auto px-10 py-5 text-2xl min-h-[56px] min-w-[200px]"
              >
                Let's Play! 🚀
              </motion.button>
            </Link>
            <Link href="/register" className="w-full" onClick={playClick}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="btn-3d btn-3d-secondary w-full sm:w-auto px-8 py-5 text-2xl min-h-[56px] min-w-[200px]"
              >
                Register 📝
              </motion.button>
            </Link>
          </div>

          <div className="bg-amber-100/50 border border-amber-200 p-4 rounded-card text-sm text-amber-900 mt-4 text-center md:text-left">
            <strong>💡 Quick Demo Access:</strong> Use email <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">parent@fln.com</code> and password <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">password123</code> to log in instantly!
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-brand-muted border-t border-brand-muted/10 pt-6 max-w-6xl w-full mx-auto font-parent">
        <p>© 2026 FLN. Built in accordance with Foundational Literacy and Numeracy (FLN) guidelines. Parent supervision recommended.</p>
      </footer>
    </div>
  );
}
