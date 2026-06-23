import { Schema, model } from 'mongoose';
import { IBadge } from 'shared';

const badgeSchema = new Schema<IBadge>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  iconUrl: { type: String, required: true },
  condition: {
    type: { type: String, enum: ['streak', 'sessions', 'mastery', 'coins', 'speed'], required: true },
    threshold: { type: Number, required: true },
    skillId: { type: String }
  }
});

export const Badge = model<IBadge>('Badge', badgeSchema);
export { badgeSchema };
