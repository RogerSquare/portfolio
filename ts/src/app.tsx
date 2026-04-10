import React, { useState, useCallback } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import Header from './components/Header.js';
import TabBar, { type TabDef } from './components/TabBar.js';
import StatusBar from './components/StatusBar.js';
import Loader from './components/Loader.js';
import AboutSection from './sections/About.js';
import SkillsSection from './sections/Skills.js';
import ProjectsSection from './sections/Projects.js';
import ExperienceSection from './sections/Experience.js';
import ContactSection from './sections/Contact.js';

const TAB_DEFS: (TabDef & { component: () => React.ReactElement })[] = [
  { key: '1', label: 'About', icon: '◉', color: '#58a6ff', component: AboutSection },
  { key: '2', label: 'Skills', icon: '◆', color: '#3fb950', component: SkillsSection },
  { key: '3', label: 'Projects', icon: '▣', color: '#da7756', component: ProjectsSection },
  { key: '4', label: 'Experience', icon: '◇', color: '#d29922', component: ExperienceSection },
  { key: '5', label: 'Contact', icon: '✉', color: '#bc8cff', component: ContactSection },
];

function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const { exit } = useApp();

  const handleLoadDone = useCallback(() => setLoading(false), []);

  useInput((input, key) => {
    if (loading) return;
    if (input === 'q') exit();
    else if (key.leftArrow || input === 'h') setActiveTab(prev => Math.max(0, prev - 1));
    else if (key.rightArrow || input === 'l') setActiveTab(prev => Math.min(TAB_DEFS.length - 1, prev + 1));
    else if (key.tab) setActiveTab(prev => (prev + 1) % TAB_DEFS.length);
    else if (input >= '1' && input <= '5') setActiveTab(parseInt(input) - 1);
  });

  if (loading) {
    return <Loader onDone={handleLoadDone} />;
  }

  const ActiveContent = TAB_DEFS[activeTab].component;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Animated Header */}
      <Header />

      {/* Tab Navigation */}
      <TabBar tabs={TAB_DEFS} activeIdx={activeTab} />

      {/* Content */}
      <Box flexDirection="column" borderStyle="round" borderColor={TAB_DEFS[activeTab].color} paddingX={2} paddingY={1} minHeight={12}>
        <ActiveContent />
      </Box>

      {/* Status Bar */}
      <Box marginTop={1}>
        <StatusBar
          section={TAB_DEFS[activeTab].label}
          sectionColor={TAB_DEFS[activeTab].color}
          sectionIdx={activeTab}
          totalSections={TAB_DEFS.length}
        />
      </Box>
    </Box>
  );
}

render(<App />, { enterAltScreenBuffer: true });
