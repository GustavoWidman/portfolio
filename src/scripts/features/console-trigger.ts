/**
 * Serial console trigger (`[data-console-open]` and the key left of 1, backtick on US
 * layouts): enables the footer button and, on first use, loads the console chunk and the
 * tree's `console.json` (the button's `data-console-open`) in parallel.
 */
import { closest } from "../util";
import type { ConsoleData } from "../console";

let button: HTMLButtonElement;
let data: Promise<ConsoleData> | undefined;

function open(from?: HTMLElement): void {
  // Fetched once; like the chunk, the data needs the network.
  data ??= fetch(button.dataset.consoleOpen!).then(
    (response) => response.json() as Promise<ConsoleData>,
  );
  void Promise.all([import("../console"), data]).then(([console, consoleData]) =>
    console.openConsole(from, consoleData),
  );
}

export function init(): void {
  // The registry runs this only when the footer button exists.
  button = document.querySelector<HTMLButtonElement>("[data-console-open]")!;
  button.disabled = false;
  button.addEventListener("click", () => open(button));
  document.addEventListener("keydown", (event) => {
    if (
      (event.key === "`" || event.code === "Backquote") &&
      !(event.ctrlKey || event.metaKey || event.altKey) &&
      !closest(event, "input,textarea,select,dialog,[contenteditable]")
    ) {
      event.preventDefault();
      open();
    }
  });
}
