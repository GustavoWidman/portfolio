/**
 * Serial console: a modal panel with a small shell, loaded on first open by
 * `features/console-trigger.ts`, which fetches its data (the tree's `console.json`, written
 * by `lib/machine/console.ts`) at the same time and hands it to `openConsole`. The panel is
 * built here, so pages carry no console markup.
 */
import css from "../styles/console.css?inline";

import { BOOT_COOKIE, isLanguage } from "../lib/config";
import { blinkLed } from "./features/led";
import { cookieDomain, switchLanguage } from "./features/language";
import { resolveTheme, setTheme } from "./features/theme";
import { reducedMotion } from "./util";
import type { Dictionary } from "../i18n";
import type { Language } from "../lib/config";

export interface ConsoleData {
  lang: Language;
  /** `user@host` shown before the cursor. */
  prompt: string;
  home: string;
  blog: string;
  cv: Record<Language, string>;
  /** About the author, one line each. */
  whoami: string[];
  version: [key: string, value: string][];
  exp: [period: string, role: string, company: string][];
  work: [name: string, summary: string][];
  /** Released posts, newest first. */
  posts: [slug: string, date: string, title: string, href: string][];
  text: Dictionary["console"];
}

/** `closed` until first opened; `panic` is terminal: it ends in a navigation. */
type State = "closed" | "open" | "panic";

type Tone = "cmd" | "dim" | "err";

interface Command {
  usage?: string;
  run(args: string[]): void;
}

// Set by the first `openConsole`, before anything reads them.
let data: ConsoleData;
let text: ConsoleData["text"];
const root = document.documentElement;

let state: State = "closed";
let opener: HTMLElement | null = null;
const history: string[] = [];
/** Index into `history`; `history.length` is the line being typed. */
let cursor = 0;
let draft = "";

const fmt = (template: string, ...args: string[]): string =>
  template.replace(/\{(\d)\}/g, (_, i: string) => args[Number(i)] ?? "");

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const { class: className, ...rest } = props;
  if (className) el.className = className;
  Object.assign(el, rest);
  el.append(...children);
  return el;
}

const style = h("style", { textContent: css });
const led = h("span", { class: "con__led" });
const out = h("div", { class: "con__out", role: "log", tabIndex: -1 });
const input = h("input", {
  class: "con__in",
  id: "con-in",
  type: "text",
  autocomplete: "off",
  spellcheck: false,
  enterKeyHint: "send",
});
const form = h(
  "form",
  { class: "con__line" },
  h(
    "label",
    { class: "con__prompt", htmlFor: "con-in" },
    h("span", { ariaHidden: "true" }),
    h("span", { class: "visually-hidden" }),
  ),
  input,
);
const closeButton = h("button", { class: "con__close", type: "button" }, "esc");
const title = h("h2", { class: "con__title", id: "con-title" });
const host = h("span", { class: "con__host" });
const dialog = h(
  "dialog",
  { class: "con" },
  h("div", { class: "con__bar" }, led, title, host, closeButton),
  out,
  form,
);
dialog.setAttribute("aria-labelledby", "con-title");
dialog.setAttribute("closedby", "any");
input.setAttribute("autocapitalize", "off");
input.setAttribute("autocorrect", "off");

function print(line: string | (Node | string)[], tone?: Tone): void {
  const row = h("div", { class: tone ? `con__row con__row--${tone}` : "con__row" });
  row.append(...(typeof line === "string" ? [line] : line));
  out.append(row);
  out.scrollTop = out.scrollHeight;
}

/**
 * Rows of cells on a grid: every column but the last as wide as its widest cell, the last
 * one wrapping. The spaces between cells only matter when the text is copied.
 */
function table(rows: (string | Node)[][]): void {
  const grid = h("div", { class: "con__tbl" });
  grid.style.gridTemplateColumns = `${"max-content ".repeat((rows[0]?.length ?? 1) - 1)}minmax(0, 1fr)`;
  for (const row of rows) {
    const tr = h("div", { class: "con__tr" });
    row.forEach((cell, i) => tr.append(...(i ? [" "] : []), h("span", {}, cell)));
    grid.append(tr);
  }
  out.append(grid);
  out.scrollTop = out.scrollHeight;
}

function blink(): void {
  blinkLed();
  led.removeAttribute("data-blink");
  void led.offsetWidth;
  led.setAttribute("data-blink", "");
}

