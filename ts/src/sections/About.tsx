// About section -- bio text with stats line

import React from 'react';
import { Box, Text } from 'ink';
import { about } from '../data.js';

export default function AboutSection() {
  return (
    <Box flexDirection="column">
      <Box width={56}>
        <Text color="#999" wrap="wrap">{about}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="#555">10 years  /  6+ projects  /  5+ languages</Text>
      </Box>
    </Box>
  );
}
