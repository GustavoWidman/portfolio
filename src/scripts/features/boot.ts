/**
 * Boot screen (`[data-boot]`). CSS plays and dismisses the power-on self-test on its own;
 * this ends it early on any key or click, and removes `boot` from <html> when it ends so
 * what waits for it can start.
 */
export function init(): void {
  const root = document.documentElement;
  const screen = document.querySelector("[data-boot]");
  const end = (event?: Event): void => {
    if (!root.classList.contains("boot")) return;
    root.classList.remove("boot");
    // The key that skips the screen does nothing else: Space or an arrow would scroll the page.
    if (event instanceof KeyboardEvent && /^( |Arrow|Page|Home|End)/.test(event.key))
      event.preventDefault();
  };
  // The module can arrive after the sequence has already ended.
  if (screen && getComputedStyle(screen).visibility === "hidden") end();
  screen?.addEventListener("animationend", (event) => event.target === screen && end());
  // A click on the screen itself, not a pointer press: a press would drop the screen before
  // the tap's click, which would land on the link underneath. WebKit only sends a tap's click
  // to an element that listens for it.
  screen?.addEventListener("click", end);
  addEventListener("keydown", end, true);
}
