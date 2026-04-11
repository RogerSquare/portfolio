import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { experience } from '../data.js';

export default function ExperienceSection() {
  const [cursor, setCursor] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor(prev => Math.max(0, prev - 1));
    else if (key.downArrow || input === 'j') setCursor(prev => Math.min(experience.length - 1, prev + 1));
    else if (key.return || input === ' ') {
      setExpanded(prev => {
        const next = new Set(prev);
        if (next.has(cursor)) next.delete(cursor);
        else next.add(cursor);
        return next;
      });
    }
  });

  return (
    <Box flexDirection="column">
      {experience.map((exp, i) => {
        const isActive = i === cursor;
        const isExpanded = expanded.has(i);
        return (
          <Box key={exp.role} flexDirection="column" marginBottom={1}>
            <Text color={isActive ? 'whiteBright' : 'white'} dimColor={!isActive}>{exp.role}</Text>
            <Box gap={1}>
              <Text color="gray">{exp.company}</Text>
              <Text color="blackBright">{exp.period}</Text>
            </Box>
            {isExpanded && exp.desc.map((d, j) => (
              <Text key={`d-${j}`} color="gray" dimColor>  - {d}</Text>
            ))}
          </Box>
        );
      })}
      <Text color="blackBright">↑↓ navigate · enter expand</Text>
    </Box>
  );
}
