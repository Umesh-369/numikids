'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAudio } from '../../lib/useAudio';
import { useAppStore } from '../../lib/store';
import { apiFetch } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { playClick, playSuccess, playWrong } = useAudio();
  const { setParentSession, setSelectedChild, parentToken } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [childrenList, setChildrenList] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // If parentToken is already set, we can fetch children profiles directly
    if (mounted && parentToken) {
      setLoggedIn(true);
      fetchChildren();
    }
  }, [mounted, parentToken]);

  const fetchChildren = async () => {
    const res = await apiFetch('/children');
    if (res.success && res.data) {
      setChildrenList(res.data);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setError('');
    setLoading(true);

    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (res.success && res.data) {
      playSuccess();
      setParentSession(res.data.token, res.data.user);
      setLoggedIn(true);
      
      // Fetch children profiles
      const childRes = await apiFetch('/children');
      if (childRes.success && childRes.data) {
        setChildrenList(childRes.data);
        if (childRes.data.length === 0) {
          router.push('/parent/children'); // Redirect to create a profile
        }
      }
    } else {
      playWrong();
      setError(res.error || 'Invalid email or password');
    }
  };


  const startChildSession = async (childId: string) => {
    playClick();
    const res = await apiFetch(`/children/${childId}/session`, {
      method: 'POST',
    });

    if (res.success && res.data) {
      playSuccess();
      setSelectedChild(res.data.child, res.data.token);
      router.push('/home'); // Go to World Map!
    } else {
      playWrong();
      setError('Failed to start child session');
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

        {error && (
          <div className="mb-4 bg-red-100 border border-red-200 text-red-700 p-3 rounded-btn text-center font-bold">
            ⚠️ {error}
          </div>
        )}

        {!loggedIn ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="flex flex-col gap-4 font-parent">
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
              <label className="block text-brand-text font-bold mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 glass-input rounded-btn text-base"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={loading}
              className="btn-3d btn-3d-primary w-full py-4 mt-2 text-lg min-h-[56px]"
            >
              {loading ? 'Logging in...' : 'Parent Login 🔑'}
            </motion.button>
            <p className="text-center text-sm text-brand-muted mt-2 font-parent">
              Don't have an account?{' '}
              <Link href="/register" className="text-brand-primary font-bold hover:underline">
                Register here
              </Link>
            </p>
          </form>
        ) : (
          /* Child Profile Selector */
          <div className="text-center font-child">
            <h3 className="text-2xl font-black text-brand-text mb-1">Who is playing today?</h3>
            <p className="text-brand-muted mb-6">Select a profile to start math adventures</p>

            <div className="flex flex-col gap-3">
              {childrenList.map((child) => (
                <motion.button
                  key={child._id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startChildSession(child._id)}
                  className="flex items-center justify-between p-4 card-3d text-left min-h-[56px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👦</span>
                    <div>
                      <h4 className="font-black text-brand-text text-lg">{child.name}</h4>
                      <p className="text-xs text-brand-muted font-parent">Age: {child.ageGroup} | ⭐ {child.totalStars}</p>
                    </div>
                  </div>
                  <span className="text-xl">🚀</span>
                </motion.button>
              ))}
              
              <Link href="/parent/children" onClick={playClick}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="btn-3d btn-3d-secondary w-full py-3 text-base min-h-[56px]"
                >
                  ➕ Create New Profile
                </motion.button>
              </Link>
            </div>

            <hr className="my-6 border-brand-muted/10" />

            <Link href="/parent/dashboard" onClick={playClick}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="btn-3d btn-3d-light w-full py-3 text-base min-h-[56px]"
              >
                Go to Parent Dashboard 📊
              </motion.button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
