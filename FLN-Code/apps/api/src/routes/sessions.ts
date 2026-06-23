import { Router, Response } from 'express';
import { z } from 'zod';
import { Session } from '../models/Session';
import { ChildProfile } from '../models/ChildProfile';
import { Lesson } from '../models/Lesson';
import { User } from '../models/User';
import { SkillTreeService } from '../services/SkillTreeService';
import { GamificationService } from '../services/GamificationService';
import { StreakService } from '../services/StreakService';
import { EmailService } from '../services/EmailService';

const router = Router();

const submitSessionSchema = z.object({
  childId: z.string(),
  lessonId: z.string(),
  durationSeconds: z.number(),
  questionsAttempted: z.number(),
  questionsCorrect: z.number(),
  answerLog: z.array(z.object({
    questionId: z.string(),
    answerId: z.string(),
    correct: z.boolean(),
    timeToAnswerMs: z.number(),
    hintsUsed: z.number()
  }))
});

// POST /api/sessions - Submit finished session results
router.post('/', async (req, res) => {
  try {
    const body = submitSessionSchema.parse(req.body);
    
    // 1. Fetch child and lesson details
    const child = await ChildProfile.findById(body.childId);
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    const lesson = await Lesson.findById(body.lessonId);
    // Note: lesson can be null if it was a dynamically generated lesson (Gemini-based)
    const skillId = lesson ? lesson.skillId : 'counting-to-5';

    // 2. Calculate session awards
    const stars = GamificationService.calculateStars(body.questionsAttempted, body.questionsCorrect);
    
    const hintsUsed = body.answerLog.reduce((sum, item) => sum + item.hintsUsed, 0);
    const coins = GamificationService.calculateCoins(body.questionsCorrect, hintsUsed, stars);

    // 3. Save the session log
    const session = new Session({
      childId: child._id,
      lessonId: body.lessonId,
      startedAt: new Date(Date.now() - body.durationSeconds * 1000),
      completedAt: new Date(),
      durationSeconds: body.durationSeconds,
      questionsAttempted: body.questionsAttempted,
      questionsCorrect: body.questionsCorrect,
      starsEarned: stars,
      coinsEarned: coins,
      answerLog: body.answerLog
    });
    await session.save();

    // 4. Update child's active streak
    const streakResult = StreakService.updateStreak(child, new Date());
    
    // 5. Update child's cumulative totals
    child.coins += coins;
    child.totalStars += stars;

    // 6. Recalculate skill tree mastery
    const skillState = (child.skillTree as any).get(skillId) || { attemptsTotal: 0, attemptsCorrect: 0, mastery: 0 };
    const newTotal = skillState.attemptsTotal + body.questionsAttempted;
    const newCorrect = skillState.attemptsCorrect + body.questionsCorrect;
    
    const newMastery = SkillTreeService.calculateMasteryScore(newCorrect, newTotal, new Date());
    
    (child.skillTree as any).set(skillId, {
      attemptsTotal: newTotal,
      attemptsCorrect: newCorrect,
      mastery: newMastery,
      lastPracticed: new Date()
    });

    // If mastery reaches 80% and the next skill is not unlocked, initialize it
    // Add default states for newly unlocked adjacent skills
    const nextSkills = Object.keys(child.skillTree);
    
    // Save child profile updates
    await child.save();

    // 7. Check and award new badges
    const newBadges = await GamificationService.checkAndAwardBadges(child);

    // 8. If new badges unlocked and parent email exists, send achievement notification
    if (newBadges.length > 0) {
      const parent = await User.findById(child.parentId);
      if (parent && parent.email) {
        for (const badgeId of newBadges) {
          // Send email asynchronously
          EmailService.sendAchievementNotification(
            parent.email,
            child.name,
            badgeId.replace(/-/g, ' ').toUpperCase(),
            `Earned after successfully playing math lessons!`
          ).catch(err => console.error('Failed to send achievement email:', err));
        }
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        session,
        starsEarned: stars,
        coinsEarned: coins,
        streakDays: child.streakDays,
        newMastery,
        newBadges,
        childProfile: child
      }
    });

  } catch (error: any) {
    console.error('Session submit error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions/:childId - Get child's session history (paginated)
router.get('/:childId', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({ childId: req.params.childId })
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'lessonId', select: 'title skillId worldIsland' });

    const total = await Session.countDocuments({ childId: req.params.childId });

    return res.status(200).json({
      success: true,
      data: {
        sessions,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
