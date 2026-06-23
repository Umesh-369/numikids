import { Router, Response } from 'express';
import { z } from 'zod';
import { Badge } from '../models/Badge';
import { ChildProfile } from '../models/ChildProfile';
import { AVATAR_SHOP_ITEMS } from 'shared';

const router = Router();

// GET /api/badges - Get all system badges
router.get('/badges', async (req, res) => {
  try {
    const badges = await Badge.find({});
    return res.status(200).json({ success: true, data: badges });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/badges/:childId - Get child's earned badges
router.get('/badges/:childId', async (req, res) => {
  try {
    const child = await ChildProfile.findById(req.params.childId);
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    const badges = await Badge.find({ _id: { $in: child.unlockedBadges } });
    return res.status(200).json({ success: true, data: badges });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/shop/purchase - Buy avatar items with coins
const purchaseSchema = z.object({
  childId: z.string(),
  itemId: z.string()
});

router.post('/shop/purchase', async (req, res) => {
  try {
    const { childId, itemId } = purchaseSchema.parse(req.body);

    const child = await ChildProfile.findById(childId);
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child profile not found' });
    }

    const item = AVATAR_SHOP_ITEMS[itemId];
    if (!item) {
      return res.status(400).json({ success: false, error: 'Item does not exist in avatar shop' });
    }

    if (child.unlockedAvatarItems.includes(itemId)) {
      return res.status(400).json({ success: false, error: 'You have already unlocked this item!' });
    }

    if (child.coins < item.cost) {
      return res.status(400).json({ success: false, error: `Not enough coins! You need ${item.cost} coins but only have ${child.coins}.` });
    }

    // Deduct coins and unlock item
    child.coins -= item.cost;
    child.unlockedAvatarItems.push(itemId);
    await child.save();

    return res.status(200).json({
      success: true,
      data: {
        coinsRemaining: child.coins,
        unlockedAvatarItems: child.unlockedAvatarItems
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
export { router as gamificationRouter };
