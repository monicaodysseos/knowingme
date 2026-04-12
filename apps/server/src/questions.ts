import { v4 as uuidv4 } from 'uuid';
import type { Question } from '@ksero-se/types';

// ── 40 seeded questions across two tiers ──────────────────────────────────

const TIER1_QUESTIONS: string[] = [
  // Light / universal — safe for corporate and social settings
  'What is your favourite season of the year?',
  'Which is your go-to comfort food when you are stressed?',
  'What hobby do you wish you had more time for?',
  'What would your perfect Saturday morning look like?',
  'Which decade of music do you enjoy most?',
  'What is one skill you have always wanted to learn?',
  'What is your favourite way to unwind after a long day?',
  'If you could live anywhere in the world, where would it be?',
  'What is your most treasured possession?',
  'Which board game or card game are you most competitive about?',
  'What is the best piece of advice you have ever received?',
  'Which movie could you watch over and over without getting bored?',
  'What is your favourite time of day and why?',
  'If you could instantly master one instrument, what would it be?',
  'What is your favourite holiday tradition?',
  'What is the most underrated book you have ever read?',
  'What is one thing you would change about your commute?',
  'What is a small daily ritual that makes you happy?',
  'If you could have dinner with any historical figure, who would it be?',
  'What is your favourite type of weather?',
];

const TIER2_QUESTIONS: string[] = [
  // Personal / social — better for party settings
  'What is your biggest irrational fear?',
  'Who is the most important person in your life right now?',
  'What would your last meal be if you had to choose?',
  'What is the most embarrassing song you secretly love?',
  'What is a deal-breaker for you in a friendship?',
  'What is something you believe that most people around you do not?',
  'Which fictional character do you relate to most?',
  'What is the strangest dream you have ever had?',
  'What is your most unpopular food opinion?',
  'What is the one compliment you always remember?',
  'What habit are you most proud of building?',
  'If you could relive one day of your life, which would it be?',
  'What would your supervillain origin story be?',
  'Which celebrity would you most want as a neighbour?',
  'What is one thing you are genuinely bad at but enjoy anyway?',
  'What is the worst advice you have ever followed?',
  'What song best describes your life right now?',
  'What is one opinion you hold that you rarely share publicly?',
  'Who would play you in the movie of your life?',
  'What is your go-to karaoke song?',
];

export function buildSeededPool(): Question[] {
  return [
    ...TIER1_QUESTIONS.map((text) => ({
      id: uuidv4(),
      text,
      tier: 'T1' as const,
    })),
    ...TIER2_QUESTIONS.map((text) => ({
      id: uuidv4(),
      text,
      tier: 'T2' as const,
    })),
  ];
}
