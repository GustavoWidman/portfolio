/**
 * Count-up of the readouts: each `[data-readout]` counts from zero to its number once in
 * view, after the boot screen. The markup holds the final text, the number and its fraction
 * digits as data attributes; the final text is put back at the end, so the value shown never
 * depends on rounding in this loop. A readout of zero has nothing to count.
 */
const DURATION = 900;
const STAGGER = 60;

const root = document.documentElement;

function bootEnded(): Promise<void> {
  return new Promise((resolve) => {
    if (!root.classList.contains("boot")) return resolve();
    new MutationObserver((_, observer) => {
      if (root.classList.contains("boot")) return;
      observer.disconnect();
      resolve();
    }).observe(root, { attributeFilter: ["class"] });
  });
}

async function countUp(): Promise<void> {
  await bootEnded();
  const nodes = [...document.querySelectorAll<HTMLElement>("[data-readout]")];
  const finals = nodes.map((node) => node.textContent ?? "");
  const format = (node: HTMLElement, value: number): string => {
    const digits = Number(node.dataset.dp);
    return value.toLocaleString(root.lang, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const node = entry.target as HTMLElement;
      const index = nodes.indexOf(node);
      const to = Number(node.dataset.to);
      const begin = performance.now() + index * STAGGER;
      const tick = (now: number): void => {
        const t = Math.min(1, Math.max(0, (now - begin) / DURATION));
        node.textContent = t < 1 ? format(node, to * (1 - (1 - t) ** 3)) : finals[index];
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });

  for (const node of nodes) {
    node.setAttribute("data-ready", "");
    if (Number(node.dataset.to) === 0) continue;
    node.textContent = format(node, 0);
    observer.observe(node);
  }
}

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) void countUp();
