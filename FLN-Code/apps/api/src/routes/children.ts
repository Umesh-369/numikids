import { Router, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { ChildProfile } from '../models/ChildProfile';
import { User } from '../models/User';
import { AuthenticatedRequest, parentAuth } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtsecretkey12345!';

const createChildSchema = z.object({
  name: z.string().min(2),
  ageGroup: z.enum(['3-4', '5-6', '7-8']),
  avatarConfig: z.object({
    skin: z.string().default('peach'),
    hair: z.string().default('curly-brown'),
    eyes: z.string().default('happy'),
    accessory: z.string().default('none'),
    mouth: z.string().default('smile'),
    background: z.string().default('soft-yellow')
  }).optional()
});

const updateChildSchema = z.object({
  name: z.string().min(2).optional(),
  ageGroup: z.enum(['3-4', '5-6', '7-8']).optional(),
  avatarConfig: z.object({
    skin: z.string(),
    hair: z.string(),
    eyes: z.string(),
    accessory: z.string(),
    mouth: z.string(),
    background: z.string()
  }).optional(),
  settings: z.object({
    soundEnabled: z.boolean(),
    voiceInputEnabled: z.boolean(),
    dailyTimeLimitMinutes: z.number().min(5).max(180)
  }).optional(),
  coins: z.number().optional(),
  totalStars: z.number().optional()
});

// GET /api/children - List parent's children
router.get('/', parentAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const children = await ChildProfile.find({ parentId: req.user?.id });
    return res.status(200).json({ success: true, data: children });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/children - Create a child profile
router.post('/', parentAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = createChildSchema.parse(req.body);
    
    // Check limit: standard plan allows up to 4 children (coping mechanism)
    const count = await ChildProfile.countDocuments({ parentId: req.user?.id });
    if (count >= 5) {
      return res.status(400).json({ success: false, error: 'Maximum 5 profiles allowed' });
    }

    const child = new ChildProfile({
      parentId: req.user?.id,
      name: body.name,
      ageGroup: body.ageGroup,
      avatarUrl: '',
      avatarConfig: body.avatarConfig || {
        skin: 'peach',
        hair: 'curly-brown',
        eyes: 'happy',
        accessory: 'none',
        mouth: 'smile',
        background: 'soft-yellow'
      },
      coins: 0,
      totalStars: 0,
      streakDays: 0,
      skillTree: {
        'counting-to-5': { mastery: 0, attemptsTotal: 0, attemptsCorrect: 0 }
      },
      unlockedBadges: [],
      unlockedAvatarItems: ['skin-peach', 'hair-curly-brown', 'eyes-happy', 'accessory-none', 'mouth-smile', 'background-soft-yellow'],
      settings: {
        soundEnabled: true,
        voiceInputEnabled: false,
        dailyTimeLimitMinutes: 30
      }
    });

    await child.save();

    // Update parent's children list
    await User.findByIdAndUpdate(req.user?.id, {
      $push: { children: child._id }
    });

    return res.status(201).json({ success: true, data: child });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/children/:id - Get specific child details
router.get('/:id', parentAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const child = await ChildProfile.findOne({ _id: req.params.id, parentId: req.user?.id });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }
    return res.status(200).json({ success: true, data: child });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/children/:id - Update settings / profile / avatar
router.patch('/:id', parentAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = updateChildSchema.parse(req.body);
    const child = await ChildProfile.findOneAndUpdate(
      { _id: req.params.id, parentId: req.user?.id },
      { $set: body },
      { new: true }
    );

    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    return res.status(200).json({ success: true, data: child });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/children/:id - Remove child profile
router.delete('/:id', parentAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const child = await ChildProfile.findOneAndDelete({ _id: req.params.id, parentId: req.user?.id });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    // Remove reference from User
    await User.findByIdAndUpdate(req.user?.id, {
      $pull: { children: child._id }
    });

    return res.status(200).json({ success: true, data: { message: 'Child profile deleted' } });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/children/:id/session - Start child session and return short-lived token (4 hours)
router.post('/:id/session', parentAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const child = await ChildProfile.findOne({ _id: req.params.id, parentId: req.user?.id });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    // Sign child token
    const token = jwt.sign(
      { id: child._id, parentId: req.user?.id, ageGroup: child.ageGroup },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        child
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
