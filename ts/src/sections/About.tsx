// About section -- streaming bio, inline stats as plain text

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { about } from '../data.js';

export default function AboutSection() {
  const [charIdx, setCharIdx] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const hasAnimated = useRef(false);

  const done = charIdx >= about.length;

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

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setCursorVisible(prev => !prev), 530);
    return () => clearInterval(timer);
  }, [done]);

  const revealed = about.slice(0, charIdx);

  return (
    <Box flexDirection="column">
      <Box width={56}>
        <Text color="#999" wrap="wrap">
          {revealed}
          {!done && <Text color="#555">{cursorVisible ? '█' : ' '}</Text>}
        </Text>
      </Box>

      {done && (
        <Box marginTop={1}>
          <Text color="#444">10 years  /  6+ projects  /  5+ languages  /  3 platforms</Text>
        </Box>
      )}
    </Box>
  );
}
