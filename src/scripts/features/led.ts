/**
 * Header LED (`[data-led]`). It breathes in CSS; setting `data-blink` plays one short blink
 * that confirms an action, after which the breathing resumes.
 */
const PENDING_KEY = "led";

/** Blinks the header LED once. */
export function blinkLed(): void {
  const el = document.querySelector<HTMLElement>("[data-led]");
  if (!el) return;
  // Removing the attribute and reading layout restarts the animation of an earlier blink.
  el.removeAttribute("data-blink");
  void el.offsetWidth;
  el.setAttribute("data-blink", "");
}

/** Blinks the LED on the next page of this tab, for actions that end in a navigation. */
export function blinkLedOnNextPage(): void {
  try {
    sessionStorage.setItem(PENDING_KEY, "1");
  } catch {
    // Without storage the next page simply does not blink.
  }
}

export function init(): void {
  try {
    if (sessionStorage.getItem(PENDING_KEY) === null) return;
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    return;
  }
  blinkLed();
}
