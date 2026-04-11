// Minimal header -- plain name, muted title, no animation

import React from 'react';
import { Box, Text } from 'ink';
import { contact } from '../data.js';

export default function Header() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="white" bold>{contact.name}</Text>
      <Text color="gray">{contact.title}</Text>
      <Text color="gray" dimColor>{contact.location}</Text>
    </Box>
  );
}
