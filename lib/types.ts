import type { ReactNode } from "react";

export type Language = "en" | "pt";

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  imageUrl?: string;
}

export interface SkillCategory {
  id: string;
  icon: ReactNode;
  skills: { name: string; icon: ReactNode }[];
}

export interface Position {
  role: string;
  startDate: string;
  endDate?: string;
  description: string[];
  techStack: string[];
}

export interface Experience {
  id: string;
  company: string;
  logo?: ReactNode;
  positions: Position[];
}

export interface LocalizedJob {
  company: string;
  positions: {
    role: string;
    description: string[];
  }[];
}

export interface TranslationData {
  nav: Record<string, string>;
  hero: {
    subtitle: string;
    title1: string;
    title2: string;
    desc: string;
    cta: string;
    github: string;
    resume: string;
  };
  about: {
    title: string;
    openToWork: string;
    heading: ReactNode;
    p1: ReactNode;
    p2: ReactNode;
    p3: ReactNode;
  };
  stack: { title: string; categories: { title: string; description: string }[] };
  experience: { title: string; present: string; jobs: LocalizedJob[] };
  projects: {
    title: string;
    viewSource: string;
    list: { id: string; title: string; description: string }[];
  };
  footer: {
    title: string;
    subtitle: string;
    email: string;
    linkedin: string;
    resume: string;
  };
}
