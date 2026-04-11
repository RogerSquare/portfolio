import React from 'react';
import { Box, Text } from 'ink';
import { skills } from '../data.js';

export default function SkillsSection() {
  return (
    <Box flexDirection="column">
      {skills.map(cat => (
        <Box key={cat.name} flexDirection="column" marginBottom={1}>
          <Text color="cyanBright" dimColor>{cat.name.toLowerCase()}</Text>
          <Text>
            {cat.items.map((s, i) => (
              <Text key={s}>
                {i > 0 && <Text color="gray"> · </Text>}
                <Text color="white">{s}</Text>
              </Text>
            ))}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
