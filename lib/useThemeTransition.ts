"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";
import { flushSync } from "react-dom";

export function useThemeTransition() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback(
    async (e: React.MouseEvent) => {
      const newTheme = resolvedTheme === "light" ? "dark" : "light";

      if (
        // @ts-ignore
        !document.startViewTransition ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setTheme(newTheme);
        return;
      }

      const x = e.clientX;
      const y = e.clientY;

      // Set CSS variables for the animation
      document.documentElement.style.setProperty("--click-x", `${x}px`);
      document.documentElement.style.setProperty("--click-y", `${y}px`);

      // Disable transitions to avoid conflict with View Transitions
      document.documentElement.classList.add("disable-transitions");

      // @ts-ignore
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
        });
        // Manually toggle the class to ensure the DOM is updated for the snapshot
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else {
          document.documentElement.classList.add("light");
          document.documentElement.classList.remove("dark");
        }
      });

      // Enable transitions after the transition finishes (or fails)
      transition.finished.finally(() => {
        document.documentElement.classList.remove("disable-transitions");
        // Clean up CSS variables
        document.documentElement.style.removeProperty("--click-x");
        document.documentElement.style.removeProperty("--click-y");
      });
    },
    [resolvedTheme, setTheme],
  );

  return { theme, setTheme, resolvedTheme, toggleTheme };
}
