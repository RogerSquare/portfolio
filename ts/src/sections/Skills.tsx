import React from 'react';
import { Box, Text } from 'ink';
import { skills } from '../data.js';

export default function SkillsSection() {
  return (
    <Box flexDirection="column">
      {skills.map(cat => (
        <Box key={cat.name} flexDirection="column" marginBottom={1}>
          <Text color="cyan">{cat.name.toLowerCase()}</Text>
          <Text color="gray">{cat.items.join(' / ')}</Text>
        </Box>
      ))}
    </Box>
  );
}
