import React from 'react';
import { Box, Text } from 'ink';

export interface TabDef {
  key: string;
  label: string;
  icon: string;
  color: string;
}

interface TabBarProps {
  tabs: TabDef[];
  activeIdx: number;
}

export default function TabBar({ tabs, activeIdx }: TabBarProps) {
  return (
    <Box>
      {tabs.map((tab, i) => {
        const isActive = i === activeIdx;
        return (
          <Box key={tab.key} flexDirection="column">
            <Box paddingX={1} gap={1}>
              <Text color="gray" dimColor>{tab.key}</Text>
              <Text color={isActive ? 'whiteBright' : 'gray'} dimColor={!isActive}>{tab.label}</Text>
            </Box>
            <Text color={isActive ? 'white' : 'blackBright'} dimColor={!isActive}>
              {(isActive ? '━' : '─').repeat(tab.label.length + 4)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
