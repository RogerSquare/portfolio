// Experience section -- tree view pattern from TUI showcase
// Expand/collapse with visual indicators, timeline connectors

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

        return (
          <Box key={exp.role} flexDirection="column">
            <Box>
              {/* Timeline */}
              <Box flexDirection="column" width={3} alignItems="center">
                <Text color={isCurrent ? 'cyanBright' : 'gray'} dimColor={!isCurrent}>
                  {isCurrent ? '●' : '○'}
                </Text>
              </Box>

              {/* Content */}
              <Box flexDirection="column" flexGrow={1}>
                <Box gap={1}>
                  <Text color={isActive ? 'whiteBright' : 'white'}>{exp.role}</Text>
                  <Text color={isExpanded ? 'white' : 'gray'}>{isExpanded ? '▾' : '▸'}</Text>
                </Box>
                <Box gap={1} marginLeft={0}>
                  <Text color="gray">{exp.company}</Text>
                  <Text color="gray" dimColor>{exp.period}</Text>
                </Box>
              </Box>
            </Box>

            {/* Expanded details with tree connectors */}
            {isExpanded && (
              <Box>
                <Box width={3} alignItems="center" flexDirection="column">
                  {exp.desc.map((_, j) => (
                    <Text key={`c-${j}`} color="blackBright">{isLast && j === exp.desc.length - 1 ? ' ' : '│'}</Text>
                  ))}
                </Box>
                <Box flexDirection="column">
                  {exp.desc.map((d, j) => (
                    <Box key={`d-${j}`} gap={1}>
                      <Text color="blackBright">{j === exp.desc.length - 1 ? '└─' : '├─'}</Text>
                      <Text color="gray">{d}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Connector to next entry */}
            {!isLast && (
              <Box>
                <Box width={3} alignItems="center" flexDirection="column">
                  <Text color="blackBright">│</Text>
                </Box>
              </Box>
            )}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text color="gray" dimColor>↑↓ navigate · enter expand</Text>
      </Box>
    </Box>
  );
}
