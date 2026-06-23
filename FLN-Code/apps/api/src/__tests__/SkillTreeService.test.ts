import { SkillTreeService } from '../services/SkillTreeService';
import { IChildProfile } from 'shared';

describe('SkillTreeService.isSkillLocked', () => {
  // Mock child profile
  const mockChild: any = {
    parentId: 'parent-123',
    name: 'Chiku',
    ageGroup: '5-6',
    skillTree: new Map([
      ['counting-to-5', { mastery: 90, attemptsTotal: 10, attemptsCorrect: 9 }],
      ['counting-to-10', { mastery: 50, attemptsTotal: 5, attemptsCorrect: 3 }]
    ])
  };

  // Convert map mock helper for isSkillLocked
  const mockChildWithGet: any = {
    ...mockChild,
    skillTree: {
      'counting-to-5': { mastery: 90 },
      'counting-to-10': { mastery: 50 },
      'addition-within-5': { mastery: 0 }
    }
  };

  test('Skill with no prerequisites should be unlocked by default', () => {
    // counting-to-5 has no prerequisites in DAG
    expect(SkillTreeService.isSkillLocked(mockChildWithGet, 'counting-to-5')).toBe(false);
  });

  test('Skill should be unlocked if all prerequisites have mastery >= 80%', () => {
    // counting-to-10 has prerequisite counting-to-5 (which has mastery 90%)
    expect(SkillTreeService.isSkillLocked(mockChildWithGet, 'counting-to-10')).toBe(false);
  });

  test('Skill should be locked if any prerequisite has mastery < 80%', () => {
    // addition-within-5 has prerequisite counting-to-10 (which has mastery 50%)
    expect(SkillTreeService.isSkillLocked(mockChildWithGet, 'addition-within-5')).toBe(true);
  });
});

describe('SkillTreeService.calculateMasteryScore', () => {
  test('Returns 0 if totalAttempts is 0', () => {
    expect(SkillTreeService.calculateMasteryScore(0, 0)).toBe(0);
  });

  test('Mastery includes accuracy and recency bonus', () => {
    // 80% accuracy (56 points) + 100 recency bonus today (30 points) = 86 points
    const score = SkillTreeService.calculateMasteryScore(8, 10, new Date());
    expect(score).toBe(86);
  });
});
