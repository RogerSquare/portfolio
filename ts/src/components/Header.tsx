// Animated gradient header with color wave and shimmer
// Pattern from: terminal-ui-showcase/src/demos/gradient-text.tsx, thinking-indicator.tsx

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { contact } from '../data.js';

const GRADIENT_STOPS = ['#da7756', '#e8945a', '#fdb32a', '#e8945a', '#da7756'];
// Soft blue-gray wave -- stays readable, no harsh jumps
const SHIMMER_COLORS = [
  '#6e7681', '#7c8490', '#8b929e', '#99a1ad', '#8b929e', '#7c8490',
  '#6e7681', '#616a76', '#566070', '#4d5566', '#566070', '#616a76',
];

function gradientColor(stops: string[], t: number): string {
  if (stops.length === 1) return stops[0];
  const segment = t * (stops.length - 1);
  const idx = Math.min(Math.floor(segment), stops.length - 2);
  const local = segment - idx;

  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const a = parse(stops[idx]);
  const b = parse(stops[idx + 1]);
  const r = Math.round(a[0] + (b[0] - a[0]) * local);
  const g = Math.round(a[1] + (b[1] - a[1]) * local);
  const bl = Math.round(a[2] + (b[2] - a[2]) * local);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

export default function Header() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setOffset(prev => prev + 1), 180);
    return () => clearInterval(timer);
  }, []);

  const name = contact.name;
  const title = contact.title;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Gradient animated name */}
      <Box>
        {name.split('').map((char, i) => {
          const t = ((i * 3 + offset) % (name.length * 4)) / (name.length * 4);
          return (
            <Text key={`n-${i}`} bold color={gradientColor(GRADIENT_STOPS, t)}>
              {char}
            </Text>
          );
        })}
      </Box>

      {/* Shimmer title */}
      <Box>
        {title.split('').map((char, i) => {
          const colorIdx = (offset + i) % SHIMMER_COLORS.length;
          return (
            <Text key={`t-${i}`} color={SHIMMER_COLORS[colorIdx]}>
              {char}
            </Text>
          );
        })}
      </Box>

      {/* Location with pulse */}
      <Box gap={1}>
        <Text color="#30363d">{'⌂'}</Text>
        <Text color="#8b949e">{contact.location}</Text>
      </Box>
    </Box>
  );
}
