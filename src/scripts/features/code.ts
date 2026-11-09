/**
 * Code listings: `[data-copy-code]` copies the code of its `figure.code-block`, shows the
 * copied label with `data-copied` for two seconds and blinks the header LED.
 */
import { closest } from "../util";
import { blinkLed } from "./led";

async function copyCode(button: HTMLButtonElement): Promise<void> {
  const code = button.closest(".code-block")?.querySelector("pre")?.textContent ?? "";
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    return;
  }
  blinkLed();
  if (button.dataset.copied !== undefined) return;
  const label = button.textContent;
  button.textContent = button.dataset.copiedLabel ?? label;
  button.dataset.copied = "";
  setTimeout(() => {
    button.textContent = label;
    delete button.dataset.copied;
  }, 2000);
}

export function init(): void {
  document.addEventListener("click", (event) => {
    const button = closest<HTMLButtonElement>(event, "[data-copy-code]");
    if (button) void copyCode(button);
  });
}
