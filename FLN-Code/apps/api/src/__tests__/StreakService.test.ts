import { StreakService } from '../services/StreakService';

describe('StreakService.updateStreak', () => {
  test('First active session ever should start a 1-day streak', () => {
    const child = { streakDays: 0, lastActiveDate: null };
    const date = new Date('2026-06-20T10:00:00Z');
    
    const result = StreakService.updateStreak(child, date);
    
    expect(result.streakDays).toBe(1);
    expect(result.status).toBe('incremented');
  });

  test('Session on the same calendar day should keep streak same', () => {
    const lastActive = new Date('2026-06-20T10:00:00Z');
    const child = { streakDays: 5, lastActiveDate: lastActive };
    const sessionDate = new Date('2026-06-20T18:00:00Z'); // 8 hours later
    
    const result = StreakService.updateStreak(child, sessionDate);
    
    expect(result.streakDays).toBe(5);
    expect(result.status).toBe('same_day');
  });

  test('Session on the next calendar day should increment streak by 1', () => {
    const lastActive = new Date('2026-06-20T10:00:00Z');
    const child = { streakDays: 5, lastActiveDate: lastActive };
    const sessionDate = new Date('2026-06-21T11:00:00Z'); // Next day
    
    const result = StreakService.updateStreak(child, sessionDate);
    
    expect(result.streakDays).toBe(6);
    expect(result.status).toBe('incremented');
  });

  test('Session after a gap of more than 1 day should reset streak to 1', () => {
    const lastActive = new Date('2026-06-20T10:00:00Z');
    const child = { streakDays: 5, lastActiveDate: lastActive };
    const sessionDate = new Date('2026-06-23T10:00:00Z'); // 3 days gap
    
    const result = StreakService.updateStreak(child, sessionDate);
    
    expect(result.streakDays).toBe(1);
    expect(result.status).toBe('reset');
  });
});
