---
title: How Claude Code Renders Its Terminal Interface
date: 2026-04-09
tags: [claude-code, terminal-ui, reverse-engineering]
description: Studying the techniques behind Claude Code's polished CLI experience.
project: terminal-ui-showcase
---

Claude Code doesn't look like a typical CLI tool. It has smooth animations, interactive prompts, streaming markdown rendering, and a responsive layout that adapts to your terminal size. I spent time studying how it achieves this.

## React All the Way Down

The entire UI is built with React and a custom fork of Ink. This means every piece of the interface -- the spinner, the input prompt, the streaming response, the tool approval dialogs -- is a React component with its own state and lifecycle.

## The Spinner

The spinner uses six Unicode characters that rotate with deliberate timing:

```
· → ✻ → ✽ → ✶ → ✳ → ✢
```

The first and last frames hold longer than the middle ones, creating a breathing effect. The spinner runs as an isolated component (`SpinnerAnimationRow`) separated from the verb text (`SpinnerWithVerb`) to prevent cascading re-renders -- a 15x reduction in parent renders.

## Frame Diffing

Ink maintains front and back frame buffers. On each render, it diffs the two and only sends the minimal ANSI escape sequences needed to update the changed characters. This is why the UI doesn't flicker despite updating at 20fps.

## Streaming Markdown

When Claude streams a response, the UI renders markdown incrementally. Bold, code blocks, and headings are formatted as each token arrives. This requires an incremental parser that can handle partial markdown -- you might receive `**bol` in one chunk and `d**` in the next.

## What I Took Away

The key insight isn't any single technique -- it's the commitment to treating the terminal as a first-class UI target. The same care that goes into web interfaces (component isolation, render optimization, accessibility) applies here too.
