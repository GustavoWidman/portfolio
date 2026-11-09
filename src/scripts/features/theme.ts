/**
 * Colour theme. The state is one value, `light | dark | system`: `data-theme` on <html>
 * holds an explicit choice (mirrored in localStorage `theme`) and its absence means
 * `system`. `[data-theme-toggle]` buttons flip the resolved theme.
 */
import { THEME_STORAGE_KEY } from "../../lib/config";
import { closest, store } from "../util";
import { blinkLed } from "./led";

export type Theme = "light" | "dark";
export type ThemeChoice = Theme | "system";

const root = document.documentElement;

export function themeChoice(): ThemeChoice {
  const explicit = root.dataset.theme;
  return explicit === "light" || explicit === "dark" ? explicit : "system";
}

/** The theme a choice shows; `system` follows the OS preference. */
export function resolveTheme(choice: ThemeChoice = themeChoice()): Theme {
  if (choice !== "system") return choice;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function syncButtons(): void {
  const pressed = String(resolveTheme() === "dark");
  for (const button of document.querySelectorAll<HTMLElement>("[data-theme-toggle]")) {
    button.hidden = false;
    button.setAttribute("aria-pressed", pressed);
  }
}

function apply(choice: ThemeChoice): void {
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  store(THEME_STORAGE_KEY, choice === "system" ? undefined : choice);
  syncButtons();
}

/**
 * Sets the theme choice. When the visible theme changes, the new one is revealed in a
 * circle growing from the viewport point `x`, `y` (the centre by default) where view
 * transitions exist; otherwise, and under reduced motion, the change is instant.
 */
export function setTheme(choice: ThemeChoice, x = innerWidth / 2, y = innerHeight / 2): void {
  if (resolveTheme(choice) === resolveTheme()) {
    apply(choice);
    return;
  }
  if (document.startViewTransition) {
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.dataset.vt = "theme";
    void document
      .startViewTransition(() => apply(choice))
      .finished.finally(() => delete root.dataset.vt);
  } else {
    apply(choice);
  }
  blinkLed();
}

/** The choice stored by this or another page of the site. */
function storedChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return themeChoice();
  }
}

export function init(): void {
  syncButtons();
  // Under the system choice the page follows an OS change while open; so does the button.
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncButtons);
  // A page shown again from the back/forward cache takes a choice made on another page since.
  addEventListener("pageshow", (event) => event.persisted && apply(storedChoice()));
  document.addEventListener("click", (event) => {
    const button = closest<HTMLElement>(event, "[data-theme-toggle]");
    if (!button) return;
    const next = resolveTheme() === "dark" ? "light" : "dark";
    // A keyboard activation has no pointer position; the reveal starts at the button.
    if (event.detail === 0) {
      const box = button.getBoundingClientRect();
      setTheme(next, box.left + box.width / 2, box.top + box.height / 2);
    } else {
      setTheme(next, event.clientX, event.clientY);
    }
  });
}
