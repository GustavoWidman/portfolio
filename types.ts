import type React from "react";

export type Language = "en" | "pt";
export type Theme = "light" | "dark";

export interface Project {
	id: string;
	title: string; // fallback/key
	description: string; // fallback
	tags: string[];
	githubUrl?: string;
	imageUrl?: string;
}

export interface SkillCategory {
	id: string;
	icon: React.ReactNode;
	skills: { name: string; icon: React.ReactNode }[];
}

export interface Position {
	role: string; // fallback
	startDate: string; // ISO Date string YYYY-MM-DD
	endDate?: string; // ISO Date string or undefined for current
	description: string[]; // fallback
	techStack: string[];
}

export interface Experience {
	id: string;
	company: string;
	logo?: React.ReactNode;
	positions: Position[];
}

export interface LocalizedJob {
	company: string;
	positions: {
		role: string;
		description: string[];
	}[];
}