function go(href: string): void {
  print(fmt(text.opening, href), "dim");
  location.assign(href);
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, reducedMotion() ? 0 : ms));

async function panic(): Promise<void> {
  state = "panic";
  input.readOnly = true;
  root.dataset.panic = "";
  for (const line of text.panic) {
    print(line, "err");
    blink();
    await sleep(170);
  }
  await sleep(700);
  document.cookie = `${BOOT_COOKIE}=;path=/;max-age=0${cookieDomain()}`;
  location.assign(data.home);
}

/** Every command. `help` lists the ones that have a summary, in this order. */
const COMMANDS: Record<string, Command> = {
  help: {
    run: () => {
      print(`${text.commands}:`, "dim");
      table(
        Object.entries(COMMANDS)
          .filter(([name]) => name in text.summaries)
          .map(([name, command]) => {
            const button = h("button", { class: "con__cmd", type: "button" }, name);
            button.dataset.run = name;
            const args = command.usage?.slice(name.length + 1);
            const summary = text.summaries[name as keyof typeof text.summaries];
            return [
              button,
              args
                ? h("span", {}, `${summary} `, h("span", { class: "con__args" }, args))
                : summary,
            ];
          }),
      );
    },
  },
  whoami: {
    run: () => {
      print(text.you);
      table(data.whoami.map((line, i) => [i === 0 ? text.host : "", line]));
    },
  },
  ls: {
    usage: "ls [blog]",
    run: ([target]) => {
      if (target === "blog" || target === "blog/") {
        table(data.posts.map(([slug, date, , href]) => [date, h("a", { href }, slug)]));
      } else if (target === undefined || target.startsWith("-")) {
        table(data.work);
      } else {
        print(fmt(text.noFile, target), "err");
      }
    },
  },
  exp: {
    run: () => table(data.exp.map(([period, role, company]) => [period, `${role}, ${company}`])),
  },
  cv: {
    usage: "cv en|pt",
    run: ([lang]) => {
      if (!isLanguage(lang)) return print(fmt(text.usage, "cv en|pt"), "err");
      print(fmt(text.opening, data.cv[lang]), "dim");
      window.open(data.cv[lang], "_blank", "noopener");
    },
  },
  blog: { run: () => go(data.blog) },
  open: {
    usage: "open <slug>",
    run: ([slug]) => {
      if (!slug) return print(fmt(text.usage, "open <slug>"), "err");
      const post = data.posts.find(([s]) => s === slug);
      if (!post) return print(fmt(text.noPost, slug), "err");
      go(post[3]);
    },
  },
  theme: {
    usage: "theme [light|dark|system]",
    run: ([choice]) => {
      if (choice !== undefined && choice !== "light" && choice !== "dark" && choice !== "system") {
        return print(fmt(text.usage, "theme [light|dark|system]"), "err");
      }
      setTheme(choice ?? (resolveTheme() === "dark" ? "light" : "dark"));
      print(fmt(text.theme, choice ?? resolveTheme()));
    },
  },
  lang: {
    usage: "lang en|pt",
    run: ([lang]) => {
      if (!isLanguage(lang)) {
        print(fmt(text.language, data.lang));
        return print(fmt(text.usage, "lang en|pt"), "dim");
      }
      print(fmt(text.language, lang));
      if (lang !== data.lang) switchLanguage(lang);
    },
  },
  version: { run: () => table(data.version) },
  clear: { run: () => out.replaceChildren() },
  sudo: { run: () => print(text.sudo, "err") },
  rm: {
    run: (args) => {
      const flags = args.filter((arg) => arg.startsWith("-")).join("");
      const targets = args.filter((arg) => !arg.startsWith("-"));
      if (targets.includes("/") && flags.includes("r") && flags.includes("f")) void panic();
      else if (targets.length === 0) print(text.missingOperand, "err");
      else print(fmt(text.readOnly, targets[0]), "err");
    },
  },
  exit: { run: () => dialog.close() },
};

function exec(line: string): void {
  if (state !== "open") return;
  print(
    [h("span", { class: "con__prompt", ariaHidden: "true" }, `${data.prompt}:~$ `), line],
    "cmd",
  );
  const trimmed = line.trim();
  if (trimmed !== "" && history.at(-1) !== trimmed) history.push(trimmed);
  cursor = history.length;
  draft = "";
  if (trimmed === "") return;
  blink();
  const [name = "", ...args] = trimmed.split(/\s+/);
  const command = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;
  if (command) command.run(args);
  else print(fmt(text.notFound, name), "err");
}

