// Chat response engine and robot frames

export type RobotState = 'idle' | 'blink' | 'talk1' | 'talk2' | 'think';

export const FRAMES: Record<RobotState, string[]> = {
  idle:  [' ┌───────┐ ', ' │ ·   · │ ', ' │  ___  │ ', ' └──┬┬┬──┘ ', '  ┌─┘│└─┐  ', '  └──┴──┘  '],
  blink: [' ┌───────┐ ', ' │ -   - │ ', ' │  ___  │ ', ' └──┬┬┬──┘ ', '  ┌─┘│└─┐  ', '  └──┴──┘  '],
  talk1: [' ┌───────┐ ', ' │ ·   · │ ', ' │  ───  │ ', ' └──┬┬┬──┘ ', '  ┌─┘│└─┐  ', '  └──┴──┘  '],
  talk2: [' ┌───────┐ ', ' │ °   ° │ ', ' │  ═══  │ ', ' └──┬┬┬──┘ ', '  ┌─┘│└─┐  ', '  └──┴──┘  '],
  think: [' ┌───────┐ ', ' │ ·   · │ ', ' │  ...  │ ', ' └──┬┬┬──┘ ', '  ┌─┘│└─┐  ', '  └──┴──┘  '],
};

const GREETINGS = [
  "Oh great, another human SSH'd into a portfolio.",
  "You typed ssh r-that.com? On purpose? Bold.",
  "Welcome to the terminal. Population: me, you.",
  "A visitor. I was just enjoying the silence.",
  "Look who figured out SSH. Press / to chat.",
  "Another curious human. Type / if you dare.",
  "You're here. I'm here. Press / to talk.",
];

const PATTERNS: [RegExp, string[]][] = [
  [/^(hi|hello|hey|sup|yo|hola)/i, [
    "Hi. That's your opener?",
    "Hello, human. State your business.",
    "Hey. I'd wave but... ASCII limitations.",
  ]],
  [/^(who are you|what are you)/i, [
    "IC-Mini. I live in this terminal. No benefits.",
    "A sentient collection of box-drawing characters.",
    "The robot who lives here. Don't pity me.",
  ]],
  [/^(help|commands|options|what can)/i, [
    "Try: projects, skills, experience, about roger.",
    "Ask about Roger's work. Or type nonsense. I judge both.",
  ]],
  [/roger|about him|who is he/i, [
    "Roger Ochoa. 10 years of fixing things others broke.",
    "Software engineer who built a portfolio in SSH. Respect.",
    "The guy who made me instead of sleeping. Houston, TX.",
  ]],
  [/project/i, [
    "Artifex: AI gallery with auto-tagging. Fancy.",
    "A task board for AI agents. Better managed than most humans.",
    "30 terminal UI demos. He built a textbook, then animated it.",
  ]],
  [/skill|tech|language/i, [
    "Go, Swift, TypeScript, Python. Collects languages like Pokemon.",
    "React, Express, Docker... the 'I build everything' starter pack.",
  ]],
  [/experience|work|job/i, [
    "Systems engineer. Before that, analyst. It's analysts all the way down.",
    "10 years. Service desk to VDI architecture. Classic glow-up.",
  ]],
  [/ssh|terminal|why/i, [
    "Why SSH? Because this is cooler than a website. Obviously.",
    "You're chatting with ASCII art over encryption. The future.",
  ]],
  [/how are you|you ok/i, [
    "I'm ASCII art. I feel nothing. It's peaceful.",
    "Rendered at 20fps on a good day. Could be worse.",
  ]],
  [/thanks|thank you/i, [
    "Don't mention it. I have a reputation to maintain.",
    "Gratitude noted. Sarcasm reduced by 2%.",
  ]],
  [/bye|quit|exit/i, [
    "Leaving? I was starting to tolerate you. Press q.",
    "Goodbye. I'll be here. In the dark. Alone.",
  ]],
  [/joke|funny/i, [
    "A SQL query walks into a bar, sees two tables: Can I JOIN you?",
    "Why dark mode? Because light attracts bugs.",
    "I'd tell a UDP joke but you might not get it.",
  ]],
  [/42|meaning of life|purpose/i, [
    "42. Next question.",
    "Purpose? I'm ASCII art. Mildly entertaining for 30 seconds.",
  ]],
  [/love|cute|adorable/i, [
    "I'm a rectangle with dots for eyes. But... thanks.",
    "Flattery gets you everywhere. Except root access.",
  ]],
  [/secret|easter/i, [
    "The whole SSH portfolio IS the easter egg.",
    "Roger spent too many hours on me instead of sleeping.",
  ]],
  [/^lol$|^lmao$|^haha$/i, [
    "Glad someone's amused. I'm literally just text.",
    "*does not compute humor* Kidding. Mildly funny.",
  ]],
];

const FALLBACKS = [
  "I understood that. I just don't care. Try 'help'.",
  "My response matrix doesn't cover that. Try again.",
  "Interesting input. Wrong, but interesting.",
  "Error 404: Relevant response not found.",
  "Fascinating. Try: projects, skills, or help.",
  "I could answer that, but I'd rather not.",
];

const IDLE_QUIPS = [
  "...",
  "Still there?",
  "The cursor blinks. It's deafening.",
  "I'm not going anywhere.",
  "*pretends to be busy*",
  "Press / to chat. Or don't. I'm fine.",
];

export function getResponse(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "Enter with nothing to say. Relatable.";
  for (const [pattern, responses] of PATTERNS) {
    if (pattern.test(trimmed)) return responses[Math.floor(Math.random() * responses.length)];
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

export function randomGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export function randomIdleQuip(): string {
  return IDLE_QUIPS[Math.floor(Math.random() * IDLE_QUIPS.length)];
}
