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
  const hasGreeted = useRef(false);
  const { exit } = useApp();

  const handleLoadDone = useCallback(() => setLoading(false), []);

  // Greeting on first load
  useEffect(() => {
    if (loading || hasGreeted.current) return;
    hasGreeted.current = true;
    const g = randomGreeting();
    setChatMessages([{ from: 'bot', text: g }]);
    setRobotState('talk1');
    setTimeout(() => setRobotState('idle'), 600);
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
        if (prev > 0 && prev % 4 === 0) {
          const quip = randomIdleQuip();
          setChatMessages(m => [...m.slice(-4), { from: 'bot', text: quip }]);
          setRobotState('talk1');
          setTimeout(() => setRobotState('idle'), 400);
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
      setChatMessages(prev => [...prev.slice(-4), { from: 'bot', text: response }]);
      setRobotState('talk1');
      setTimeout(() => setRobotState('talk2'), 150);
      setTimeout(() => setRobotState('idle'), 500);
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
      {/* Top row: header left, robot + speech right */}
      <Box justifyContent="space-between">
        <Box flexDirection="column">
          <Header />
        </Box>
        <Box>
          {/* Speech bubble to the left of robot */}
          {lastBotMsg && (
            <Box flexDirection="column" justifyContent="center" marginRight={1} width={32}>
              <Text color="#444" wrap="wrap">{lastBotMsg.text}</Text>
            </Box>
          )}
          {/* Robot with cyan eyes/mouth */}
          <Box flexDirection="column">
            {frame.map((line, i) => {
              // Only the face row (index 1) gets cyan coloring on non-box characters
              if (i !== 1) return <Text key={`r-${i}`} color="#333">{line}</Text>;
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
        </Box>
      </Box>

      {/* Tabs and content */}
      <TabBar tabs={TAB_DEFS} activeIdx={activeTab} />
      <Box flexDirection="column" borderStyle="round" borderColor="#222" paddingX={2} paddingY={1} minHeight={10}>
        <ActiveContent />
      </Box>

      {/* Status line */}
      <Box marginTop={0} justifyContent="space-between">
        <Text color="#333">
          {chatMode ? 'esc back  enter send' : `${TAB_DEFS[activeTab].label}  ←→ tabs  / chat  q quit`}
        </Text>
        <Text color="#222">{new Date().toLocaleTimeString('en-US', { hour12: false })}</Text>
      </Box>

      {/* Chat input bar -- always visible */}
      <Box marginTop={0}>
        <Text color={chatMode ? '#666' : '#333'}>{chatMode ? '> ' : '/ '}</Text>
        {chatMode ? (
          <Text>
            <Text color="#999">{chatInput}</Text>
            <Text color="#555">█</Text>
          </Text>
        ) : (
          <Text color="#333">press / to chat with IC-Mini</Text>
        )}
      </Box>
    </Box>
  );
}
