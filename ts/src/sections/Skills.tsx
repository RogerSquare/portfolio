// Skills section with categorized tag groups and animated reveal
// Replaces misleading progress bars with a clean grouped layout

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { skills } from '../data.js';

export default function SkillsSection() {
  const [revealedCategories, setRevealedCategories] = useState(0);
  const [revealedTags, setRevealedTags] = useState(0);
  const hasAnimated = useRef(false);

  const totalTags = skills.reduce((sum, cat) => sum + cat.items.length, 0);

  // Animate categories then tags on first visit
  useEffect(() => {
    if (hasAnimated.current) {
      setRevealedCategories(skills.length);
      setRevealedTags(totalTags);
      return;
    }

    if (revealedCategories < skills.length) {
      const timer = setTimeout(() => setRevealedCategories(prev => prev + 1), 200);
      return () => clearTimeout(timer);
    }

    if (revealedTags < totalTags) {
      const timer = setTimeout(() => setRevealedTags(prev => prev + 1), 60);
      return () => clearTimeout(timer);
    }

    hasAnimated.current = true;
  }, [revealedCategories, revealedTags, totalTags]);

  let tagCounter = 0;

  return (
    <Box flexDirection="column">
      {skills.map((cat, catIdx) => {
        const catVisible = catIdx < revealedCategories;
        if (!catVisible) return null;

        return (
          <Box key={cat.name} flexDirection="column" marginBottom={1}>
            {/* Category header */}
            <Box gap={1}>
              <Text color={cat.color}>{cat.icon}</Text>
              <Text color={cat.color} bold>{cat.name}</Text>
              <Text color="#30363d">({cat.items.length})</Text>
            </Box>

            {/* Skill tags */}
            <Box marginLeft={2} gap={0} flexWrap="wrap">
              {cat.items.map((item, itemIdx) => {
                const globalIdx = tagCounter++;
                const visible = globalIdx < revealedTags;
                if (!visible) return <Text key={item} color="#161b22">{'·'.repeat(item.length + 2)}</Text>;

                return (
                  <Text key={item}>
                    {itemIdx > 0 && <Text color="#30363d"> · </Text>}
                    <Text color="#c9d1d9">{item}</Text>
                  </Text>
                );
              })}
            </Box>
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text color="#30363d">{totalTags} skills across {skills.length} categories</Text>
      </Box>
    </Box>
  );
}
