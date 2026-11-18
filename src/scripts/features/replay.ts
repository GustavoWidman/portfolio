/**
 * Session replays (`figure[data-replay]`): when a figure comes within a screen of the
 * viewport, loads the player chunk and the figure's data (its `data-replay` URL) in
 * parallel and mounts the player. Until then, and if either fails to load, the figure keeps
 * the end of the session that the page was built with.
 */
import type { ReplayData } from "../replay-model";

export function init(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const figure = entry.target as HTMLElement;
        const data = fetch(figure.dataset.replay!).then((response) => {
          if (!response.ok) throw new Error(response.statusText);
          return response.json() as Promise<ReplayData>;
        });
        Promise.all([import("../replay"), data]).then(
          ([player, replay]) => player.mountReplay(figure, replay),
          () => {},
        );
      }
    },
    { rootMargin: "100% 0px" },
  );
  for (const figure of document.querySelectorAll("figure[data-replay]")) observer.observe(figure);
}
