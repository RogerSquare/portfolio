import { describe, it, expect } from 'vitest';
import { getData, getContact, getAbout, getSkills, getProjects, getExperience } from '../data.js';

describe('data module', () => {
  it('getData returns an object', () => {
    const data = getData();
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
    expect(data).not.toBeNull();
  });

  it('getContact returns name and email', () => {
    const contact = getContact();
    expect(contact).toHaveProperty('name');
    expect(contact).toHaveProperty('email');
    expect(typeof contact.name).toBe('string');
    expect(typeof contact.email).toBe('string');
    expect(contact.name.length).toBeGreaterThan(0);
    expect(contact.email.length).toBeGreaterThan(0);
  });

  it('getAbout returns a non-empty string', () => {
    const about = getAbout();
    expect(typeof about).toBe('string');
    expect(about.length).toBeGreaterThan(0);
  });

  it('getSkills returns an array with items', () => {
    const skills = getSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(0);
  });

  it('getProjects returns an array with items', () => {
    const projects = getProjects();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it('each project has name, desc, tech, and link fields', () => {
    const projects = getProjects();
    for (const project of projects) {
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('desc');
      expect(project).toHaveProperty('tech');
      expect(project).toHaveProperty('link');
      expect(typeof project.name).toBe('string');
      expect(typeof project.desc).toBe('string');
      expect(Array.isArray(project.tech)).toBe(true);
      expect(typeof project.link).toBe('string');
    }
  });

  it('getExperience returns an array', () => {
    const experience = getExperience();
    expect(Array.isArray(experience)).toBe(true);
    expect(experience.length).toBeGreaterThan(0);
  });

  it('each skill has name and items fields', () => {
    const skills = getSkills();
    for (const skill of skills) {
      expect(skill).toHaveProperty('name');
      expect(skill).toHaveProperty('items');
      expect(typeof skill.name).toBe('string');
      expect(Array.isArray(skill.items)).toBe(true);
      expect(skill.items.length).toBeGreaterThan(0);
    }
  });

  it('getData contains all top-level keys', () => {
    const data = getData();
    expect(data).toHaveProperty('contact');
    expect(data).toHaveProperty('about');
    expect(data).toHaveProperty('skills');
    expect(data).toHaveProperty('projects');
    expect(data).toHaveProperty('experience');
  });
});
