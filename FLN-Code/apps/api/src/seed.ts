import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';
import { ChildProfile } from './models/ChildProfile';
import { Lesson } from './models/Lesson';
import { Badge } from './models/Badge';
import { Session } from './models/Session';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fln';

const BADGES_DATA = [
  {
    _id: 'first-steps',
    name: 'First Steps 🐾',
    description: 'Complete your first math lesson adventure!',
    iconUrl: 'first-steps',
    condition: { type: 'sessions', threshold: 1 }
  },
  {
    _id: 'hot-streak',
    name: 'Hot Streak 🔥',
    description: 'Play for 7 days in a row!',
    iconUrl: 'hot-streak',
    condition: { type: 'streak', threshold: 7 }
  },
  {
    _id: 'star-collector',
    name: 'Star Collector 🌟',
    description: 'Earn 50 stars in total!',
    iconUrl: 'star-collector',
    condition: { type: 'coins', threshold: 500 } // fallback threshold representation
  },
  {
    _id: 'speed-demon',
    name: 'Speed Demon ⚡',
    description: 'Answer 5 questions in a row in under 3 seconds each!',
    iconUrl: 'speed-demon',
    condition: { type: 'speed', threshold: 5 }
  },
  {
    _id: 'math-wizard',
    name: 'Math Wizard 🧙‍♂️',
    description: 'Get a perfect 100% score on any lesson!',
    iconUrl: 'math-wizard',
    condition: { type: 'sessions', threshold: 3 } // custom checked in service
  },
  {
    _id: 'counting-champion',
    name: 'Counting Champion 👑',
    description: 'Master the Counting to 10 skill tree!',
    iconUrl: 'counting-champion',
    condition: { type: 'mastery', threshold: 80, skillId: 'counting-to-10' }
  },
  {
    _id: 'coin-millionaire',
    name: 'Coin Millionaire 💰',
    description: 'Accumulate 1,000 total coins in your chest!',
    iconUrl: 'coin-millionaire',
    condition: { type: 'coins', threshold: 1000 }
  },
  {
    _id: 'daily-devotee',
    name: 'Daily Devotee 📅',
    description: 'Achieve a 30-day streak of daily practice!',
    iconUrl: 'daily-devotee',
    condition: { type: 'streak', threshold: 30 }
  },
  {
    _id: 'perfect-week',
    name: 'Perfect Week 🏆',
    description: 'Get 3 stars on 7 lessons in one week!',
    iconUrl: 'perfect-week',
    condition: { type: 'sessions', threshold: 7 } // custom checked in service
  },
  {
    _id: 'explorer',
    name: 'Explorer 🗺️',
    description: 'Play a lesson on all 6 islands of the map!',
    iconUrl: 'explorer',
    condition: { type: 'sessions', threshold: 6 } // custom checked in service
  }
];

