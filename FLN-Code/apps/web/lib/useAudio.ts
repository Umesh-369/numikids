import { useCallback } from 'react';
import { useAppStore } from './store';

export function useAudio() {
  const { soundEnabled } = useAppStore();

  const playSynthesizedSound = useCallback((type: 'click' | 'correct' | 'wrong' | 'coin' | 'success') => {
    if (!soundEnabled) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'click') {
        // High frequency click
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'correct') {
        // Bright musical arpeggio (C4 to E4 to G4)
        osc.frequency.setValueAtTime(523.25, now); // C
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'wrong') {
        // Low buzzing sound (150Hz decaying)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'coin') {
        // Short high-pitched ring
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'success') {
        // Celebratory melody
        osc.frequency.setValueAtTime(523.25, now); // C
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // High C
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Web Audio synthesis failed:', e);
    }
  }, [soundEnabled]);

  return {
    playClick: () => playSynthesizedSound('click'),
    playCorrect: () => playSynthesizedSound('correct'),
    playWrong: () => playSynthesizedSound('wrong'),
    playCoin: () => playSynthesizedSound('coin'),
    playSuccess: () => playSynthesizedSound('success'),
  };
}
export default useAudio;
