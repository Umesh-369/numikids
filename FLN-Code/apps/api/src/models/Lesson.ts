import { Schema, model } from 'mongoose';
import { ILesson } from 'shared';

const questionSchema = new Schema({
  id: { type: String, required: true },
  prompt: { type: String, required: true },
  promptAudio: { type: String },
  visual: {
    type: { type: String, enum: ['image', 'objects', 'number-line'] },
    config: { type: Schema.Types.Mixed }
  },
  answers: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    visual: { type: String }
  }],
  correctAnswerId: { type: String, required: true },
  hintText: { type: String, required: true },
  hintAudio: { type: String },
  explanation: { type: String, required: true }
}, { _id: false });

const lessonSchema = new Schema<any>({
  title: { type: String, required: true },
  skillId: { type: String, required: true, index: true },
  ageGroups: [{ type: String, enum: ['3-4', '5-6', '7-8'] }],
  difficultyLevel: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
  worldIsland: { type: String, required: true },
  activityType: {
    type: String,
    enum: ['tap-answer', 'drag-count', 'fill-blank', 'story-problem', 'pattern', 'canvas-draw'],
    required: true
  },
  questions: [questionSchema],
  estimatedMinutes: { type: Number, default: 5 },
  prerequisiteSkills: [{ type: String }]
});

export const Lesson = model<ILesson>('Lesson', lessonSchema);
