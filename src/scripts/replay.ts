/**
 * Session replay player, a chunk loaded by `features/replay.ts`. It plays a session into
 * the figure that the renderer built at rest (`src/lib/markdown/replays.ts`): commands,
 * compiler errors and the agent's own words scroll through the screen, the counters and
 * the barcode follow, and each author's note shows from its command on.
 *
 * The replay starts by itself when its screen is mostly in view (never under reduced
 * motion), pauses when it leaves and resumes when it comes back. Play/pause, the barcode
 * (a range input over it) and the list of notes take over from there.
 */
import { reducedMotion } from "./util";
import { commandAt, failedBuilds, SCREEN_LINES, schedule, sessionLines } from "./replay-model";
import type { ReplayData, ReplayLine } from "./replay-model";

/** Seconds on the last command before the result shows. */
const END_HOLD = 0.8;

/** One terminal line; the renderer builds the same markup (`lineElement` in replays.ts). */
function lineElement(line: ReplayLine): HTMLElement {
  const div = document.createElement("div");
  div.className = `rl rl--${line.kind}`;
  if (line.kind === "cmd") {
    const prompt = document.createElement("span");
    prompt.className = "rl__p";
    prompt.textContent = "$ ";
    div.append(prompt, line.text);
  } else if (line.kind === "say" && line.mark && line.text.includes(line.mark)) {
    const at = line.text.indexOf(line.mark);
    const mark = document.createElement("mark");
    mark.textContent = line.mark;
    div.append(line.text.slice(0, at), mark, line.text.slice(at + line.mark.length));
  } else {
    div.textContent = line.text;
  }
  return div;
}

export function mountReplay(figure: HTMLElement, data: ReplayData): void {
  const part = <T extends Element = HTMLElement>(name: string): T =>
    figure.querySelector<T>(`[data-replay-${name}]`)!;
  const term = part("term");
  const note = part("note");
  const end = figure.querySelector<HTMLElement>("[data-replay-end]");
  const pos = part("pos");
  const failsOut = part("fails");
  const cmdsOut = part("cmds");
  const rest = part("rest");
  const head = part("ph");
  const seek = part<HTMLInputElement>("seek");
  const button = part<HTMLButtonElement>("play");
  const noteButtons = [...figure.querySelectorAll<HTMLButtonElement>("[data-replay-at]")];
  const labels = figure.dataset;

  const count = data.events.length;
  const { lines, ends } = sessionLines(data);
  const fails = failedBuilds(data);
  const notes = noteButtons
    .map((b) => ({
      at: Number(b.dataset.replayAt),
      text: b.lastElementChild?.textContent ?? "",
      b,
    }))
    .sort((x, y) => x.at - y.at);
  const starts = schedule(
    count,
    new Set([...notes.map((n) => n.at), ...(data.quotes ?? []).map((q) => q.at)]),
  );
  const total = starts[count] + END_HOLD;
  const cache: (HTMLElement | undefined)[] = [];
  const position = (k: number): string =>
    labels.lPosition!.replace("{n}", String(k)).replace("{total}", String(count));

  let t = total;
  let shown = -1;
  let playing = false;
  let frame = 0;
  let previous = 0;
  let started = false;
  /** Paused because the figure left the viewport, not by the reader. */
  let resume = false;

  const draw = (k: number, done: boolean): void => {
    if (k !== shown) {
      shown = k;
      const from = Math.max(0, ends[k] - SCREEN_LINES);
      term.replaceChildren(
        ...lines.slice(from, ends[k]).map((line, i) => (cache[from + i] ??= lineElement(line))),
      );
      pos.textContent = position(k);
      seek.value = String(k);
      seek.setAttribute("aria-valuetext", position(k));
      failsOut.textContent = String(fails[k]);
      cmdsOut.textContent = String(k);
      rest.style.transform = `scaleX(${1 - k / count})`;
      head.style.transform = `translateX(${(k / count) * 100}%)`;
      const current = k < count ? notes.filter((n) => n.at <= k).at(-1) : undefined;
      for (const n of notes) n.b.toggleAttribute("aria-current", n === current);
      if (current) note.textContent = current.text;
      note.toggleAttribute("data-on", Boolean(current));
    }
    end?.toggleAttribute("data-on", done);
  };

  const label = (): void => {
    button.textContent = playing ? labels.lPause! : t >= total ? labels.lAgain! : labels.lPlay!;
  };

  const tick = (now: number): void => {
    t = Math.min(total, t + Math.min(0.1, (now - previous) / 1000));
    previous = now;
    draw(commandAt(starts, t), t >= total);
    if (t >= total) {
      stop();
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  function stop(): void {
    playing = false;
    cancelAnimationFrame(frame);
    label();
  }

  function play(): void {
    if (playing) return;
    if (t >= total) t = 0;
    started = true;
    playing = true;
    figure.dataset.active = "";
    previous = performance.now();
    frame = requestAnimationFrame(tick);
    label();
  }

  function seekTo(k: number, andPlay: boolean): void {
    resume = false;
    t = k === count ? total : starts[k];
    figure.dataset.active = "";
    draw(k, k === count && !andPlay);
    if (andPlay) play();
    else label();
  }

  button.addEventListener("click", () => {
    resume = false;
    if (playing) stop();
    else play();
  });
  seek.addEventListener("input", () => seekTo(Number(seek.value), playing));
  for (const n of notes) n.b.addEventListener("click", () => seekTo(n.at, true));

  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (resume || (!started && !reducedMotion())) {
          resume = false;
          if (!started) t = 0;
          play();
        }
      } else if (playing) {
        stop();
        resume = true;
      }
    },
    { threshold: 0.6 },
  ).observe(part("term"));

  for (const control of [button, seek, ...noteButtons]) control.disabled = false;
  figure.dataset.ready = "";
}
