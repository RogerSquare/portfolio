export const contact = {
  name: 'Roger Ochoa',
  title: 'Software Engineer',
  email: 'rog@r-that.com',
  github: 'github.com/RogerSquare',
  website: 'r-that.com',
  location: 'Houston, TX',
};

export const about =
  'Transitioning from a robust background in Systems Engineering and Infrastructure to dedicated Software Development. I leverage my deep IT experience to build efficient, automated, and scalable software solutions. Passionate about coding, I specialize in creating tools that optimize workflows, utilizing platforms like Go, React, TypeScript, and Python to solve complex problems.';

export const skills = [
  { name: 'Languages', icon: '◇', color: '#58a6ff', items: ['Go', 'Swift', 'TypeScript', 'JavaScript', 'Python', 'PowerShell'] },
  { name: 'Frontend', icon: '◆', color: '#3fb950', items: ['React', 'SwiftUI', 'Vite', 'Tailwind CSS', 'Ink'] },
  { name: 'Backend & Data', icon: '▣', color: '#da7756', items: ['Node.js', 'Express', 'SQLite', 'REST APIs', 'JWT Auth'] },
  { name: 'Infrastructure', icon: '◉', color: '#d29922', items: ['Docker', 'VDI', 'SCCM', 'HPDM', 'Git', 'CI/CD'] },
  { name: 'AI / ML', icon: '∴', color: '#bc8cff', items: ['CLIP', 'BLIP', 'ONNX Runtime', 'Auto-Tagging'] },
];

export const projects = [
  { name: 'Artifex', desc: 'Self-hosted AI image gallery with ML-powered auto-tagging, NSFW detection, and federation', tech: ['React', 'Express', 'SQLite', 'Python'], link: 'github.com/RogerSquare/Artifex' },
  { name: 'Terminal UI Showcase', desc: '30 interactive terminal UI demos exploring animations, components, and interaction patterns', tech: ['TypeScript', 'React', 'Ink'], link: 'github.com/RogerSquare/terminal-ui-showcase' },
  { name: 'Agent Task Board', desc: 'Kanban-style task management system for autonomous AI developer agents', tech: ['React', 'Node.js', 'Express'], link: 'github.com/RogerSquare/agent-task-board' },
  { name: 'Lumeo', desc: 'Native iOS app for AI image generation with GPT-4o mini prompt assistant', tech: ['Swift', 'SwiftUI', 'Replicate API'], link: 'github.com/RogerSquare/Lumeo' },
  { name: 'GameThemeMusic', desc: 'Steam Deck plugin that plays theme music on game pages via Decky Loader', tech: ['TypeScript', 'React', 'Decky API'], link: 'github.com/RogerSquare/SDH-GameThemeMusic' },
  { name: 'Terminal Portfolio', desc: 'SSH-accessible terminal portfolio built with Go and the Charm Bracelet ecosystem', tech: ['Go', 'Bubble Tea', 'Lip Gloss'], link: 'github.com/RogerSquare/portfolio' },
];

export const experience = [
  { role: 'Systems Engineer', company: 'Enterprise Infrastructure & VDI', period: '2024 - Present', desc: [
    'Architect and manage VDI infrastructure and thin client environments',
    'Develop automation scripts and workflow tools',
    'Bridge hardware infrastructure and software solutions',
  ]},
  { role: 'Senior Technical Analyst', company: 'Supply Chain / West Houston', period: '2020 - 2024', desc: [
    'Created PAR applications for inventory management',
    'Developed PowerApp email flash tool for IT leadership',
    'Supported User-Shares, Printer, and Security Servers',
  ]},
  { role: 'Technical Analyst I/II', company: 'Central Zone', period: '2018 - 2019', desc: [
    'Supported executive and administrative personnel',
    'Served as project lead coordinating with vendors',
  ]},
  { role: 'Service Desk Analyst', company: 'Gulf Coast Division', period: '2016 - 2018', desc: [
    'Maintained and created documentation',
    'Exceeded First Call Resolve and Time Availability metrics',
  ]},
];
