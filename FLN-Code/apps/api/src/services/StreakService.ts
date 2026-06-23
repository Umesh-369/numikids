import { IChildProfile } from 'shared';

export class StreakService {
  /**
   * Updates a child's streak days based on the date of their active session.
   * Compares the session date with lastActiveDate.
   * Returns an object indicating the new streak and if it was broken/incremented.
   */
  static updateStreak(
    child: { streakDays: number; lastActiveDate?: Date | string | null },
    sessionDate: Date = new Date()
  ): { streakDays: number; status: 'same_day' | 'incremented' | 'reset' } {
    if (!child.lastActiveDate) {
      // First active day ever
      child.streakDays = 1;
      child.lastActiveDate = sessionDate;
      return { streakDays: 1, status: 'incremented' };
    }

    const lastDate = new Date(child.lastActiveDate);
    
    // Normalize to Midnight UTC/Local to check day difference
    const d1 = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const d2 = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already active today
      return { streakDays: child.streakDays, status: 'same_day' };
    } else if (diffDays === 1) {
      // Consecutive day
      child.streakDays += 1;
      child.lastActiveDate = sessionDate;
      return { streakDays: child.streakDays, status: 'incremented' };
    } else {
      // Gap of more than 1 day - streak reset (unless streak saver is applied)
      child.streakDays = 1;
      child.lastActiveDate = sessionDate;
      return { streakDays: 1, status: 'reset' };
    }
  }
}
export default StreakService;
