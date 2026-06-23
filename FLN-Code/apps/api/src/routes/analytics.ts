import { Router, Response } from 'express';
import { Session } from '../models/Session';
import { ChildProfile } from '../models/ChildProfile';
import { SKILL_DAG } from '../services/SkillTreeService';

const router = Router();

// GET /api/analytics/:childId/weekly - Get active session counts for last 7 days
router.get('/:childId/weekly', async (req, res) => {
  try {
    const childId = req.params.childId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sessions = await Session.find({
      childId,
      completedAt: { $gte: sevenDaysAgo }
    });

    // Initialize daily counts
    const dailyStats: Record<string, { sessionsCount: number; starsEarned: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyStats[key] = { sessionsCount: 0, starsEarned: 0 };
    }

    sessions.forEach(s => {
      if (s.completedAt) {
        const key = new Date(s.completedAt).toLocaleDateString('en-US', { weekday: 'short' });
        if (dailyStats[key]) {
          dailyStats[key].sessionsCount += 1;
          dailyStats[key].starsEarned += s.starsEarned;
        }
      }
    });

    const data = Object.keys(dailyStats).reverse().map(weekday => ({
      day: weekday,
      sessions: dailyStats[weekday].sessionsCount,
      stars: dailyStats[weekday].starsEarned
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/analytics/:childId/skills - Get skill mastery progress for radar/bar charts
router.get('/:childId/skills', async (req, res) => {
  try {
    const child = await ChildProfile.findById(req.params.childId);
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    const data = Object.keys(SKILL_DAG).map(skillId => {
      const state = (child.skillTree as any).get(skillId) || (child.skillTree as any)[skillId] || { mastery: 0, attemptsTotal: 0, attemptsCorrect: 0 };
      return {
        skillId,
        name: SKILL_DAG[skillId].name,
        mastery: state.mastery,
        attempts: state.attemptsTotal,
        correct: state.attemptsCorrect
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/analytics/:childId/report - Aggregate report summary for PDF downloads
router.get('/:childId/report', async (req, res) => {
  try {
    const childId = req.params.childId;
    const child = await ChildProfile.findById(childId);
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    const sessions = await Session.find({ childId })
      .sort({ startedAt: -1 })
      .limit(10)
      .populate({ path: 'lessonId', select: 'title skillId worldIsland' });

    // Aggregate some general info
    const totalSessions = await Session.countDocuments({ childId });
    const aggregate = await Session.aggregate([
      { $match: { childId: child._id } },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$durationSeconds' },
          totalCorrect: { $sum: '$questionsCorrect' },
          totalAttempted: { $sum: '$questionsAttempted' }
        }
      }
    ]);

    const stats = aggregate[0] || { totalDuration: 0, totalCorrect: 0, totalAttempted: 0 };
    
    // Average accuracy
    const accuracy = stats.totalAttempted > 0 ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0;
    
    // Age benchmark: average child at this age (3-4: 50%, 5-6: 70%, 7-8: 85%)
    const ageBenchmarks = { '3-4': 60, '5-6': 75, '7-8': 85 };
    const benchmark = ageBenchmarks[child.ageGroup] || 70;

    return res.status(200).json({
      success: true,
      data: {
        childName: child.name,
        ageGroup: child.ageGroup,
        streakDays: child.streakDays,
        totalStars: child.totalStars,
        totalCoins: child.coins,
        totalSessions,
        totalMinutesPlayed: Math.round(stats.totalDuration / 60),
        averageAccuracy: accuracy,
        benchmarkComparison: {
          childScore: accuracy,
          peerScore: benchmark
        },
        recentSessions: sessions.map(s => ({
          lessonTitle: (s.lessonId as any)?.title || 'Custom Adventure',
          skillId: (s.lessonId as any)?.skillId || 'counting-to-5',
          stars: s.starsEarned,
          accuracy: s.questionsAttempted > 0 ? Math.round((s.questionsCorrect / s.questionsAttempted) * 100) : 0,
          date: s.completedAt
        }))
      }
    });
  } catch (error) {
    console.error('Failed to get reports data:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
