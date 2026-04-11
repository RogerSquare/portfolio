import React from 'react';
import { Box, Text } from 'ink';
import { skills } from '../data.js';

export default function SkillsSection() {
  return (
    <Box flexDirection="column">
      {skills.map(cat => (
        <Box key={cat.name} flexDirection="column" marginBottom={1}>
          <Text color="white" dimColor>{cat.name.toLowerCase()}</Text>
          <Text color="gray" dimColor>
            {cat.items.map((s, i) => (
              <Text key={s}>
                {i > 0 && <Text color="blackBright"> / </Text>}
                <Text color="gray">{s}</Text>
              </Text>
            ))}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
