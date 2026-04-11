// Portfolio app component -- shared between local and SSH modes
// Chat bar always visible at bottom, robot in top-right

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Header from './components/Header.js';
import TabBar, { type TabDef } from './components/TabBar.js';
import Loader from './components/Loader.js';
import AboutSection from './sections/About.js';
import SkillsSection from './sections/Skills.js';
import ProjectsSection from './sections/Projects.js';
import ExperienceSection from './sections/Experience.js';
import ContactSection from './sections/Contact.js';
import { getResponse, randomGreeting, randomIdleQuip, type RobotState, FRAMES } from './chat-engine.js';

export const TAB_DEFS: (TabDef & { component: () => React.ReactElement })[] = [
  { key: '1', label: 'About', icon: '◉', color: '#58a6ff', component: AboutSection },
  { key: '2', label: 'Skills', icon: '◆', color: '#3fb950', component: SkillsSection },
  { key: '3', label: 'Projects', icon: '▣', color: '#da7756', component: ProjectsSection },
  { key: '4', label: 'Experience', icon: '◇', color: '#d29922', component: ExperienceSection },
  { key: '5', label: 'Contact', icon: '✉', color: '#bc8cff', component: ContactSection },
];

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [chatMode, setChatMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string }[]>([]);
  const [robotState, setRobotState] = useState<RobotState>('idle');
  const [idleTicks, setIdleTicks] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [typingIdx, setTypingIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const hasGreeted = useRef(false);
  const { exit } = useApp();

  const handleLoadDone = useCallback(() => setLoading(false), []);

  // Start typing a bot message
  function startTyping(text: string) {
    setTypingText(text);
    setTypingIdx(0);
    setIsTyping(true);
  }

  // Typing animation tick
  useEffect(() => {
    if (!isTyping) return;
    if (typingIdx >= typingText.length) {
      // Done typing -- commit full message
      setChatMessages(prev => [...prev.slice(-4), { from: 'bot', text: typingText }]);
      setIsTyping(false);
      setTypingText('');
      setTypingIdx(0);
      setRobotState('idle');
      return;
    }
    // Alternate talk frames while typing
    setRobotState(typingIdx % 6 < 3 ? 'talk1' : 'talk2');
    const timer = setTimeout(() => setTypingIdx(prev => prev + 1), 35 + Math.random() * 20);
    return () => clearTimeout(timer);
  }, [isTyping, typingIdx, typingText]);

  // Greeting on first load
  useEffect(() => {
    if (loading || hasGreeted.current) return;
    hasGreeted.current = true;
    const g = randomGreeting();
    startTyping(g);
  }, [loading]);

  // Blink
  useEffect(() => {
    const timer = setInterval(() => {
      if (robotState === 'idle') {
        setRobotState('blink');
        setTimeout(() => setRobotState('idle'), 150);
      }
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(timer);
  }, [robotState]);

  // Idle quips
  useEffect(() => {
    if (chatMode) return;
    const timer = setInterval(() => {
      setIdleTicks(prev => {
        if (prev > 0 && prev % 4 === 0 && !isTyping) {
          const quip = randomIdleQuip();
          startTyping(quip);
        }
        return prev + 1;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, [chatMode]);

  function sendChat() {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    setIdleTicks(0);
    setChatMessages(prev => [...prev.slice(-4), { from: 'user', text: msg }]);
    setRobotState('think');

    setTimeout(() => {
      const response = getResponse(msg);
      startTyping(response);
    }, 300 + Math.random() * 300);
  }

  useInput((input, key) => {
    if (loading) return;

    // Chat mode: all input goes to chat
    if (chatMode) {
      if (key.escape) { setChatMode(false); return; }
      if (key.return) { sendChat(); return; }
      if (key.backspace || key.delete) { setChatInput(prev => prev.slice(0, -1)); return; }
      if (input && !key.ctrl && !key.meta) { setChatInput(prev => prev + input); return; }
      return;
    }

    // Normal mode
    if (input === 'q') exit();
    else if (input === '/') setChatMode(true);
    else if (key.leftArrow || input === 'h') setActiveTab(prev => Math.max(0, prev - 1));
    else if (key.rightArrow || input === 'l') setActiveTab(prev => Math.min(TAB_DEFS.length - 1, prev + 1));
    else if (key.tab) setActiveTab(prev => (prev + 1) % TAB_DEFS.length);
    else if (input >= '1' && input <= '5') setActiveTab(parseInt(input) - 1);
  });

  if (loading) {
    return <Loader onDone={handleLoadDone} />;
  }

  const ActiveContent = TAB_DEFS[activeTab].component;
  const frame = FRAMES[robotState];
  const lastBotMsg = [...chatMessages].reverse().find(m => m.from === 'bot');

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Header />

      {/* Tabs and content */}
      <TabBar tabs={TAB_DEFS} activeIdx={activeTab} />
      <Box flexDirection="column" borderStyle="round" borderColor="#222" paddingX={2} paddingY={1}>
        <Box>
          {/* Section content */}
          <Box flexDirection="column" flexGrow={1}>
            <ActiveContent />
          </Box>

          {/* Robot + speech -- fixed width, pinned to top, left border as divider */}
          <Box flexDirection="column" width={30} alignItems="center" flexShrink={0} borderStyle="single" borderColor="#222" borderLeft borderTop={false} borderRight={false} borderBottom={false} paddingLeft={1}>
            <Box flexDirection="column" alignItems="center">
              {frame.map((line, i) => {
                if (i !== 2) return <Text key={`r-${i}`} color="#333">{line}</Text>;
                return (
                  <Text key={`r-${i}`}>
                    {line.split('').map((ch, j) => {
                      const isBox = '┌┐└┘│─┬┴├┤ '.includes(ch);
                      return <Text key={`c-${j}`} color={isBox ? '#333' : '#00bcd4'}>{ch}</Text>;
                    })}
                  </Text>
                );
              })}
            </Box>
            {(isTyping || lastBotMsg) && (
              <Box width={28} marginTop={1} justifyContent="center">
                <Text color="#444" wrap="wrap">
                  {isTyping ? typingText.slice(0, typingIdx) : lastBotMsg?.text}
                  {isTyping && <Text color="#555">█</Text>}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Status line */}
      <Box marginTop={0} justifyContent="space-between">
        <Text color="#333">
          {chatMode ? 'esc back  enter send' : `${TAB_DEFS[activeTab].label}  ←→ tabs  / chat  q quit`}
        </Text>
        <Text color="#222">{new Date().toLocaleTimeString('en-US', { hour12: false })}</Text>
      </Box>

      {/* Chat input bar -- only visible in chat mode */}
      {chatMode && (
        <Box marginTop={0}>
          <Text color="#666">{'> '}</Text>
          <Text color="#999">{chatInput}</Text>
          <Text color="#555">█</Text>
        </Box>
      )}
    </Box>
  );
}