const LESSONS_DATA: any[] = [
  {
    title: 'Level 1: Quantity Comparison 🍎',
    skillId: 'level-1',
    ageGroups: ['3-4', '5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Comparison Cove',
    activityType: 'tap-answer',
    estimatedMinutes: 3,
    prerequisiteSkills: [],
    questions: [
      {
        id: 'l1-q1',
        prompt: 'Which tree has MORE red apples?',
        visual: {
          type: 'objects',
          config: { count: 5, shape: 'apple', color: 'red' }
        },
        answers: [
          { id: 'a1', text: 'Tree A (5 apples)' },
          { id: 'a2', text: 'Tree B (2 apples)' }
        ],
        correctAnswerId: 'a1',
        hintText: 'Look for the tree with more red color!',
        explanation: 'Excellent! 5 is more than 2.'
      },
      {
        id: 'l1-q2',
        prompt: 'Which bowl has FEWER shiny stars?',
        visual: {
          type: 'objects',
          config: { count: 2, shape: 'star', color: 'yellow' }
        },
        answers: [
          { id: 'a1', text: 'Bowl A (4 stars)' },
          { id: 'a2', text: 'Bowl B (2 stars)' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Which bowl looks less full?',
        explanation: 'Super! 2 is less than 4.'
      }
    ]
  },
  {
    title: 'Level 2: Odd One Out 🐶',
    skillId: 'level-2',
    ageGroups: ['3-4', '5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Classification Shore',
    activityType: 'tap-answer',
    estimatedMinutes: 3,
    prerequisiteSkills: ['level-1'],
    questions: [
      {
        id: 'l2-q1',
        prompt: 'Which of these is the ODD one out?',
        answers: [
          { id: 'a1', text: 'Apple 🍎' },
          { id: 'a2', text: 'Banana 🍌' },
          { id: 'a3', text: 'Dog 🐶' },
          { id: 'a4', text: 'Orange 🍊' }
        ],
        correctAnswerId: 'a3',
        hintText: 'Look for the one that is an animal, not a fruit!',
        explanation: 'Awesome! A dog is an animal, but the others are all fruits.'
      }
    ]
  },
  {
    title: 'Level 3: Matching opposite & shape 📐',
    skillId: 'level-3',
    ageGroups: ['3-4', '5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Matching Mountain',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-2'],
    questions: [
      {
        id: 'l3-q1',
        prompt: 'Match the opposite: TALL goes with...?',
        answers: [
          { id: 'a1', text: 'Short' },
          { id: 'a2', text: 'Big' },
          { id: 'a3', text: 'Heavy' }
        ],
        correctAnswerId: 'a1',
        hintText: 'A giraffe is tall, a mouse is...',
        explanation: 'Well done! The opposite of tall is short.'
      },
      {
        id: 'l3-q2',
        prompt: 'Match the relation: DOG goes with...?',
        answers: [
          { id: 'a1', text: 'Nest' },
          { id: 'a2', text: 'Puppy' },
          { id: 'a3', text: 'Water' }
        ],
        correctAnswerId: 'a2',
        hintText: 'What is a baby dog called?',
        explanation: 'Correct! A puppy is a baby dog.'
      }
    ]
  },
  {
    title: 'Level 4: Numbers 1-10 🔢',
    skillId: 'level-4',
    ageGroups: ['3-4', '5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Number Peak',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-3'],
    questions: [
      {
        id: 'l4-q1',
        prompt: 'What is the number name for 7?',
        answers: [
          { id: 'a1', text: 'Six' },
          { id: 'a2', text: 'Seven' },
          { id: 'a3', text: 'Eight' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Say the numbers: five, six, seven...',
        explanation: 'Perfect! The number name for 7 is Seven.'
      }
    ]
  },
  {
    title: 'Level 5: Finger Counting 🖐️',
    skillId: 'level-5',
    ageGroups: ['3-4', '5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Number Peak',
    activityType: 'tap-answer',
    estimatedMinutes: 3,
    prerequisiteSkills: ['level-4'],
    questions: [
      {
        id: 'l5-q1',
        prompt: 'Count the fingers! A hand showing all fingers has how many fingers?',
        answers: [
          { id: 'a1', text: '4' },
          { id: 'a2', text: '5' },
          { id: 'a3', text: '6' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Count the fingers on one of your hands.',
        explanation: 'Excellent! One hand has 5 fingers.'
      }
    ]
  },
  {
    title: 'Level 6: After, Between, Before ⬅️➡️',
    skillId: 'level-6',
    ageGroups: ['3-4', '5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Ordering Oasis',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-5'],
    questions: [
      {
        id: 'l6-q1',
        prompt: 'What number comes after 5?',
        answers: [
          { id: 'a1', text: '4' },
          { id: 'a2', text: '6' },
          { id: 'a3', text: '7' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Count up: 4, 5, ...?',
        explanation: 'Correct! 6 comes after 5.'
      },
      {
        id: 'l6-q2',
        prompt: 'What number comes between 7 and 9?',
        answers: [
          { id: 'a1', text: '6' },
          { id: 'a2', text: '8' },
          { id: 'a3', text: '10' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Count: 7, __, 9.',
        explanation: 'Nice! 8 is between 7 and 9.'
      }
    ]
  },
  {
    title: 'Level 7: Addition with Objects 🍎',
    skillId: 'level-7',
    ageGroups: ['3-4', '5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Addition Archipelago',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-6'],
    questions: [
      {
        id: 'l7-q1',
        prompt: '🍎🍎🍎 + 🍎🍎 = how many apples in total?',
        visual: {
          type: 'objects',
          config: { count: 5, shape: 'apple', color: 'red' }
        },
        answers: [
          { id: 'a1', text: '4' },
          { id: 'a2', text: '5' },
          { id: 'a3', text: '6' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Count all the apples together: 1, 2, 3, 4, 5!',
        explanation: 'Perfect! 3 + 2 = 5.'
      }
    ]
  },
  {
    title: 'Level 8: Subtraction 1-10 🎈',
    skillId: 'level-8',
    ageGroups: ['5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Subtraction Shore',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-7'],
    questions: [
      {
        id: 'l8-q1',
        prompt: '🎈🎈🎈🎈🎈 − 🎈🎈 = how many balloons are left?',
        answers: [
          { id: 'a1', text: '2' },
          { id: 'a2', text: '3' },
          { id: 'a3', text: '4' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Start with 5 balloons and take away 2.',
        explanation: 'Awesome! 5 take away 2 leaves 3.'
      }
    ]
  },
  {
    title: 'Level 9: Pattern Recognition 🔴🔵',
    skillId: 'level-9',
    ageGroups: ['5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Pattern Peak',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-8'],
    questions: [
      {
        id: 'l9-q1',
        prompt: 'Complete the pattern: Red, Blue, Red, Blue, __?',
        answers: [
          { id: 'a1', text: 'Red' },
          { id: 'a2', text: 'Blue' }
        ],
        correctAnswerId: 'a1',
        hintText: 'What color comes after Blue in the pattern?',
        explanation: 'Super! The pattern repeats Red and Blue, so Red comes next.'
      }
    ]
  },
  {
    title: 'Level 10: Comparison - Numeral ⚖️',
    skillId: 'level-10',
    ageGroups: ['5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Comparison Cove',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-9'],
    questions: [
      {
        id: 'l10-q1',
        prompt: 'Which statement is correct?',
        answers: [
          { id: 'a1', text: '9 is greater than 6' },
          { id: 'a2', text: '6 is greater than 9' },
          { id: 'a3', text: 'They are equal' }
        ],
        correctAnswerId: 'a1',
        hintText: 'Which number represents a larger count, 9 or 6?',
        explanation: 'Nice! 9 is larger than 6.'
      }
    ]
  },
  {
    title: 'Level 11: Review Assessment 1 📝',
    skillId: 'level-11',
    ageGroups: ['5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Assessment Arena',
    activityType: 'tap-answer',
    estimatedMinutes: 5,
    prerequisiteSkills: ['level-10'],
    questions: [
      {
        id: 'l11-q1',
        prompt: 'What is 4 + 4?',
        answers: [
          { id: 'a1', text: '7' },
          { id: 'a2', text: '8' },
          { id: 'a3', text: '9' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Count up 4 from 4.',
        explanation: 'Correct! 4 + 4 = 8.'
      }
    ]
  },
  {
    title: 'Level 12: Tens and Ones 📦',
    skillId: 'level-12',
    ageGroups: ['5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Place Value Plains',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-11'],
    questions: [
      {
        id: 'l12-q1',
        prompt: 'The number 18 is made of:',
        answers: [
          { id: 'a1', text: '1 Ten and 8 Ones' },
          { id: 'a2', text: '8 Tens and 1 One' }
        ],
        correctAnswerId: 'a1',
        hintText: 'The left digit is in tens position, the right digit is in ones.',
        explanation: 'Perfect! 18 represents 10 + 8, which is 1 Ten and 8 Ones.'
      }
    ]
  },
  {
    title: 'Level 13: Numbers 11-30 🚀',
    skillId: 'level-13',
    ageGroups: ['5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Number Peak',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-12'],
    questions: [
      {
        id: 'l13-q1',
        prompt: 'What number comes after 28?',
        answers: [
          { id: 'a1', text: '27' },
          { id: 'a2', text: '29' },
          { id: 'a3', text: '30' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Count up: 27, 28, ...?',
        explanation: 'Great! 29 comes after 28.'
      }
    ]
  },
  {
    title: 'Level 14: Counting & Trace 🎨',
    skillId: 'level-14',
    ageGroups: ['5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Number Peak',
    activityType: 'canvas-draw',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-13'],
    questions: [
      {
        id: 'l14-q1',
        prompt: 'Draw the number 15 in the box.',
        answers: [
          { id: 'a1', text: '15' }
        ],
        correctAnswerId: 'a1',
        hintText: 'Write a 1 and then write a 5 next to it.',
        explanation: 'Super drawing! You successfully represented 15.'
      }
    ]
  },
  {
    title: 'Level 15: Mixed practice 🌀',
    skillId: 'level-15',
    ageGroups: ['5-6', '7-8'],
    difficultyLevel: 1,
    worldIsland: 'Assessment Arena',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-14'],
    questions: [
      {
        id: 'l15-q1',
        prompt: 'What is 20 + 7?',
        answers: [
          { id: 'a1', text: '27' },
          { id: 'a2', text: '72' },
          { id: 'a3', text: '20' }
        ],
        correctAnswerId: 'a1',
        hintText: 'Add 7 to 20.',
        explanation: 'Exactly! 20 + 7 is 27.'
      }
    ]
  },
  {
    title: 'Level 16: Addition 1-30 ➕',
    skillId: 'level-16',
    ageGroups: ['7-8'],
    difficultyLevel: 1,
    worldIsland: 'Addition Archipelago',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-15'],
    questions: [
      {
        id: 'l16-q1',
        prompt: 'What is 15 + 6?',
        answers: [
          { id: 'a1', text: '20' },
          { id: 'a2', text: '21' },
          { id: 'a3', text: '22' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Count up 6 from 15.',
        explanation: 'Awesome! 15 + 6 = 21.'
      }
    ]
  },
  {
    title: 'Level 17: Subtraction 1-30 ➖',
    skillId: 'level-17',
    ageGroups: ['7-8'],
    difficultyLevel: 1,
    worldIsland: 'Subtraction Shore',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-16'],
    questions: [
      {
        id: 'l17-q1',
        prompt: 'What is 25 - 8?',
        answers: [
          { id: 'a1', text: '17' },
          { id: 'a2', text: '15' },
          { id: 'a3', text: '18' }
        ],
        correctAnswerId: 'a1',
        hintText: 'Subtract 8 from 25.',
        explanation: 'Well done! 25 - 8 = 17.'
      }
    ]
  },
  {
    title: 'Level 18: Ordering 1-30 📈',
    skillId: 'level-18',
    ageGroups: ['7-8'],
    difficultyLevel: 1,
    worldIsland: 'Ordering Oasis',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-17'],
    questions: [
      {
        id: 'l18-q1',
        prompt: 'Arrange in ascending order (smallest to largest): 25, 12, 19',
        answers: [
          { id: 'a1', text: '12, 19, 25' },
          { id: 'a2', text: '25, 19, 12' }
        ],
        correctAnswerId: 'a1',
        hintText: 'Which number is the smallest? Start with that.',
        explanation: 'Perfect! 12 is smallest, then 19, then 25.'
      }
    ]
  },
  {
    title: 'Level 19: Numbering 31-50 🏷️',
    skillId: 'level-19',
    ageGroups: ['7-8'],
    difficultyLevel: 1,
    worldIsland: 'Number Peak',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-18'],
    questions: [
      {
        id: 'l19-q1',
        prompt: 'What is Forty-eight in numerals?',
        answers: [
          { id: 'a1', text: '38' },
          { id: 'a2', text: '48' },
          { id: 'a3', text: '84' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Forty means 4 tens, eight means 8 ones.',
        explanation: 'Super! Forty-eight is written as 48.'
      }
    ]
  },
  {
    title: 'Level 20: Skip Counting 🦓',
    skillId: 'level-20',
    ageGroups: ['7-8'],
    difficultyLevel: 1,
    worldIsland: 'Ordering Oasis',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-19'],
    questions: [
      {
        id: 'l20-q1',
        prompt: 'Skip count by 2s: 10, 12, 14, __?',
        answers: [
          { id: 'a1', text: '15' },
          { id: 'a2', text: '16' },
          { id: 'a3', text: '18' }
        ],
        correctAnswerId: 'a2',
        hintText: 'Add 2 to the number 14.',
        explanation: 'Exactly! Counting in 2s goes 10, 12, 14, 16.'
      }
    ]
  },
  {
    title: 'Level 21: Comparison 1-50 ⚖️',
    skillId: 'level-21',
    ageGroups: ['7-8'],
    difficultyLevel: 1,
    worldIsland: 'Comparison Cove',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-20'],
    questions: [
      {
        id: 'l21-q1',
        prompt: 'Compare: 42 is ___ than 38.',
        answers: [
          { id: 'a1', text: 'Greater' },
          { id: 'a2', text: 'Less' },
          { id: 'a3', text: 'Equal' }
        ],
        correctAnswerId: 'a1',
        hintText: '42 is a larger count than 38.',
        explanation: 'Awesome! 42 is greater than 38.'
      }
    ]
  },
  {
    title: 'Level 22: Ordering 1-50 📉',
    skillId: 'level-22',
    ageGroups: ['7-8'],
    difficultyLevel: 1,
    worldIsland: 'Ordering Oasis',
    activityType: 'tap-answer',
    estimatedMinutes: 4,
    prerequisiteSkills: ['level-21'],
    questions: [
      {
        id: 'l22-q1',
        prompt: 'Arrange in descending order (largest to smallest): 34, 48, 15',
        answers: [
          { id: 'a1', text: '48, 34, 15' },
          { id: 'a2', text: '15, 34, 48' }
        ],
        correctAnswerId: 'a1',
        hintText: 'Which number is the largest? Start with that.',
        explanation: 'Perfect! 48 is the largest, then 34, then 15.'
      }
    ]
  },
  {
    title: 'Level 23: Review Assessment 2 🎓',
    skillId: 'level-23',
    ageGroups: ['7-8'],
    difficultyLevel: 1,
    worldIsland: 'Assessment Arena',
    activityType: 'tap-answer',
    estimatedMinutes: 5,
    prerequisiteSkills: ['level-22'],
    questions: [
      {
        id: 'l23-q1',
        prompt: 'What is 40 - 15?',
        answers: [
          { id: 'a1', text: '25' },
          { id: 'a2', text: '35' },
          { id: 'a3', text: '30' }
        ],
        correctAnswerId: 'a1',
        hintText: 'Subtract 10 first, then 5.',
        explanation: 'Correct! 40 - 15 = 25.'
      }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database for seeding.');

    // Clear existing
    await User.deleteMany({});
    await ChildProfile.deleteMany({});
    await Lesson.deleteMany({});
    await Badge.deleteMany({});
    await Session.deleteMany({});

    console.log('Cleared existing data.');

    // 1. Seed Badges
    await Badge.insertMany(BADGES_DATA);
    console.log('Seeded Badges.');

    // 2. Seed Lessons
    await Lesson.insertMany(LESSONS_DATA);
    console.log('Seeded Lessons.');

    // 3. Seed Demo Parent Account
    const passwordHash = await bcrypt.hash('password123', 10);
    const demoParent = new User({
      email: 'parent@fln.com',
      passwordHash,
      role: 'parent',
      plan: 'free',
      children: [],
      isVerified: true
    });
    await demoParent.save();

    // 4. Seed Demo Child Account
    const demoChild = new ChildProfile({
      parentId: demoParent._id,
      name: 'Chiku',
      ageGroup: '5-6',
      avatarUrl: '',
      avatarConfig: {
        skin: 'peach',
        hair: 'curly-brown',
        eyes: 'happy',
        accessory: 'none',
        mouth: 'smile',
        background: 'soft-yellow'
      },
      coins: 450,
      totalStars: 24,
      streakDays: 4,
      lastActiveDate: new Date(),
      skillTree: {
        'level-1': { mastery: 95, attemptsTotal: 15, attemptsCorrect: 14, lastPracticed: new Date() },
        'level-2': { mastery: 82, attemptsTotal: 10, attemptsCorrect: 8, lastPracticed: new Date() },
        'level-3': { mastery: 40, attemptsTotal: 5, attemptsCorrect: 3, lastPracticed: new Date() }
      },
      unlockedBadges: ['first-steps'],
      unlockedAvatarItems: ['skin-peach', 'hair-curly-brown', 'eyes-happy', 'accessory-none', 'mouth-smile', 'background-soft-yellow'],
      settings: {
        soundEnabled: true,
        voiceInputEnabled: false,
        dailyTimeLimitMinutes: 30
      }
    });
    await demoChild.save();

    demoParent.children.push(demoChild._id as any);
    await demoParent.save();

    console.log('Seeded Demo parent and child profile.');
    console.log('Demo login details:');
    console.log('Email: parent@fln.com');
    console.log('Password: password123');
    console.log('Child Name: Chiku');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
