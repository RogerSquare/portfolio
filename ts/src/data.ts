// Portfolio data -- loaded from data.json at runtime.
// In production, set CAIRN_DATA_DIR to a path outside the repo
// (e.g. /var/lib/cairn) so admin edits survive git pulls.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_TS_DIR = join(__dirname, '..');
const DATA_DIR = process.env.CAIRN_DATA_DIR || REPO_TS_DIR;
const DATA_PATH = join(DATA_DIR, 'data.json');
const SEED_PATH = join(REPO_TS_DIR, 'data.example.json');

// First-boot seed: if data.json is missing, copy from the committed template.
if (!existsSync(DATA_PATH)) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (existsSync(SEED_PATH)) {
    copyFileSync(SEED_PATH, DATA_PATH);
    console.log(`[data] Seeded ${DATA_PATH} from ${SEED_PATH}`);
  } else {
    throw new Error(`No data.json at ${DATA_PATH} and no seed at ${SEED_PATH}`);
  }
}

interface Contact { name: string; title: string; email: string; github: string; website: string; location: string; }
interface Skill { name: string; items: string[]; }
interface Project { name: string; desc: string; tech: string[]; link: string; }
interface Experience { role: string; company: string; period: string; desc: string[]; }
interface PortfolioData { contact: Contact; about: string; skills: Skill[]; projects: Project[]; experience: Experience[]; }

function loadData(): PortfolioData {
  return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
}

// Re-read on every access so changes reflect without restart
export function getData() {
  return loadData();
}

// Convenience exports that re-read each time
// For SSH (loaded once per connection), this is fine
// For web (loaded per request), also fine
const initial = loadData();

export const contact = initial.contact;
export const about = initial.about;
export const aboutWeb = initial.about;
export const skills = initial.skills;
export const projects = initial.projects;
export const experience = initial.experience;

// For dynamic access (web server uses this)
export function getContact(): Contact { return loadData().contact; }
export function getAbout(): string { return loadData().about; }
export function getSkills(): Skill[] { return loadData().skills; }
export function getProjects(): Project[] { return loadData().projects; }
export function getExperience(): Experience[] { return loadData().experience; }

// Save updated data
export function saveData(data: any) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export { DATA_PATH };
