import React from 'react';
import { Box, Text } from 'ink';
import { contact } from '../data.js';

export default function Header() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="whiteBright" bold>{contact.name}</Text>
      <Text color="cyanBright" dimColor>{contact.title}</Text>
      <Text color="gray">{contact.location}</Text>
    </Box>
  );
}
