import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { about } from '../data.js';

export default function AboutSection() {
  const [charIdx, setCharIdx] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const hasAnimated = useRef(false);

  const done = charIdx >= about.length;

  useEffect(() => {
    if (hasAnimated.current) { setCharIdx(about.length); return; }
    if (done) { hasAnimated.current = true; return; }
    const delay = 15 + Math.random() * 12;
    const timer = setTimeout(() => setCharIdx(prev => prev + 1), delay);
    return () => clearTimeout(timer);
  }, [charIdx, done]);

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setCursorVisible(prev => !prev), 530);
    return () => clearInterval(timer);
  }, [done]);

  return (
    <Box flexDirection="column">
      <Box width={52}>
        <Text wrap="wrap">
          {about.slice(0, charIdx)}
          {!done && <Text color="cyan">{cursorVisible ? '▌' : ' '}</Text>}
        </Text>
      </Box>
      {done && (
        <Box marginTop={1} gap={1}>
          <Text>10 years</Text>
          <Text dimColor>·</Text>
          <Text>6+ projects</Text>
          <Text dimColor>·</Text>
          <Text>5+ languages</Text>
        </Box>
      )}
    </Box>
  );
}
