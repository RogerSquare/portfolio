// Contact section -- plain label:value list, no icons

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { contact } from '../data.js';

const ITEMS = [
  { label: 'email', value: contact.email },
  { label: 'github', value: contact.github },
  { label: 'web', value: contact.website },
  { label: 'location', value: contact.location },
];

export default function ContactSection() {
  const [cursor, setCursor] = useState(0);
  const [toast, setToast] = useState('');
  const { stdout } = useStdout();

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor(prev => Math.max(0, prev - 1));
    else if (key.downArrow || input === 'j') setCursor(prev => Math.min(ITEMS.length - 1, prev + 1));
    else if (key.return) {
      const item = ITEMS[cursor];
      const encoded = Buffer.from(item.value).toString('base64');
      stdout?.write(`\x1b]52;c;${encoded}\x07`);
      setToast(`copied: ${item.value}`);
    }
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <Box flexDirection="column">
      {ITEMS.map((item, i) => {
        const isActive = i === cursor;
        return (
          <Box key={item.label} gap={1}>
            <Text color="#444">{item.label.padEnd(10)}</Text>
            <Text color={isActive ? '#bbb' : '#666'}>{item.value}</Text>
          </Box>
        );
      })}

      <Box marginTop={1}>
        {toast
          ? <Text color="#555">{toast}</Text>
          : <Text color="#333">↑↓ select  enter copy</Text>
        }
      </Box>
    </Box>
  );
}
