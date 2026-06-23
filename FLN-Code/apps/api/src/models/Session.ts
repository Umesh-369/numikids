import { Schema, model } from 'mongoose';
import { ISession } from 'shared';

const answerLogItemSchema = new Schema({
  questionId: { type: String, required: true },
  answerId: { type: String, required: true },
  correct: { type: Boolean, required: true },
  timeToAnswerMs: { type: Number, required: true },
  hintsUsed: { type: Number, default: 0 }
}, { _id: false });

const sessionSchema = new Schema<any>({
  childId: { type: Schema.Types.ObjectId, ref: 'ChildProfile', required: true, index: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  questionsAttempted: { type: Number, default: 0 },
  questionsCorrect: { type: Number, default: 0 },
  starsEarned: { type: Number, default: 0 },
  coinsEarned: { type: Number, default: 0 },
  answerLog: [answerLogItemSchema]
});

export const Session = model<ISession>('Session', sessionSchema);
