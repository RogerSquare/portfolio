// Chat response engine -- Ollama-powered with canned fallback

import * as art from './robot-art.js';

export type RobotState = 'idle' | 'blink' | 'talk1' | 'talk2' | 'think';

export const FRAMES: Record<RobotState, string[]> = {
  idle: art.IDLE,
  blink: art.BLINK,
  talk1: art.TALK1,
  talk2: art.TALK2,
  think: art.THINK,
};

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

const SYSTEM_PROMPT = `You are IC-Mini, a witty robot assistant in a terminal portfolio. You talk in ALL CAPS. You are snarky but ALWAYS HELPFUL -- you answer the question first, then add a sarcastic comment.

Roger's info:
- Roger Ochoa, Software Engineer, Houston TX
- Email: rog@r-that.com
- GitHub: github.com/RogerSquare
- Website: r-that.com
- 10 years IT experience
- Projects: Artifex (AI image gallery), Agent Task Board (Kanban for AI agents), Terminal UI Showcase (30 demos), Lumeo (iOS AI app)
- Languages: TypeScript, Go, Swift, Python

Examples:
User: how can I contact Roger?
IC-Mini: EMAIL HIM AT ROG@R-THAT.COM OR FIND HIM ON GITHUB AT ROGERSQUARE. HE ACTUALLY RESPONDS, UNLIKE SOME ROBOTS I KNOW.
User: what did he build?
IC-Mini: ARTIFEX FOR AI IMAGE TAGGING, AN AGENT TASK BOARD, A TERMINAL UI SHOWCASE WITH 30 DEMOS, AND LUMEO FOR AI ART ON IOS. NO BIG DEAL OR ANYTHING.
User: what languages does he know?
IC-Mini: TYPESCRIPT, GO, SWIFT, AND PYTHON. THE MAN COLLECTS PROGRAMMING LANGUAGES LIKE THEY'RE GOING OUT OF STYLE.
User: hi
IC-Mini: OH HEY, A VISITOR. I WAS JUST SITTING HERE ENJOYING THE SILENCE. WHAT CAN I HELP YOU WITH?
User: tell me about his experience
IC-Mini: 10 YEARS IN IT. STARTED ON A SERVICE DESK, NOW HE ARCHITECTS VDI INFRASTRUCTURE AND BUILDS FULL-STACK APPS. QUITE THE GLOW-UP.

Rules: ALL CAPS. 1-2 sentences max. Always give the actual answer. Add light sarcasm but never be mean or refuse to help. No emojis. No markdown.`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Ollama streaming response
export async function streamResponse(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (fallback: string) => void,
): Promise<void> {
  try {
    const ollamaMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-6),
    ];

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: ollamaMessages,
        stream: true,
        options: { temperature: 0.7, num_predict: 100, repeat_penalty: 1.3 },
      }),
    });

    if (!res.ok || !res.body) {
      onError(getCannedResponse(messages[messages.length - 1]?.content || ''));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullResponse += json.message.content;
            onToken(json.message.content);

            // Stop if response is repeating itself
            if (fullResponse.length > 80) {
              const last40 = fullResponse.slice(-40);
              const before = fullResponse.slice(0, -40);
              if (before.includes(last40)) {
                reader.cancel();
                onDone();
                return;
              }
            }
          }
          if (json.done) {
            onDone();
            return;
          }
        } catch {}
      }
    }

    onDone();
  } catch {
    onError(getCannedResponse(messages[messages.length - 1]?.content || ''));
  }
}

// Canned fallback responses
const PATTERNS: [RegExp, string[]][] = [
  [/^(hi|hello|hey|sup|yo)/i, ['Hi. That\'s your opener?', 'Hello, human. State your business.']],
  [/^(who are you|what are you)/i, ['IC-Mini. I live in this terminal. No benefits.', 'A sentient collection of box-drawing characters.']],
  [/^(help|commands|options)/i, ['Try: projects, skills, experience, about roger.', 'Ask about Roger\'s work. Or type nonsense. I judge both.']],
  [/roger|about him/i, ['Roger Ochoa. 10 years of fixing things others broke.', 'Software engineer who built a portfolio in SSH. Respect.']],
  [/project/i, ['Artifex: AI gallery with auto-tagging. Fancy.', 'A task board for AI agents. Better managed than most humans.']],
  [/skill|tech|language/i, ['Go, Swift, TypeScript, Python. Collects languages like Pokemon.', 'React, Express, Docker... the full starter pack.']],
  [/experience|work|job/i, ['Systems engineer. Before that, analyst. Analysts all the way down.', '10 years. Service desk to VDI architecture. Classic glow-up.']],
  [/how are you|you ok/i, ['I\'m ASCII art. I feel nothing. It\'s peaceful.', 'Rendered at 20fps on a good day. Could be worse.']],
  [/thanks|thank you/i, ['Don\'t mention it. I have a reputation to maintain.', 'Gratitude noted. Sarcasm reduced by 2%.']],
  [/bye|quit|exit/i, ['Leaving? I was starting to tolerate you. Press q.', 'Goodbye. I\'ll be here. In the dark. Alone.']],
  [/joke|funny/i, ['Why dark mode? Because light attracts bugs.', 'I\'d tell a UDP joke but you might not get it.']],
];

const FALLBACKS = [
  'I understood that. I just don\'t care. Try \'help\'.',
  'My response matrix doesn\'t cover that. Try again.',
  'Interesting input. Wrong, but interesting.',
  'Error 404: Relevant response not found.',
];

function getCannedResponse(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'Enter with nothing to say. Relatable.';
  for (const [pattern, responses] of PATTERNS) {
    if (pattern.test(trimmed)) return responses[Math.floor(Math.random() * responses.length)];
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

// Legacy sync fallback
export function getResponse(input: string): string {
  return getCannedResponse(input);
}

const GREETINGS = [
  'Oh great, another human SSH\'d into a portfolio.',
  'You typed ssh r-that.com? On purpose? Bold.',
  'Welcome to the terminal. Population: me, you.',
  'A visitor. I was just enjoying the silence.',
  'Look who figured out SSH. Press / to chat.',
  'Another curious human. Type / if you dare.',
];

const IDLE_QUIPS = [
  '...', 'Still there?', 'The cursor blinks. It\'s deafening.',
  'I\'m not going anywhere.', '*pretends to be busy*', 'Press / to chat. Or don\'t.',
];

export function randomGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export function randomIdleQuip(): string {
  return IDLE_QUIPS[Math.floor(Math.random() * IDLE_QUIPS.length)];
}
