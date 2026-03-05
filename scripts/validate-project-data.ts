import { existsSync } from "node:fs";
import { join } from "node:path";
import { STATIC_PROJECTS } from "../lib/data/content";

const BLOG_ROOT = join(process.cwd(), "blog");

const cyan = "\x1b[36m";
const green = "\x1b[32m";
const magenta = "\x1b[35m";
const red = "\x1b[31m";
const bold = "\x1b[1m";
const italic = "\x1b[3m";
const reset = "\x1b[0m";

function logHeader() {
  console.log(`\n${bold}${cyan}validate-project-data.ts${reset}\n`);
}

function logSection(name: string, isLast: boolean) {
  const prefix = isLast ? "└" : "├";
  console.log(`${prefix} ${name}...`);
}

function logItem(
  name: string,
  status: "success" | "error",
  details?: string,
  isLastSection: boolean = false,
  isLastItem: boolean = false,
) {
  const prefix = isLastSection ? " " : "│";
  const branch = isLastItem ? "└" : "├";
  const statusIcon = status === "success" ? `${green}✓${reset}` : `${red}✗${reset}`;
  const formattedName = `${italic}${magenta}${name}${reset}`;

  console.log(`${prefix}  ${branch} ${statusIcon} ${formattedName}${details ? ` ${bold}(${details})${reset}` : ""}`);
}

function logError(message: string, isLastSection: boolean = false, isLastItem: boolean = false) {
  const prefix = isLastSection ? " " : "│";
  const branch = isLastItem ? "└" : "├";
  console.log(`${prefix}  ${branch} ${red}${message}${reset}`);
}

async function validateProjects() {
  logHeader();

  const totalProjects = STATIC_PROJECTS.length;
  let hasErrors = false;
  let validatedCount = 0;

  for (let i = 0; i < STATIC_PROJECTS.length; i++) {
    const project = STATIC_PROJECTS[i];
    const isLastProject = i === STATIC_PROJECTS.length - 1;

    logSection(project.title, isLastProject);

    let projectHasError = false;

    if (project.blogPostSlug) {
      const blogPostPath = join(BLOG_ROOT, project.blogPostSlug);
      if (!existsSync(blogPostPath)) {
        logItem(`blogPostSlug`, "error", project.blogPostSlug, isLastProject, true);
        logError(`Path not found: ${blogPostPath}`, isLastProject, false);
        hasErrors = true;
        projectHasError = true;
      } else {
        logItem(`blogPostSlug`, "success", project.blogPostSlug, isLastProject, true);
      }
    }

    if (!projectHasError) {
      validatedCount++;
    }
  }

  console.log("");

  if (hasErrors) {
    console.error(`${red}${bold}✗ Validation failed${reset} ${bold}(${validatedCount}/${totalProjects} passed)${reset}\n`);
    process.exit(1);
  }

  console.log(`${green}${bold}✓ All project data validated${reset} ${bold}(${validatedCount}/${totalProjects})${reset}\n`);
}

validateProjects().catch((error) => {
  console.error(`\n${red}${bold}✗ Validation script failed:${reset}`, error, "\n");
  process.exit(1);
});
