import dotenv from 'dotenv';
import { IQuestion } from 'shared';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const LEVEL_CONCEPTS: Record<string, string> = {
  'level-1': 'Comparing Quantities visually (Equal, More, Less) without counting. Show pictures of objects.',
  'level-2': 'Odd One Out / Classification and Differentiation based on common attributes (shape, size, color, quantity).',
  'level-3': 'Matching opposite, shape, relation or quantity (e.g. Match Tall to Short, or Ball to Circle).',
  'level-4': 'Numbers 1-10: Recognize, write, and match number names.',
  'level-5': 'Finger Gesture Counting: Identify and count numbers 1-10 shown via hand/finger gestures.',
  'level-6': 'After, Between, Before: Number sequence and position (e.g., what comes after 5, or between 4 and 6).',
  'level-7': 'Addition through objects: Combining two groups of objects (count objects and add within 10).',
  'level-8': 'Subtraction (1-10): Taking away objects from a group (visual subtraction within 10).',
  'level-9': 'Pattern Recognition: Identify, complete, and extend visual or number patterns.',
  'level-10': 'Comparison - Numeral: Compare numbers 1-10 using greater than, less than, or equal symbols.',
  'level-11': 'Review Assessment 1: Mix of questions covering numbers, addition/subtraction, and patterns 1-10.',
  'level-12': 'Tens and Ones: Understanding place value, tens, and ones in numbers 11-20.',
  'level-13': 'Numbers 11-30: Counting, reading, and writing numbers 11-30.',
  'level-14': 'Counting + Fun Trace: Identify, count, and trace numbers 11-30.',
  'level-15': 'Mixed Practice: Assessment and exercises on counting, addition, subtraction, place value for 1-30.',
  'level-16': 'Addition (1-30): Sub-carrying or simple addition within 30.',
  'level-17': 'Subtraction (1-30): Sub-borrowing or simple subtraction within 30.',
  'level-18': 'Ordering (1-30): Ascending and descending order of numbers up to 30.',
  'level-19': 'Numbering 31-50: Identify, count, and write numbers 31-50.',
  'level-20': 'Skip Counting: Count in 2s, 3s, 5s up to 50.',
  'level-21': 'Comparison (1-50): Compare numbers 1-50 using greater than, less than, or equal.',
  'level-22': 'Ordering (1-50): Ascending and descending order of numbers up to 50.',
  'level-23': 'Review Assessment 2: Comprehensive review of place value, ordering, comparison, addition, subtraction up to 50.',
};

