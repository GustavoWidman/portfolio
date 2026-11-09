/**
 * Scheduled posts: `[data-countdown]` shows a live countdown to `data-release` and reloads
 * the page once at zero.
 */
const pad = (value: number): string => String(value).padStart(2, "0");

export function init(): void {
  const timers = [...document.querySelectorAll<HTMLElement>("[data-countdown]")];
  const tick = (): void => {
    const now = Date.now();
    for (const timer of timers) {
      const release = Date.parse(timer.dataset.release ?? "");
      if (!Number.isFinite(release)) continue;
      const live = timer.querySelector<HTMLElement>("[data-countdown-live]");
      const left = Math.max(0, Math.floor((release - now) / 1000));
      const values = {
        days: Math.floor(left / 86400),
        hours: Math.floor((left % 86400) / 3600),
        minutes: Math.floor((left % 3600) / 60),
        seconds: left % 60,
      };
      for (const [unit, value] of Object.entries(values)) {
        const el = timer.querySelector(`[data-unit="${unit}"]`);
        if (el) el.textContent = pad(value);
      }
      if (live) live.hidden = false;
      if (left === 0 && timer.dataset.done === undefined) {
        timer.dataset.done = "";
        // The server switches to the next release epoch at the same instant. Reload once;
        // if the card is still here afterwards (clock skew), show a note instead.
        const key = `countdown:${release}`;
        let reloaded = false;
        try {
          reloaded = sessionStorage.getItem(key) !== null;
          if (!reloaded) sessionStorage.setItem(key, "1");
        } catch {
          reloaded = true;
        }
        if (!reloaded) {
          setTimeout(() => location.reload(), 1000);
        } else {
          const note = timer.querySelector<HTMLElement>("[data-countdown-done]");
          if (note) note.hidden = false;
        }
      }
    }
  };
  tick();
  setInterval(tick, 1000);
}
