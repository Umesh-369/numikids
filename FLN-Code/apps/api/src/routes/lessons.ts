import { Router, Response } from 'express';
import { Lesson } from '../models/Lesson';
import { ChildProfile } from '../models/ChildProfile';
import { SkillTreeService } from '../services/SkillTreeService';
import { GeminiService } from '../services/GeminiService';
import { childAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/lessons - Query lessons with filters
router.get('/', async (req, res) => {
  try {
    const { ageGroup, skillId, difficultyLevel } = req.query;
    const filter: Record<string, any> = {};
    
    if (ageGroup) filter.ageGroups = ageGroup;
    if (skillId) filter.skillId = skillId;
    if (difficultyLevel) filter.difficultyLevel = Number(difficultyLevel);

    const lessons = await Lesson.find(filter).select('-questions');
    return res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/lessons/:id - Get full lesson details with questions
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id === 'recommended') {
      // route matches next recommend endpoint logic, ignore here
      return;
    }
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }
    return res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/lessons/recommended/:childId - Adaptive recommendation
router.get('/recommended/:childId', async (req, res) => {
  try {
    const child = await ChildProfile.findById(req.params.childId);
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    // 1. Get next lesson recommendation from the SkillTreeService
    let lesson = await SkillTreeService.getNextLesson(child);
    
    // 2. If no lesson exists in the database for the next concept, dynamically create one using Gemini!
    if (!lesson) {
      // Find the lowest mastery non-locked skill
      const unlockedSkills = Object.keys(child.skillTree).filter(skillId => !SkillTreeService.isSkillLocked(child, skillId));
      const targetSkill = unlockedSkills[0] || 'counting-to-5';
      
      console.log(`Generating a dynamic adaptive lesson via Gemini for skill: ${targetSkill}`);
      
      // Generate 5 questions dynamically
      const questions = [];
      for (let i = 1; i <= 5; i++) {
        const question = await GeminiService.generateAdaptiveQuestion(child.ageGroup, targetSkill);
        questions.push(question);
      }

      // Create a temporary lesson structure
      lesson = {
        title: `Adventure in ${targetSkill.replace('-', ' ')}`,
        skillId: targetSkill,
        ageGroups: [child.ageGroup],
        difficultyLevel: 1,
        worldIsland: 'Counting Cove', // Default island
        activityType: targetSkill.startsWith('counting') ? 'tap-answer' : 'fill-blank',
        questions: questions,
        estimatedMinutes: 5,
        prerequisiteSkills: []
      } as any;
    }

    return res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    console.error('Error getting recommended lesson:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