export class GeminiService {
  /**
   * Generates an adaptive math question based on the child's age group, target skill,
   * and previous error types (e.g., counting error, place value error).
   */
  static async generateAdaptiveQuestion(
    ageGroup: '3-4' | '5-6' | '7-8',
    skillId: string,
    errorType?: string
  ): Promise<IQuestion> {
    const conceptText = LEVEL_CONCEPTS[skillId] || skillId;
    const promptText = `
You are an expert child psychologist and foundational mathematics teacher. Generate a single numeracy question for a child.
Child Profile:
- Age Group: ${ageGroup}
- Target Skill Concept: ${conceptText} (${skillId})
${errorType ? `- Context: The child has been making "${errorType}" errors. Please customize the question to guide them through this specific misconception.` : ''}

Requirements:
1. Language level must be simple, child-friendly, Grade 2 reading level maximum. Use warm, encouraging words.
2. Question must fit the IQuestion TypeScript interface:
   interface IQuestion {
     id: string; // unique short ID e.g., "q-gemini-1"
     prompt: string; // Question text
     visual?: {
       type: 'image' | 'objects' | 'number-line';
       config: {
         count?: number;
         shape?: 'apple' | 'star' | 'balloon' | 'pizza' | 'marble';
         color?: 'red' | 'blue' | 'yellow' | 'green';
         points?: number[];
       };
     };
     answers: { id: string; text: string }[]; // 2 to 4 choices. Large buttons.
     correctAnswerId: string; // must match one of the answers IDs
     hintText: string; // friendly hint that doesn't reveal the answer directly
     explanation: string; // simple explanation for correct/wrong answers
   }
3. Choose the visual type wisely:
   - For counting, use 'objects' with the correct count.
   - For addition/subtraction, you can use 'objects' or 'number-line'.
4. Respond ONLY with the raw JSON object, no markdown blocks, no prefix/suffix. Just JSON.
`;

    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not defined. Falling back to local question generator.');
      return this.getLocalFallbackQuestion(skillId, ageGroup);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      const question: IQuestion = JSON.parse(text);
      return question;
    } catch (error) {
      console.error('Failed to generate adaptive question with Gemini:', error);
      return this.getLocalFallbackQuestion(skillId, ageGroup);
    }
  }

  /**
   * Local rule-based question generator to use when Gemini API is unavailable or keys are missing.
   */
  private static getLocalFallbackQuestion(skillId: string, ageGroup: string): IQuestion {
    const randomId = Math.floor(Math.random() * 1000);
    
    // Level-specific fallback questions
    switch (skillId) {
      case 'level-1':
        return {
          id: `q-fb-l1-${randomId}`,
          prompt: 'Count the red apples! How many apples do you see?',
          visual: { type: 'objects', config: { count: 3, shape: 'apple', color: 'red' } },
          answers: [{ id: 'a1', text: '2' }, { id: 'a2', text: '3' }, { id: 'a3', text: '4' }],
          correctAnswerId: 'a2',
          hintText: 'Count them: one, two, three!',
          explanation: 'Good job! There are exactly 3 apples.'
        };
      case 'level-2':
        return {
          id: `q-fb-l2-${randomId}`,
          prompt: 'Which of these is NOT a fruit? (Odd One Out)',
          answers: [{ id: 'a1', text: 'Apple 🍎' }, { id: 'a2', text: 'Banana 🍌' }, { id: 'a3', text: 'Dog 🐶' }, { id: 'a4', text: 'Orange 🍊' }],
          correctAnswerId: 'a3',
          hintText: 'Look for the animal among fruits.',
          explanation: 'Super! Dog is an animal, while others are fruits.'
        };
      case 'level-3':
        return {
          id: `q-fb-l3-${randomId}`,
          prompt: 'What is the opposite of TALL?',
          answers: [{ id: 'a1', text: 'Short' }, { id: 'a2', text: 'Big' }, { id: 'a3', text: 'Happy' }],
          correctAnswerId: 'a1',
          hintText: 'A giraffe is tall, a mouse is...',
          explanation: 'Well done! The opposite of tall is short.'
        };
      case 'level-4':
        return {
          id: `q-fb-l4-${randomId}`,
          prompt: 'What is the number name of 5?',
          answers: [{ id: 'a1', text: 'Four' }, { id: 'a2', text: 'Five' }, { id: 'a3', text: 'Six' }],
          correctAnswerId: 'a2',
          hintText: 'It starts with the letter F.',
          explanation: 'Fantastic! 5 is written as Five.'
        };
      case 'level-5':
        return {
          id: `q-fb-l5-${randomId}`,
          prompt: 'If a hand shows 3 fingers, what number is it?',
          answers: [{ id: 'a1', text: '2' }, { id: 'a2', text: '3' }, { id: 'a3', text: '4' }],
          correctAnswerId: 'a2',
          hintText: 'Count the fingers on your hand to check.',
          explanation: 'Correct! 3 fingers represents the number 3.'
        };
      case 'level-6':
        return {
          id: `q-fb-l6-${randomId}`,
          prompt: 'What number comes between 4 and 6?',
          answers: [{ id: 'a1', text: '3' }, { id: 'a2', text: '5' }, { id: 'a3', text: '7' }],
          correctAnswerId: 'a2',
          hintText: 'Count: 4, __, 6.',
          explanation: 'Great! 5 comes between 4 and 6.'
        };
      case 'level-7':
        return {
          id: `q-fb-l7-${randomId}`,
          prompt: 'What is 3 + 2?',
          visual: { type: 'objects', config: { count: 5, shape: 'star', color: 'yellow' } },
          answers: [{ id: 'a1', text: '4' }, { id: 'a2', text: '5' }, { id: 'a3', text: '6' }],
          correctAnswerId: 'a2',
          hintText: 'Combine 3 yellow stars and 2 yellow stars.',
          explanation: 'Perfect! 3 plus 2 equals 5.'
        };
      case 'level-8':
        return {
          id: `q-fb-l8-${randomId}`,
          prompt: 'What is 6 - 2?',
          answers: [{ id: 'a1', text: '3' }, { id: 'a2', text: '4' }, { id: 'a3', text: '5' }],
          correctAnswerId: 'a2',
          hintText: 'Take 2 away from 6.',
          explanation: 'Correct! 6 minus 2 is 4.'
        };
      case 'level-9':
        return {
          id: `q-fb-l9-${randomId}`,
          prompt: 'Complete the pattern: Red, Blue, Red, Blue, __?',
          answers: [{ id: 'a1', text: 'Red' }, { id: 'a2', text: 'Blue' }, { id: 'a3', text: 'Green' }],
          correctAnswerId: 'a1',
          hintText: 'Look at the colors repeating: Red, Blue, Red, Blue...',
          explanation: 'Super! The pattern alternates Red and Blue, so Red is next.'
        };
      case 'level-10':
        return {
          id: `q-fb-l10-${randomId}`,
          prompt: 'Which number is greater: 8 or 5?',
          answers: [{ id: 'a1', text: '8' }, { id: 'a2', text: '5' }, { id: 'a3', text: 'They are equal' }],
          correctAnswerId: 'a1',
          hintText: 'Which number represents a larger count?',
          explanation: 'Nice! 8 is greater than 5.'
        };
      case 'level-11':
        return {
          id: `q-fb-l11-${randomId}`,
          prompt: 'What is 5 + 4?',
          answers: [{ id: 'a1', text: '8' }, { id: 'a2', text: '9' }, { id: 'a3', text: '10' }],
          correctAnswerId: 'a2',
          hintText: 'Add 4 to 5.',
          explanation: 'Correct! 5 + 4 = 9.'
        };
      case 'level-12':
        return {
          id: `q-fb-l12-${randomId}`,
          prompt: 'In the number 14, how many tens and ones are there?',
          answers: [
            { id: 'a1', text: '1 Ten and 4 Ones' },
            { id: 'a2', text: '4 Tens and 1 One' },
            { id: 'a3', text: '14 Tens and 0 Ones' }
          ],
          correctAnswerId: 'a1',
          hintText: 'The first digit is in the tens place, and the second is in the ones place.',
          explanation: 'Wonderful! 14 is made of 1 Ten (10) and 4 Ones (4).'
        };
      case 'level-13':
        return {
          id: `q-fb-l13-${randomId}`,
          prompt: 'Can you count the blue balloons? What number comes after 24?',
          answers: [{ id: 'a1', text: '23' }, { id: 'a2', text: '25' }, { id: 'a3', text: '26' }],
          correctAnswerId: 'a2',
          hintText: 'Count up by 1 starting from 24.',
          explanation: 'Yes! 25 comes right after 24.'
        };
      case 'level-14':
        return {
          id: `q-fb-l14-${randomId}`,
          prompt: 'What is two tens and six ones?',
          answers: [{ id: 'a1', text: '26' }, { id: 'a2', text: '62' }, { id: 'a3', text: '20' }],
          correctAnswerId: 'a1',
          hintText: 'Two tens is 20, and six ones is 6. Combine them.',
          explanation: 'Exactly! 20 + 6 is 26.'
        };
      case 'level-15':
        return {
          id: `q-fb-l15-${randomId}`,
          prompt: 'What is 10 + 7?',
          answers: [{ id: 'a1', text: '15' }, { id: 'a2', text: '17' }, { id: 'a3', text: '27' }],
          correctAnswerId: 'a2',
          hintText: 'Add 7 to 10.',
          explanation: 'Splendid! 10 + 7 = 17.'
        };
      case 'level-16':
        return {
          id: `q-fb-l16-${randomId}`,
          prompt: 'What is 18 + 5?',
          answers: [{ id: 'a1', text: '22' }, { id: 'a2', text: '23' }, { id: 'a3', text: '24' }],
          correctAnswerId: 'a2',
          hintText: 'Count up 5 steps from 18: 19, 20, 21, 22, 23.',
          explanation: 'Awesome! 18 + 5 is 23.'
        };
      case 'level-17':
        return {
          id: `q-fb-l17-${randomId}`,
          prompt: 'What is 28 - 4?',
          answers: [{ id: 'a1', text: '24' }, { id: 'a2', text: '22' }, { id: 'a3', text: '26' }],
          correctAnswerId: 'a1',
          hintText: 'Subtract 4 from 8, keeping the 20.',
          explanation: 'Great! 28 - 4 = 24.'
        };
      case 'level-18':
        return {
          id: `q-fb-l18-${randomId}`,
          prompt: 'Which list shows the numbers in ascending order (smallest to largest)?',
          answers: [
            { id: 'a1', text: '5, 12, 28' },
            { id: 'a2', text: '28, 12, 5' },
            { id: 'a3', text: '12, 5, 28' }
          ],
          correctAnswerId: 'a1',
          hintText: 'Look for the order that goes from the smallest number to the largest.',
          explanation: 'Perfect! 5, 12, 28 is in ascending order.'
        };
      case 'level-19':
        return {
          id: `q-fb-l19-${randomId}`,
          prompt: 'How do you write the number 42 in words?',
          answers: [{ id: 'a1', text: 'Twenty-four' }, { id: 'a2', text: 'Forty-two' }, { id: 'a3', text: 'Fourteen' }],
          correctAnswerId: 'a2',
          hintText: 'It starts with Forty.',
          explanation: 'Awesome! 42 is written as Forty-two.'
        };
      case 'level-20':
        return {
          id: `q-fb-l20-${randomId}`,
          prompt: 'Fill in: 5, 10, 15, 20, __?',
          answers: [{ id: 'a1', text: '21' }, { id: 'a2', text: '25' }, { id: 'a3', text: '30' }],
          correctAnswerId: 'a2',
          hintText: 'We are skip counting by 5s.',
          explanation: 'Correct! The next number after 20 when skip counting by 5s is 25.'
        };
      case 'level-21':
        return {
          id: `q-fb-l21-${randomId}`,
          prompt: 'Which symbol makes this true: 35 __ 45?',
          answers: [{ id: 'a1', text: '< (Less than)' }, { id: 'a2', text: '> (Greater than)' }, { id: 'a3', text: '= (Equal)' }],
          correctAnswerId: 'a1',
          hintText: '35 is smaller than 45.',
          explanation: 'You did it! 35 is less than 45.'
        };
      case 'level-22':
        return {
          id: `q-fb-l22-${randomId}`,
          prompt: 'Which number is the largest: 49, 39, 44?',
          answers: [{ id: 'a1', text: '39' }, { id: 'a2', text: '44' }, { id: 'a3', text: '49' }],
          correctAnswerId: 'a3',
          hintText: 'Compare the tens and then the ones.',
          explanation: 'Perfect! 49 is the largest number.'
        };
      case 'level-23':
        return {
          id: `q-fb-l23-${randomId}`,
          prompt: 'What is 35 + 15?',
          answers: [{ id: 'a1', text: '40' }, { id: 'a2', text: '50' }, { id: 'a3', text: '45' }],
          correctAnswerId: 'a2',
          hintText: 'Add the ones (5+5=10) and then add the tens (30+10+10).',
          explanation: 'Splendid! 35 + 15 is 50.'
        };
      default:
        return {
          id: `q-fallback-default-${randomId}`,
          prompt: 'What is 1 + 1?',
          answers: [{ id: 'ans-1', text: '1' }, { id: 'ans-2', text: '2' }, { id: 'ans-3', text: '3' }],
          correctAnswerId: 'ans-2',
          hintText: 'Count one finger plus one finger.',
          explanation: 'Correct! 1 + 1 = 2.'
        };
    }
  }
}
export default GeminiService;
