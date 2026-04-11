// About section -- conversational bio, no animation

import React from 'react';
import { Box, Text } from 'ink';
import { about } from '../data.js';

export default function AboutSection() {
  return (
    <Box flexDirection="column">
      {about.split('\n').map((line, i) => (
        <Text key={`a-${i}`} color="#999">{line || ' '}</Text>
      ))}
    </Box>
  );
}
