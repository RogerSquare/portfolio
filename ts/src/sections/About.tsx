// About section with streaming bio text and stat cards
// Pattern from: terminal-ui-showcase/src/demos/streaming-text.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { about } from '../data.js';

const STATS = [
  { value: '10', label: 'Years in IT', color: '#fdb32a', icon: '◷' },
  { value: '6+', label: 'Projects', color: '#58a6ff', icon: '▣' },
  { value: '5+', label: 'Languages', color: '#3fb950', icon: '◇' },
  { value: '3', label: 'Platforms', color: '#bc8cff', icon: '◉' },
];

export default function AboutSection() {
  const [charIdx, setCharIdx] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const hasAnimated = useRef(false);

  const done = charIdx >= about.length;

  // Stream characters on first visit only
  useEffect(() => {
    if (hasAnimated.current) {
      setCharIdx(about.length);
      return;
    }
    if (done) {
      hasAnimated.current = true;
      return;
    }
    const delay = 12 + Math.random() * 10;
    const timer = setTimeout(() => setCharIdx(prev => prev + 1), delay);
    return () => clearTimeout(timer);
  }, [charIdx, done]);

  // Cursor blink
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setCursorVisible(prev => !prev), 530);
    return () => clearInterval(timer);
  }, [done]);

  const revealed = about.slice(0, charIdx);

  return (
    <Box flexDirection="column">
      {/* Bio text with streaming */}
      <Box width={56}>
        <Text color="#c9d1d9" wrap="wrap">
          {revealed}
          {!done && <Text color="#da7756">{cursorVisible ? '█' : ' '}</Text>}
        </Text>
      </Box>

      {/* Stat cards */}
      <Box marginTop={1} gap={1}>
        {STATS.map(stat => (
          <Box key={stat.label} flexDirection="column" alignItems="center" borderStyle="round" borderColor="#30363d" paddingX={3} paddingY={1} minWidth={14}>
            <Box gap={1}>
              <Text color={stat.color}>{stat.icon}</Text>
              <Text color={stat.color} bold>{stat.value}</Text>
            </Box>
            <Text color="#c9d1d9">{stat.label}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
