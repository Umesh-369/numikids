'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAudio } from '../../lib/useAudio';
import { useAppStore } from '../../lib/store';
import { apiFetch } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { playClick, playSuccess, playWrong } = useAudio();
  const { setParentSession } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'parent' | 'teacher'>('parent');
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setError('');

    if (!privacyChecked) {
      playWrong();
      setError('You must accept the COPPA Privacy Policy to register.');
      return;
    }

    setLoading(true);
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    setLoading(false);
    if (res.success && res.data) {
      playSuccess();
      setParentSession(res.data.token, res.data.user);
      router.push('/parent/children');
    } else {
      playWrong();
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col justify-center items-center p-6 font-child">
      <div className="max-w-md w-full glass-card p-8">
        
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            <span className="text-5xl block animate-float">🦉</span>
            <h2 className="text-3xl font-black text-brand-primary mt-2">FLN</h2>
          </Link>
        </div>

        <h3 className="text-xl font-bold text-center text-brand-text mb-6 font-parent">Create Parent Account</h3>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-200 text-red-700 p-3 rounded-btn text-center font-bold text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4 font-parent">
          <div>
            <label className="block text-brand-text font-bold mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 glass-input rounded-btn text-base"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-brand-text font-bold mb-1">Password (min 6 chars)</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 glass-input rounded-btn text-base"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-brand-text font-bold mb-1">Are you a Parent or Teacher?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={role === 'parent'}
                  onChange={() => setRole('parent')}
                  className="accent-brand-primary h-5 w-5"
                />
                <span className="font-medium text-brand-text">Parent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  checked={role === 'teacher'}
                  onChange={() => setRole('teacher')}
                  className="accent-brand-primary h-5 w-5"
                />
                <span className="font-medium text-brand-text">Teacher / School</span>
              </label>
            </div>
          </div>

          {/* COPPA Privacy Policy Confirmation (INV-SEC-01) */}
          <div className="mt-2 bg-slate-50 border border-slate-200 p-3 rounded-btn">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="mt-1 h-5 w-5 accent-brand-primary"
              />
              <span className="text-xs text-brand-muted leading-tight font-medium">
                I verify that I am a parent or legal guardian. I consent to FLN storing child profile learning progress and agree to the <strong>COPPA Safe Harbor Privacy Policy</strong>.
              </span>
            </label>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            type="submit"
            disabled={loading}
            className="btn-3d btn-3d-secondary w-full py-4 mt-2 text-lg min-h-[56px]"
          >
            {loading ? 'Creating Account...' : 'Parent Register 📝'}
          </motion.button>

          <p className="text-center text-sm text-brand-muted mt-2 font-parent">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-primary font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
