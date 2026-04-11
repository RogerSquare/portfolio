import React from 'react';
import { Box, Text } from 'ink';
import { about } from '../data.js';

export default function AboutSection() {
  return (
    <Box flexDirection="column">
      <Box width={56}>
        <Text color="gray" wrap="wrap">{about}</Text>
      </Box>
      <Box marginTop={1} gap={1}>
        <Text color="yellow">10 years</Text>
        <Text color="blackBright">/</Text>
        <Text color="blue">6+ projects</Text>
        <Text color="blackBright">/</Text>
        <Text color="green">5+ languages</Text>
      </Box>
    </Box>
  );
}
