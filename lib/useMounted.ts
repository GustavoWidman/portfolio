"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const INTRO_KEY = "portfolio_intro_last_seen";
const INTRO_COOLDOWN = 2 * 60 * 60 * 1000;

function shouldSkipIntro(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get("intro") === "false") return true;

  const lastSeen = localStorage.getItem(INTRO_KEY);
  if (lastSeen && Date.now() - parseInt(lastSeen, 10) < INTRO_COOLDOWN) {
    return true;
  }

  return false;
}

function getSkipIntroSnapshot(): boolean {
  return shouldSkipIntro();
}

function getSkipIntroServerSnapshot(): boolean {
  return false;
}

export function useSkipIntro(): boolean {
  return useSyncExternalStore(
    () => () => {},
    getSkipIntroSnapshot,
    getSkipIntroServerSnapshot,
  );
}
