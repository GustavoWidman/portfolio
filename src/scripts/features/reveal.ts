/**
 * Entrance reveal. An element with `data-reveal` gets `data-in` the first time it enters
 * the viewport and is then left alone; CSS keys the start state off
 * `.js [data-reveal]:not([data-in])`.
 */
export function init(): void {
  // Tells the CSS fallback that ends the start states on its own (for a module that never
  // runs) to stand down.
  document.documentElement.classList.add("live");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute("data-in", "");
      observer.unobserve(entry.target);
    }
  });
  for (const element of document.querySelectorAll("[data-reveal]")) observer.observe(element);
}
