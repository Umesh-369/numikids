export interface IUser {
  _id?: string;
  email: string;
  passwordHash?: string;
  role: 'parent' | 'teacher';
  children: string[]; // references ChildProfile _id
  plan: 'free' | 'pro';
  createdAt?: Date;
  isVerified?: boolean;
  verificationToken?: string;
}

export interface IAvatarConfig {
  skin: string;
  hair: string;
  eyes: string;
  accessory: string;
  mouth: string;
  background: string;
}

export interface IChildProfile {
  _id?: string;
  parentId: string;
  name: string;
  ageGroup: '3-4' | '5-6' | '7-8';
  avatarUrl: string;
  avatarConfig: IAvatarConfig;
  coins: number;
  totalStars: number;
  streakDays: number;
  lastActiveDate?: string | Date;
  skillTree: {
    [skillId: string]: {
      mastery: number; // 0-100
      attemptsTotal: number;
      attemptsCorrect: number;
      lastPracticed?: string | Date;
    };
  };
  unlockedBadges: string[];
  unlockedAvatarItems: string[];
  settings: {
    soundEnabled: boolean;
    voiceInputEnabled: boolean;
    dailyTimeLimitMinutes: number;
  };
}

export interface IAnswer {
  id: string;
  text: string;
  visual?: string; // Image name or visual config
}

export interface IQuestion {
  id: string;
  prompt: string;
  promptAudio?: string;
  visual?: {
    type: 'image' | 'objects' | 'number-line';
    config: Record<string, any>;
  };
  answers: IAnswer[];
  correctAnswerId: string;
  hintText: string;
  hintAudio?: string;
  explanation: string;
}

export interface ILesson {
  _id?: string;
  title: string;
  skillId: string; // e.g. 'counting', 'addition-to-10'
  ageGroups: ('3-4' | '5-6' | '7-8')[];
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  worldIsland: string; // theme island e.g. 'counting-cove'
  activityType: 'tap-answer' | 'drag-count' | 'fill-blank' | 'story-problem' | 'pattern' | 'canvas-draw';
  questions: IQuestion[];
  estimatedMinutes: number;
  prerequisiteSkills: string[];
}

export interface IAnswerLogItem {
  questionId: string;
  answerId: string;
  correct: boolean;
  timeToAnswerMs: number;
  hintsUsed: number;
}

export interface ISession {
  _id?: string;
  childId: string;
  lessonId: string;
  startedAt: string | Date;
  completedAt?: string | Date;
  durationSeconds: number;
  questionsAttempted: number;
  questionsCorrect: number;
  starsEarned: number;
  coinsEarned: number;
  answerLog: IAnswerLogItem[];
}

export interface IBadge {
  _id: string;
  name: string;
  description: string;
  iconUrl: string;
  condition: {
    type: 'streak' | 'sessions' | 'mastery' | 'coins' | 'speed';
    threshold: number;
    skillId?: string;
  };
}

export interface IAvatarItem {
  id: string;
  category: 'skin' | 'hair' | 'eyes' | 'accessory' | 'mouth' | 'background';
  name: string;
  svgPath?: string;
  color?: string;
  cost: number;
}

export const AVATAR_SHOP_ITEMS: Record<string, { name: string; cost: number; category: string }> = {
  // Hair options
  'hair-spiky-blue': { name: 'Spiky Blue Hair', cost: 150, category: 'hair' },
  'hair-tiara': { name: 'Princess Tiara', cost: 250, category: 'hair' },
  'hair-astronaut': { name: 'Astronaut Helmet', cost: 400, category: 'hair' },
  'hair-wizard': { name: 'Wizard Hat', cost: 350, category: 'hair' },
  // Accessories
  'accessory-sunglasses': { name: 'Cool Sunglasses', cost: 100, category: 'accessory' },
  'accessory-wand': { name: 'Magic Wand', cost: 200, category: 'accessory' },
  'accessory-cape': { name: 'Hero Cape', cost: 300, category: 'accessory' },
  'accessory-mask': { name: 'Superhero Mask', cost: 250, category: 'accessory' },
  // Backgrounds
  'background-galaxy': { name: 'Galaxy Space', cost: 200, category: 'background' },
  'background-jungle': { name: 'Dino Jungle', cost: 150, category: 'background' },
  'background-rainbow': { name: 'Rainbow Sky', cost: 250, category: 'background' },
  'background-castle': { name: 'Fairytale Castle', cost: 300, category: 'background' },
  // Mouth
  'mouth-bubblegum': { name: 'Bubblegum Mouth', cost: 100, category: 'mouth' }
};

