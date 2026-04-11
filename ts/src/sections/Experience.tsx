// Experience section -- tree view with aligned connectors

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
        const isLast = i === experience.length - 1;
        const isCurrent = i === 0;
        const connector = isLast ? ' ' : '│';

        return (
          <Box key={exp.role} flexDirection="column">
            {/* Role header */}
            <Box>
              <Text color="cyan" dimColor={!isCurrent}>{isCurrent ? '● ' : '○ '}</Text>
              <Text bold={isActive}>{exp.role} {isExpanded ? '▾' : '▸'}</Text>
            </Box>

            {/* Company and period */}
            <Box>
              <Text dimColor>{connector} </Text>
              <Text dimColor>{exp.company}  {exp.period}</Text>
            </Box>

            {/* Expanded descriptions */}
            {isExpanded && exp.desc.map((d, j) => {
              const isDescLast = j === exp.desc.length - 1;
              return (
                <Box key={`d-${j}`}>
                  <Text dimColor>{connector} </Text>
                  <Text dimColor>{isDescLast ? '└─ ' : '├─ '}</Text>
                  <Text dimColor>{d}</Text>
                </Box>
              );
            })}

            {/* Spacer between entries */}
            {!isLast && (
              <Box>
                <Text dimColor>│</Text>
              </Box>
            )}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate · enter expand</Text>
      </Box>
    </Box>
  );
}
