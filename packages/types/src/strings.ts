// All fakes mode copy. Lowercase, you/your, no dashes, and the word
// lie (or bluff) never appears. Timers are not written out here.

export const copy = {
  howTitle: 'how kserose works',
  howSteps: [
    '1. write questions for your mates',
    '2. answer the ones you get, honestly, about you',
    '3. everyone fakes your answer. find the real you',
  ],
  howPoints: 'points for knowing people and for fooling them',
  gotIt: 'got it',
  eyes: 'eyes on the telly',
  yourName: 'your name',
  pickCharacter: 'pick your character',
  weirder: 'weirder is better',
  askFriend: 'ask something only a friend would know',
  questionPlaceholder: "what's your most irrational fear?",
  next: 'next',
  sendIt: 'send it',
  sentWait: 'sent. now we wait',
  answerTv: 'answer honestly. your mates will try to fake you',
  aboutYou: 'about you',
  realPlaceholder: 'the real answer…',
  lockedIn: 'locked in',
  tooClose: 'too close. write a different one',
  subjectWait: "your mates are faking you. let's see who knows you",
  yours: 'yours',
  literallyMe: "that's literally me",
  fooledNobody: 'fooled nobody',
  nobodyKnows: 'nobody knows you. awkward',
  scoreFooter: 'find the real one: 100 · fool a mate: 50 · be known: 50 each',
  draw: "it's a draw. you lot are scarily close",
  youWin: 'you win. try not to be smug',
  mindReader: 'mind reader',
  openBook: 'open book',
  masterOfDisguise: 'master of disguise',
  whoKnowsWho: 'who knows who',
  finalPass: 'final pass',
  pointsDoubled: 'points are doubled',
  scores: 'scores',
  playAgain: 'play again',
  start: 'start',
  setupQuestions: 'questions you write',
  setupQuestionsHint: 'each player writes this many',
  setupLong: 'long game',
  setupLongHint: 'more turns and longer timers',
  setupShort: 'about 10 minutes',
  needPlayers: 'need 2 players',
  nobody: 'nobody',
} as const;

export function writeTv(n: number): string {
  return `write ${n} questions for someone else to answer about themselves`;
}

export function progressDone(done: number, total: number): string {
  return `${done} of ${total} done`;
}

export function wasAsked(name: string): string {
  return `${name} was asked:`;
}

export function everyoneElse(name: string): string {
  return `everyone else: write what ${name} would say`;
}

export function writeWhat(name: string): string {
  return `write what ${name} would say. make it convincing`;
}

export function soundLike(name: string): string {
  return `sound like ${name}…`;
}

export function literallyFlag(name: string): string {
  return `literally ${name}`;
}

export function whichReal(name: string): string {
  return `which one is the real ${name}?`;
}

export function fakeBy(who: string): string {
  return `fake by ${who}`;
}

export function fooledLine(names: string): string {
  return `fooled: ${names}`;
}

export function saysLiterally(name: string): string {
  return `${name} says: that's literally me`;
}

export function realSaid(name: string): string {
  return `the real ${name} said…`;
}

export function theyKnow(names: string): string {
  return `they know you: ${names}`;
}

export function crownLine(name: string): string {
  return `${name} knows you all best`;
}

export function nameWins(name: string): string {
  return `${name} wins`;
}

export function nameList(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
