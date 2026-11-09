/**
 * Cursor of the hero scope. It snaps to the nearest percentile under the pointer, or moves
 * with the arrow keys while the plot has focus. Everything it needs is in the figure's
 * markup: the percentile columns carry their position, and each column has a readout panel.
 */
function attach(scope: HTMLElement): void {
  const plot = scope.querySelector<HTMLElement>(".scope__plot");
  const area = scope.querySelector<HTMLElement>(".scope__area");
  const status = scope.querySelector<HTMLElement>("[data-scope-status]");
  if (!plot || !area || !status) return;

  const xs = [...scope.querySelectorAll<HTMLElement>(".sc-cur")].map((column) =>
    Number(column.dataset.x),
  );
  const last = xs.length - 1;
  let current = last;

  const mark = (index: number): void => {
    for (const element of scope.querySelectorAll<HTMLElement>("[data-i]")) {
      element.toggleAttribute("data-on", Number(element.dataset.i) === index);
    }
  };

  const show = (index: number, announce = false): void => {
    current = index;
    scope.setAttribute("data-active", "");
    mark(index);
    if (!announce) return;
    const panel = scope.querySelector(`.sc-panel[data-i="${index}"]`);
    status.textContent = [...(panel?.children ?? [])].map((row) => row.textContent).join(". ");
  };

  const reset = (): void => {
    scope.removeAttribute("data-active");
    mark(last);
  };

  const nearest = (clientX: number): number => {
    const box = area.getBoundingClientRect();
    const at = ((clientX - box.left) / box.width) * 100;
    return xs.reduce((best, x, i) => (Math.abs(x - at) < Math.abs(xs[best] - at) ? i : best), 0);
  };

  const point = (event: PointerEvent): void => show(nearest(event.clientX));

  plot.addEventListener("pointermove", point);
  plot.addEventListener("pointerdown", point);
  plot.addEventListener("pointerleave", (event) => event.pointerType === "mouse" && reset());
  plot.addEventListener("focus", () => plot.matches(":focus-visible") && show(last, true));
  plot.addEventListener("blur", reset);
  plot.addEventListener("keydown", (event) => {
    if (event.key === "Escape") return reset();
    const target: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in target)) return;
    event.preventDefault();
    show(Math.min(last, Math.max(0, target[event.key])), true);
  });
}

for (const scope of document.querySelectorAll<HTMLElement>("[data-scope]")) attach(scope);
