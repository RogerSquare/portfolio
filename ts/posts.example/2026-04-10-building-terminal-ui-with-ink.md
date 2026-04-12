---
title: Building a Terminal UI Framework with React and Ink
date: 2026-04-10
tags: [typescript, react, ink, terminal-ui]
description: How I built 30 interactive terminal UI demos to learn the patterns behind modern CLI applications.
project: terminal-ui-showcase
---

When I first looked at how Claude Code renders its interface -- spinners, streaming text, interactive menus, all inside a terminal -- I wanted to understand the mechanics behind it. Not just "it uses React," but *how* React renders to a terminal, how animations run at 20fps without flickering, and how input handling works without a DOM.

## The Stack

The answer is [Ink](https://github.com/vadimdemedes/ink), a React renderer for the terminal. Instead of rendering to a browser DOM, Ink renders to stdout using ANSI escape codes. Components like `<Box>` and `<Text>` map to terminal layout and styling, and hooks like `useInput` capture keyboard events.

```typescript
import { render, Box, Text, useInput } from 'ink';

function App() {
  const [count, setCount] = useState(0);
  useInput((input) => {
    if (input === '+') setCount(c => c + 1);
  });
  return <Box><Text>Count: {count}</Text></Box>;
}

render(<App />);
```

That's a working interactive terminal app in 10 lines.

## What I Built

I created 30 isolated demos, each exploring a specific pattern:

**Animations**: Claude's exact spinner sequence (`· ✻ ✽ ✶ ✳ ✢`) with variable frame timing, sub-character progress bars using Unicode block elements, and streaming text with cursor blink.

**Interactions**: Fuzzy finders with scored ranking, vim-mode text editing with normal/insert/visual modes, checkbox multi-select with bulk operations.

**Data Display**: Braille-dot line charts, collapsible JSON inspectors, sortable data tables, and GitHub-style contribution heatmaps.

**Layout**: Split panes with resizable panels, tab navigation, modal dialogs with focus trapping, and a composed mini-dashboard combining all patterns.

## Key Takeaway

The terminal is a more capable rendering target than most people assume. With Unicode characters, ANSI colors, and a React component model, you can build interfaces that rival simple web UIs -- all accessible over SSH from any machine.
