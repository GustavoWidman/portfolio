import {
	Brain,
	Container,
	Cpu,
	Lock,
	Server,
	Shield,
	Terminal as TerminalIcon,
} from "lucide-react";
import React from "react";
import { LuGithub } from "react-icons/lu";
import { DATA, STATIC_PROJECTS } from "@/lib/data/content";
import type { Language } from "@/lib/types";

interface ProjectsProps {
	lang: Language;
}

const Projects: React.FC<ProjectsProps> = ({ lang }) => {
	const t = DATA[lang];

	return (
		<section
			id="work"
			className="py-24 px-6 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300"
		>
			<div className="max-w-6xl mx-auto">
				<h3 className="text-xs font-mono text-zinc-500 dark:text-zinc-500 mb-24 uppercase tracking-widest">
					{t.projects.title}
				</h3>

				<div className="space-y-48">
					{STATIC_PROJECTS.map((project, index) => {
						const localizedProject = t.projects.list[index];
						return (
							<div key={project.id} className="group">
								<div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
									{/* Text Side */}
									<div
										className={`order-2 ${index % 2 === 0 ? "md:order-1" : "md:order-2"}`}
									>
										<div className="flex items-center gap-4 mb-6">
											<span className="font-mono text-zinc-400 dark:text-zinc-600 text-sm">
												0{index + 1}
											</span>
											<div className="h-px bg-zinc-200 dark:bg-zinc-900 flex-1"></div>
										</div>

										<h3 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
											{localizedProject.title}
										</h3>

										{project.githubUrl && (
											<div className="font-mono text-xs text-zinc-400 dark:text-zinc-500 mb-6 flex items-center gap-2">
												<span>
													{project.githubUrl.replace(
														"https://github.com/",
														""
													)}
												</span>
											</div>
										)}

										<p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base font-mono leading-relaxed mb-8">
											{localizedProject.description}
										</p>

										<div className="flex flex-wrap gap-2 mb-8">
											{project.tags.map((tag) => (
												<span
													key={tag}
													className="text-[10px] uppercase font-bold tracking-wide px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 rounded border border-zinc-200 dark:border-zinc-800/50"
												>
													{tag}
												</span>
											))}
										</div>

										{project.githubUrl && (
											<a
												href={project.githubUrl}
												target="_blank"
												rel="noreferrer"
												className="inline-flex items-center gap-2 text-black dark:text-white border-b border-black dark:border-white pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
											>
												<LuGithub size={18} /> {t.projects.viewSource}
											</a>
										)}
									</div>

									{/* Visual Side */}
									<div
										className={`order-1 ${index % 2 === 0 ? "md:order-2" : "md:order-1"}`}
									>
										<div className="aspect-4/3 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden relative border border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-400 dark:group-hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none">
											{/* Abstract geometric background */}
											<div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.03)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.03)_50%,rgba(0,0,0,0.03)_75%,transparent_75%,transparent)] dark:bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-size-[32px_32px] opacity-100 will-change-transform" />

											<div className="absolute inset-0 flex items-center justify-center">
												{/* Smart Icon Logic */}
												{(() => {
													if (
														project.tags.includes("Machine Learning") ||
														project.tags.includes("AI")
													) {
														return (
															<Brain className="text-zinc-200 dark:text-zinc-800 w-32 h-32" />
														);
													}
													if (
														project.tags.includes("OS Dev") ||
														project.tags.includes("Low Level")
													) {
														return (
															<Cpu className="text-zinc-200 dark:text-zinc-800 w-32 h-32" />
														);
													}
													if (project.tags.includes("Nix")) {
														return (
															<Container className="text-zinc-200 dark:text-zinc-800 w-32 h-32" />
														);
													}
													if (
														project.tags.includes("Go") ||
														project.tags.includes("Systems")
													) {
														return (
															<Server className="text-zinc-200 dark:text-zinc-800 w-32 h-32" />
														);
													}
													if (project.tags.includes("Security")) {
														return (
															<Shield className="text-zinc-200 dark:text-zinc-800 w-32 h-32" />
														);
													}
													if (project.tags.includes("Rust")) {
														return (
															<Lock className="text-zinc-200 dark:text-zinc-800 w-32 h-32" />
														);
													}
													return (
														<TerminalIcon className="text-zinc-200 dark:text-zinc-800 w-32 h-32" />
													);
												})()}
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default React.memo(Projects);
