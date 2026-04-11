import React from 'react';
import { Box, Text } from 'ink';
import { contact } from '../data.js';

export default function Header() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold>{contact.name}</Text>
      <Text dimColor>{contact.title}</Text>
      <Text dimColor>{contact.location}</Text>
    </Box>
  );
}
