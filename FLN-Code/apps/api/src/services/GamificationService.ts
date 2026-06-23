import { IChildProfile, ISession, IBadge } from 'shared';
import { ChildProfile } from '../models/ChildProfile';
import { Badge } from '../models/Badge';
import { Session } from '../models/Session';
import { Lesson } from '../models/Lesson';

export class GamificationService {
  /**
   * Calculates stars earned in a session:
   * - 1 star for completion
   * - 2 stars if >=70% correct
   * - 3 stars if >=90% correct
   */
  static calculateStars(questionsAttempted: number, questionsCorrect: number): number {
    if (questionsAttempted <= 0) return 0;
    const score = (questionsCorrect / questionsAttempted) * 100;
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    return 1;
  }

  /**
   * Calculates coins earned:
   * - 10 coins per correct answer
   * - -2 coins per hint used
   * - 50 coins bonus for 3 stars
   */
  static calculateCoins(questionsCorrect: number, totalHintsUsed: number, stars: number): number {
    let earned = questionsCorrect * 10 - totalHintsUsed * 2;
    if (stars === 3) {
      earned += 50;
    }
    return Math.max(0, earned);
  }

  /**
   * Checks and awards new badges. Returns the list of newly unlocked badge IDs.
   */
  static async checkAndAwardBadges(child: any): Promise<string[]> {
    const newlyUnlocked: string[] = [];
    const allBadges = await Badge.find({});
    
    // Fetch sessions to evaluate session-based conditions
    const childSessions = await Session.find({ childId: child._id });
    
    for (const badge of allBadges) {
      if (child.unlockedBadges.includes(badge._id)) {
        continue;
      }
      
      let isUnlocked = false;
      const { type, threshold, skillId } = badge.condition;
      
      switch (type) {
        case 'streak':
          if (child.streakDays >= threshold) {
            isUnlocked = true;
          }
          break;
          
        case 'sessions':
          if (childSessions.length >= threshold) {
            isUnlocked = true;
          }
          break;
          
        case 'mastery':
          if (skillId) {
            const skillState = child.skillTree.get(skillId) || child.skillTree[skillId];
            if (skillState && skillState.mastery >= threshold) {
              isUnlocked = true;
            }
          }
          break;
          
        case 'coins':
          if (child.coins >= threshold) {
            isUnlocked = true;
          }
          break;
          
        case 'speed':
          // Speed Demon: answer 5 in a row in under 3 seconds each in any session
          // We can check if any session has a sub-sequence of 5 correct answers each with timeToAnswerMs < 3000
          for (const s of childSessions) {
            let consecutiveFast = 0;
            for (const log of s.answerLog) {
              if (log.correct && log.timeToAnswerMs < 3000) {
                consecutiveFast++;
                if (consecutiveFast >= threshold) {
                  isUnlocked = true;
                  break;
                }
              } else {
                consecutiveFast = 0;
              }
            }
            if (isUnlocked) break;
          }
          break;
      }
      
      // Special logic for Explorer badge if condition is custom
      if (badge._id === 'explorer') {
        // Visit all 6 islands. We can check sessions or unlocked skills
        const completedLessonIds = childSessions.map(s => s.lessonId);
        const completedLessons = await Lesson.find({ _id: { $in: completedLessonIds } });
        const uniqueIslands = new Set(completedLessons.map(l => l.worldIsland));
        if (uniqueIslands.size >= 6) {
          isUnlocked = true;
        }
      }

      // Math Wizard: 100% on any lesson
      if (badge._id === 'math-wizard') {
        const hasWizardSession = childSessions.some(s => s.questionsCorrect === s.questionsAttempted && s.questionsAttempted > 0);
        if (hasWizardSession) {
          isUnlocked = true;
        }
      }

      // Perfect Week: 3-star every lesson in a week (7 sessions with 3 stars)
      if (badge._id === 'perfect-week') {
        const threeStarCount = childSessions.filter(s => s.starsEarned === 3).length;
        if (threeStarCount >= 7) {
          isUnlocked = true;
        }
      }

      if (isUnlocked) {
        newlyUnlocked.push(badge._id);
      }
    }
    
    if (newlyUnlocked.length > 0) {
      child.unlockedBadges.push(...newlyUnlocked);
      await child.save();
    }
    
    return newlyUnlocked;
  }
}
export default GamificationService;
