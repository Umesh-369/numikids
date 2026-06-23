import { Schema, model } from 'mongoose';
import { IChildProfile } from 'shared';

const childProfileSchema = new Schema<any>({
  parentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  ageGroup: { type: String, enum: ['3-4', '5-6', '7-8'], required: true },
  avatarUrl: { type: String, default: '' },
  avatarConfig: {
    skin: { type: String, default: 'peach' },
    hair: { type: String, default: 'curly-brown' },
    eyes: { type: String, default: 'happy' },
    accessory: { type: String, default: 'none' },
    mouth: { type: String, default: 'smile' },
    background: { type: String, default: 'soft-yellow' }
  },
  coins: { type: Number, default: 0 },
  totalStars: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  skillTree: {
    type: Map,
    of: new Schema({
      mastery: { type: Number, default: 0 },
      attemptsTotal: { type: Number, default: 0 },
      attemptsCorrect: { type: Number, default: 0 },
      lastPracticed: { type: Date }
    }, { _id: false }),
    default: {}
  },
  unlockedBadges: [{ type: String }],
  unlockedAvatarItems: [{ type: String }],
  settings: {
    soundEnabled: { type: Boolean, default: true },
    voiceInputEnabled: { type: Boolean, default: false },
    dailyTimeLimitMinutes: { type: Number, default: 30 }
  }
});

export const ChildProfile = model<IChildProfile>('ChildProfile', childProfileSchema);
