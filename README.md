# Terminal Portfolio

An interactive, SSH-accessible terminal portfolio built with Go and the Charm Bracelet ecosystem. It renders a full TUI (terminal user interface) with multiple navigable views, styled layouts, and keyboard-driven navigation. Connect via SSH or run the binary directly to browse through About, Skills, Projects, Experience, Education, and Contact sections.

## Overview

This project uses the MVU (Model-View-Update) architecture provided by Bubble Tea. All portfolio content is defined in a single `data.json` file, which gets embedded into the compiled binary at build time using Go's `embed` package. The SSH server is powered by Wish, allowing anyone to view the portfolio by connecting to your server without needing a browser.

```
Model (state) --> View (render) --> Update (handle input) --> Model
```

## Features

- **SSH server**: Serve the portfolio over SSH on port 2222 using Wish
- **Rich TUI design**: Styled borders, colors, and layouts using Lip Gloss
- **Keyboard navigation**: Vim-style controls (h/j/k/l) and arrow keys
- **Six views**: About, Skills, Projects, Experience, Education, Contact
- **Responsive layout**: Adapts to terminal resize events, with separate layouts for wide and narrow terminals
- **Loading animation**: Spinner on startup before rendering content
- **Data-driven content**: All portfolio data loaded from a single JSON file
- **Cross-platform binaries**: GitHub Actions workflow cross-compiles for Windows, macOS, and Linux (amd64 + arm64)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | Go 1.25 |
| TUI Framework | Bubble Tea |
| Styling | Lip Gloss |
| Components | Bubbles (viewport, spinner) |
| SSH Server | Wish |
| Logging | Charm Log |
| Rate Limiting | golang.org/x/time |
| CI/CD | GitHub Actions (cross-compile on tag push) |

## Getting Started

### Prerequisites

- Go 1.21+
- A terminal with color and Unicode support

### Build and Run

```bash
git clone https://github.com/RogerSquare/portfolio.git
cd portfolio
go mod download
go build -o portfolio
./portfolio
```

The SSH server starts on port 2222. Connect from another terminal:

```bash
ssh localhost -p 2222
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| `q` / `Ctrl+C` | Quit |
| `]` / Right Arrow | Next view |
| `[` / Left Arrow | Previous view |
| `+` / `=` | Jump to Home (About) |
| `k` / Up Arrow | Scroll up |
| `j` / Down Arrow | Scroll down |

## Customization

Edit `data.json` in the project root to change the portfolio content:

```json
{
  "Contact": {
    "Name": "Your Name",
    "Title": "Your Title",
    "Email": "you@email.com"
  },
  "About": "Your bio here",
  "Skills": [],
  "Projects": [],
  "Experience": [],
  "Education": []
}
```

The file is embedded into the binary at compile time, so rebuild after making changes.

## CI/CD

A GitHub Actions workflow (`.github/workflows/release.yml`) triggers on tag pushes. It cross-compiles the application for six targets:

- Windows (amd64, arm64)
- macOS (amd64, arm64)
- Linux (amd64, arm64)

Create a release by pushing a tag:

```bash
git tag v1.0.0
git push --tags
```

Compiled binaries are attached to the GitHub release automatically.

## Dependencies

- [Bubble Tea](https://github.com/charmbracelet/bubbletea) -- Terminal UI framework (MVU pattern)
- [Lip Gloss](https://github.com/charmbracelet/lipgloss) -- Declarative terminal styling
- [Bubbles](https://github.com/charmbracelet/bubbles) -- Pre-built TUI components (viewport, spinner)
- [Wish](https://github.com/charmbracelet/wish) -- SSH server for Bubble Tea applications
- [Charm Log](https://github.com/charmbracelet/log) -- Structured logging

## License

MIT
