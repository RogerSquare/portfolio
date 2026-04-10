// Skills section -- minimal text list, no colors or animations

import React from 'react';
import { Box, Text } from 'ink';
import { skills } from '../data.js';

export default function SkillsSection() {
  return (
    <Box flexDirection="column">
      {skills.map(cat => (
        <Box key={cat.name} flexDirection="column" marginBottom={1}>
          <Text color="#555">{cat.name.toLowerCase()}</Text>
          <Text color="#888">
            {cat.items.join(' / ')}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
