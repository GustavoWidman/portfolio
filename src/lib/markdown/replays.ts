import postReplays from "virtual:post-replays";
import type { Element, ElementContent, Properties, Root } from "hast";

import { failedBuilds, SCREEN_LINES, sessionLines } from "../../scripts/replay-model";
import type { ReplayData, ReplayLine } from "../../scripts/replay-model";
import type { ReplayAsset, ReplayBlock } from "./replay-refs";

export interface ReplayLabels {
  play: string;
  pause: string;
  again: string;
  /** Position template with `{n}` and `{total}`. */
  position: string;
  seek: string;
  failed: string;
  commands: string;
  minutes: string;
  passed: string;
  notes: string;
}

function h(tagName: string, properties: Properties, children: ElementContent[] = []): Element {
  return { type: "element", tagName, properties, children };
}

const text = (value: string): ElementContent => ({ type: "text", value });

/** One terminal line as HAST; the player builds the same markup in `src/scripts/replay.ts`. */
export function lineElement(line: ReplayLine): Element {
  if (line.kind === "cmd") {
    return h("div", { className: ["rl", "rl--cmd"] }, [
      h("span", { className: ["rl__p"] }, [text("$ ")]),
      text(line.text),
    ]);
  }
  if (line.kind === "err") return h("div", { className: ["rl", "rl--err"] }, [text(line.text)]);
  const at = line.mark ? line.text.indexOf(line.mark) : -1;
  const children: ElementContent[] =
    at < 0
      ? [text(line.text)]
      : [
          text(line.text.slice(0, at)),
          h("mark", {}, [text(line.mark!)]),
          text(line.text.slice(at + line.mark!.length)),
        ];
  return h("div", { className: ["rl", "rl--say"] }, children);
}

/** Barcode of the session: a short tick per command, a full one per failed build, notes above. */
function barcode(data: ReplayData, notes: ReplayBlock["notes"]): Element {
  const count = data.events.length;
  let ok = "";
  let failed = "";
  data.events.forEach((event, i) => {
    if (event.f) failed += `M${i + 0.5} 4V16`;
    else ok += `M${i + 0.5} 11V16`;
  });
  const marks = notes.map((note) => `M${note.at - 0.5} 0V2.5`).join("");
  return h(
    "svg",
    {
      className: ["replay__bars"],
      viewBox: `0 0 ${count} 16`,
      preserveAspectRatio: "none",
      ariaHidden: "true",
      focusable: "false",
    },
    [
      h("path", { className: ["replay__ok"], d: ok }),
      h("path", { className: ["replay__fail"], d: failed }),
      ...(marks ? [h("path", { className: ["replay__marks-t"], d: marks })] : []),
    ],
  );
}

function stat(value: string, label: string, attr?: string): Element {
  return h("div", {}, [
    h("dt", {}, [text(label)]),
    h("dd", attr ? { [attr]: "" } : {}, [text(value)]),
  ]);
}

/** The figure at rest: the end of the session, its result and every note, without script. */
export function replayFigure(
  asset: ReplayAsset,
  block: ReplayBlock,
  labels: ReplayLabels,
): Element {
  const { data } = asset;
  const count = data.events.length;
  for (const note of block.notes) {
    if (note.at < 1 || note.at > count) {
      throw new Error(`${block.path}: note at ${note.at} is outside the session (1–${count})`);
    }
  }
  const { lines, ends } = sessionLines(data);
  const fails = failedBuilds(data)[count];
  const rest = lines.slice(Math.max(0, ends[count] - SCREEN_LINES)).map(lineElement);
  const position = labels.position.replace("{n}", String(count)).replace("{total}", String(count));

  const screen = h("div", { className: ["replay__screen"] }, [
    h("p", { className: ["replay__note"], dataReplayNote: "" }),
    h("div", { className: ["replay__term"], dataReplayTerm: "" }, rest),
    ...(data.result
      ? [
          h("div", { className: ["replay__end"], dataReplayEnd: "" }, [
            h("span", { className: ["replay__end-v"] }, [
              text(String(data.result.passed)),
              h("small", {}, [text(`/${data.result.total}`)]),
            ]),
            h("span", { className: ["replay__end-l"] }, [text(labels.passed)]),
          ]),
        ]
      : []),
  ]);

  const track = h("div", { className: ["replay__track"] }, [
    barcode(data, block.notes),
    h("span", { className: ["replay__rest"], dataReplayRest: "" }),
    h("span", { className: ["replay__ph"], dataReplayPh: "" }),
    h("input", {
      className: ["replay__seek"],
      type: "range",
      min: "0",
      max: String(count),
      step: "1",
      value: String(count),
      ariaLabel: labels.seek,
      ariaValuetext: position,
      disabled: true,
      dataReplaySeek: "",
    }),
  ]);

  const bar = h("div", { className: ["replay__bar"] }, [
    h(
      "button",
      { type: "button", className: ["replay__play"], disabled: true, dataReplayPlay: "" },
      [text(labels.again)],
    ),
    h("dl", { className: ["replay__stats"] }, [
      stat(String(fails), labels.failed, "dataReplayFails"),
      stat(String(count), labels.commands, "dataReplayCmds"),
      ...(data.minutes ? [stat(String(Math.round(data.minutes)), labels.minutes)] : []),
    ]),
  ]);

  const notes = block.notes.length
    ? [
        h(
          "ol",
          { className: ["replay__notes"], ariaLabel: labels.notes },
          block.notes.map((note) =>
            h("li", {}, [
              h("button", { type: "button", disabled: true, dataReplayAt: note.at }, [
                h("span", { className: ["replay__at"] }, [text(String(note.at))]),
                h("span", {}, [text(note.text)]),
              ]),
            ]),
          ),
        ),
      ]
    : [];

  return h(
    "figure",
    {
      className: ["replay"],
      dataReplay: asset.url,
      dataReplayN: count,
      dataLPlay: labels.play,
      dataLPause: labels.pause,
      dataLAgain: labels.again,
      dataLPosition: labels.position,
    },
    [
      h("div", { className: ["replay__head"] }, [
        h("span", { className: ["replay__meta"] }, [text(data.meta.join(" · "))]),
        h("span", { className: ["replay__pos"], dataReplayPos: "" }, [text(position)]),
      ]),
      screen,
      track,
      bar,
      ...notes,
      ...(block.caption ? [h("figcaption", {}, [text(block.caption)])] : []),
    ],
  );
}

/**
 * Replaces every replay placeholder (`figure[data-replay-src]`, from `render.ts`) with the
 * figure at rest. The block's caption and notes ride on the placeholder's `data.replay`.
 */
export function resolveReplays(tree: Root, labels: ReplayLabels): void {
  const assets = postReplays as Record<string, ReplayAsset | undefined>;
  const visit = (parent: Root | Element): void => {
    const children = parent.children as ElementContent[];
    children.forEach((child, i) => {
      if (child.type !== "element") return;
      const block = (child.data as { replay?: ReplayBlock } | undefined)?.replay;
      if (block) {
        const asset = assets[block.path];
        if (!asset) throw new Error(`Replay not found: ${block.path}`);
        children[i] = replayFigure(asset, block, labels);
        return;
      }
      visit(child);
    });
  };
  visit(tree);
}
