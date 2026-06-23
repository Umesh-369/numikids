import { IChildProfile, ILesson } from 'shared';
import { Lesson } from '../models/Lesson';
import { ChildProfile } from '../models/ChildProfile';

export const SKILL_DAG: Record<string, { prerequisites: string[]; name: string; worldIsland: string }> = {
  'level-1': { prerequisites: [], name: 'Quantity Comparison', worldIsland: 'Comparison Cove' },
  'level-2': { prerequisites: ['level-1'], name: 'Odd One Out', worldIsland: 'Classification Shore' },
  'level-3': { prerequisites: ['level-2'], name: 'Matching & Tracing', worldIsland: 'Matching Mountain' },
  'level-4': { prerequisites: ['level-3'], name: 'Numbers 1-10', worldIsland: 'Number Peak' },
  'level-5': { prerequisites: ['level-4'], name: 'Finger Counting', worldIsland: 'Number Peak' },
  'level-6': { prerequisites: ['level-5'], name: 'After, Between, Before', worldIsland: 'Ordering Oasis' },
  'level-7': { prerequisites: ['level-6'], name: 'Addition with Objects', worldIsland: 'Addition Archipelago' },
  'level-8': { prerequisites: ['level-7'], name: 'Subtraction 1-10', worldIsland: 'Subtraction Shore' },
  'level-9': { prerequisites: ['level-8'], name: 'Pattern Recognition', worldIsland: 'Pattern Peak' },
  'level-10': { prerequisites: ['level-9'], name: 'Comparison - Numeral', worldIsland: 'Comparison Cove' },
  'level-11': { prerequisites: ['level-10'], name: 'Review Assessment 1', worldIsland: 'Assessment Arena' },
  'level-12': { prerequisites: ['level-11'], name: 'Tens and Ones', worldIsland: 'Place Value Plains' },
  'level-13': { prerequisites: ['level-12'], name: 'Numbers 11-30', worldIsland: 'Number Peak' },
  'level-14': { prerequisites: ['level-13'], name: 'Counting & Fun Trace', worldIsland: 'Number Peak' },
  'level-15': { prerequisites: ['level-14'], name: 'Mixed Practice', worldIsland: 'Assessment Arena' },
  'level-16': { prerequisites: ['level-15'], name: 'Addition 1-30', worldIsland: 'Addition Archipelago' },
  'level-17': { prerequisites: ['level-16'], name: 'Subtraction 1-30', worldIsland: 'Subtraction Shore' },
  'level-18': { prerequisites: ['level-17'], name: 'Ordering 1-30', worldIsland: 'Ordering Oasis' },
  'level-19': { prerequisites: ['level-18'], name: 'Numbering 31-50', worldIsland: 'Number Peak' },
  'level-20': { prerequisites: ['level-19'], name: 'Skip Counting', worldIsland: 'Ordering Oasis' },
  'level-21': { prerequisites: ['level-20'], name: 'Comparison 1-50', worldIsland: 'Comparison Cove' },
  'level-22': { prerequisites: ['level-21'], name: 'Ordering 1-50', worldIsland: 'Ordering Oasis' },
  'level-23': { prerequisites: ['level-22'], name: 'Review Assessment 2', worldIsland: 'Assessment Arena' },
};

export class SkillTreeService {
  /**
   * Recalculates mastery score:
   * mastery = (correctAnswers / totalAttempts) * 70 + (recencyBonus) * 30
   * recencyBonus decays by 10 points for each day since last practiced, starting at 100.
   */
  static calculateMasteryScore(correctAttempts: number, totalAttempts: number, lastPracticed?: Date): number {
    if (totalAttempts <= 0) return 0;
    
    let recencyBonus = 100;
    if (lastPracticed) {
      const msDiff = Date.now() - new Date(lastPracticed).getTime();
      const daysDiff = msDiff / (1000 * 60 * 60 * 24);
      recencyBonus = Math.max(0, 100 - Math.floor(daysDiff) * 10);
    }
    
    const accuracy = (correctAttempts / totalAttempts) * 100;
    const mastery = accuracy * 0.7 + recencyBonus * 0.3;
    return Math.min(100, Math.max(0, Math.round(mastery)));
  }

  private static getSkillState(child: IChildProfile, skillId: string) {
    if (!child.skillTree) return undefined;
    return (child.skillTree instanceof Map || typeof (child.skillTree as any).get === 'function')
      ? (child.skillTree as any).get(skillId)
      : (child.skillTree as any)[skillId];
  }

  /**
   * Checks if a skill is locked for a child.
   * A skill is locked if any of its prerequisites have mastery < 80%
   */
  static isSkillLocked(child: IChildProfile, skillId: string): boolean {
    const config = SKILL_DAG[skillId];
    if (!config) return false; // Unknown skill, default unlocked
    
    for (const prereq of config.prerequisites) {
      const prereqState = this.getSkillState(child, prereq);
      if (!prereqState || prereqState.mastery < 80) {
        return true; // Locked
      }
    }
    return false; // Unlocked
  }

  /**
   * Auto-selects the next lesson for a child.
   * Strategy:
   * 1. Find all unlocked skills.
   * 2. Find if any unlocked skill was last practiced > 3 days ago (spaced repetition candidates).
   * 3. If there are spaced repetition candidates, pick the one with the lowest mastery.
   * 4. If not, pick the unlocked skill with the lowest mastery.
   * 5. Find lessons matching that skill and child's age group, filter out lessons they've already 3-starred,
   *    and return the lowest difficulty level lesson.
   */
  static async getNextLesson(child: IChildProfile): Promise<ILesson | null> {
    const ageGroup = child.ageGroup;
    const unlockedSkills = Object.keys(SKILL_DAG).filter(skillId => !this.isSkillLocked(child, skillId));
    
    if (unlockedSkills.length === 0) return null;

    // Check for spaced repetition (lastPracticed > 3 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const spacedRepetitionSkills = unlockedSkills.filter(skillId => {
      const state = this.getSkillState(child, skillId);
      return state && state.lastPracticed && new Date(state.lastPracticed) < threeDaysAgo;
    });

    let targetSkill = '';
    const candidates = spacedRepetitionSkills.length > 0 ? spacedRepetitionSkills : unlockedSkills;

    // Pick the skill with the lowest mastery score
    let lowestMastery = 101;
    for (const skillId of candidates) {
      const state = this.getSkillState(child, skillId);
      const mastery = state ? state.mastery : 0;
      if (mastery < lowestMastery) {
        lowestMastery = mastery;
        targetSkill = skillId;
      }
    }

    if (!targetSkill) {
      targetSkill = unlockedSkills[0];
    }

    // Find lessons for this skill and child's age group
    const lessons = await Lesson.find({
      skillId: targetSkill,
      ageGroups: ageGroup
    }).sort({ difficultyLevel: 1 });

    if (lessons.length === 0) {
      // Fallback: search for any age group if none matches perfectly
      const fallbackLessons = await Lesson.find({
        skillId: targetSkill
      }).sort({ difficultyLevel: 1 });
      return fallbackLessons[0] || null;
    }

    return lessons[0];
  }
}
export default SkillTreeService;
