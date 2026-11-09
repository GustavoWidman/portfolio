/**
 * The site's only deferred module: a registry of features. Each entry is a selector and
 * the `init` of one feature module, which runs only when the page contains a match, so a
 * feature costs nothing on pages without its elements. Features own their elements and
 * talk to each other through exported functions, never through each other's DOM.
 */
import { init as boot } from "./features/boot";
import { init as code } from "./features/code";
import { init as consoleTrigger } from "./features/console-trigger";
import { init as countdown } from "./features/countdown";
import { init as language } from "./features/language";
import { init as led } from "./features/led";
import { init as reveal } from "./features/reveal";
import { init as theme } from "./features/theme";

const FEATURES: readonly (readonly [selector: string, init: () => void])[] = [
  ["[data-theme-toggle]", theme],
  ["a[data-lang-switch]", language],
  ["[data-led]", led],
  ["[data-reveal]", reveal],
  ["[data-boot]", boot],
  ["[data-copy-code]", code],
  ["[data-countdown]", countdown],
  ["[data-console-open]", consoleTrigger],
];

for (const [selector, init] of FEATURES) {
  if (document.querySelector(selector)) init();
}
