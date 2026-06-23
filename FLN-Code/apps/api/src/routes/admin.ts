import { Router, Response } from 'express';
import { Lesson } from '../models/Lesson';
import { parentAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/admin/lessons - Create a new lesson (teacher/admin only)
router.post('/lessons', parentAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'teacher') {
      return res.status(403).json({ success: false, error: 'Only teacher/admin can access this route' });
    }

    const lesson = new Lesson(req.body);
    await lesson.save();

    return res.status(201).json({ success: true, data: lesson });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