/** Completes a command name, or a slug after `open`, when exactly one candidate matches. */
function complete(value: string): string | undefined {
  const match = /^(\s*open\s+)(\S*)$/.exec(value);
  const [prefix, word, pool] = match
    ? [match[1], match[2], data.posts.map(([slug]) => slug)]
    : ["", value.trimStart(), Object.keys(COMMANDS).filter((name) => name in text.summaries)];
  if (/\s/.test(word)) return undefined;
  const found = pool.filter((candidate) => candidate.startsWith(word));
  return found.length === 1 ? `${prefix}${found[0]} ` : undefined;
}

function recall(step: -1 | 1): void {
  if (history.length === 0) return;
  if (cursor === history.length) draft = input.value;
  cursor = Math.min(history.length, Math.max(0, cursor + step));
  input.value = cursor === history.length ? draft : (history[cursor] ?? "");
  input.setSelectionRange(input.value.length, input.value.length);
}

/** Keeps the panel above an on-screen keyboard, which shrinks the visual viewport only. */
function fitViewport(): void {
  const view = visualViewport;
  if (!view) return;
  const covered = Math.max(0, innerHeight - view.height - view.offsetTop);
  dialog.style.setProperty("--kb", `${covered}px`);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const line = input.value;
  input.value = "";
  exec(line);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    recall(event.key === "ArrowUp" ? -1 : 1);
  } else if (event.key === "Tab" && !event.shiftKey) {
    const completed = complete(input.value);
    if (completed !== undefined) {
      event.preventDefault();
      input.value = completed;
    }
  } else if (event.ctrlKey && event.key === "l") {
    event.preventDefault();
    out.replaceChildren();
  } else if (event.ctrlKey && event.key === "c" && input.selectionStart === input.selectionEnd) {
    event.preventDefault();
    print(
      [
        h("span", { class: "con__prompt", ariaHidden: "true" }, `${data.prompt}:~$ `),
        `${input.value}^C`,
      ],
      "cmd",
    );
    input.value = "";
    cursor = history.length;
  }
});

dialog.addEventListener("click", (event) => {
  if (state !== "open") return;
  const target = event.target instanceof Element ? event.target : null;
  const run = target?.closest<HTMLElement>("[data-run]")?.dataset.run;
  if (run !== undefined) {
    const usage = COMMANDS[run]?.usage;
    if (usage && !usage.includes("[")) {
      input.value = `${run} `;
      input.focus();
    } else {
      exec(run);
      input.focus();
    }
  } else if (target === closeButton) {
    dialog.close();
  } else if (target === dialog) {
    // A click on the backdrop lands on the dialog itself, outside its box.
    const box = dialog.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    if (x < box.left || x > box.right || y < box.top || y > box.bottom) dialog.close();
  } else if (target === out && getSelection()?.isCollapsed) {
    input.focus();
  }
});

dialog.addEventListener("cancel", (event) => {
  if (state === "panic") event.preventDefault();
});

dialog.addEventListener("close", () => {
  if (state === "panic") return;
  state = "closed";
  visualViewport?.removeEventListener("resize", fitViewport);
  visualViewport?.removeEventListener("scroll", fitViewport);
  opener?.focus();
  opener = null;
});

/** Opens the console; focus returns to `from` (or what had focus) when it closes. */
export function openConsole(from: HTMLElement | undefined, consoleData: ConsoleData): void {
  if (state !== "closed") return;
  if (!dialog.isConnected) {
    data = consoleData;
    text = data.text;
    const [prompt, inputLabel] = form.querySelectorAll("label > span");
    prompt.textContent = `${data.prompt}:~$`;
    inputLabel.textContent = text.input;
    closeButton.ariaLabel = text.close;
    title.textContent = text.title;
    host.textContent = data.prompt.split("@")[1] ?? "";
    document.head.append(style);
    document.body.append(dialog);
    print(text.hint, "dim");
  }
  opener = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  state = "open";
  visualViewport?.addEventListener("resize", fitViewport);
  visualViewport?.addEventListener("scroll", fitViewport);
  fitViewport();
  dialog.showModal();
  input.focus();
  blink();
}
