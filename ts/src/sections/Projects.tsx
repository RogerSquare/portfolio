// Projects section -- flat list

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { projects } from '../data.js';

export default function ProjectsSection() {
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor(prev => Math.max(0, prev - 1));
    else if (key.downArrow || input === 'j') setCursor(prev => Math.min(projects.length - 1, prev + 1));
  });

  return (
    <Box flexDirection="column">
      {projects.map((p, i) => {
        const isActive = i === cursor;
        return (
          <Box key={p.name} flexDirection="column" marginBottom={1}>
            <Text color={isActive ? 'white' : 'gray'}>{p.name}</Text>
            <Text color="gray" dimColor>{p.desc}</Text>
            <Text color="blackBright">{p.tech.join(' / ')}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
