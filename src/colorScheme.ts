import { useSyncExternalStore } from "react";

// Theme persistence, ported from the May I design system (doc/design-system.md).
// Persisted in localStorage under THEME_STORAGE_KEY; applied via data-theme on <html>.
//
// The actual pre-paint script lives inline in index.html's <head> (it has to run before
// any CSS/JS loads, so it can't import this module) and must be kept in sync with
// THEME_STORAGE_KEY below. It also honors a `?theme=light|dark` query param, which the PDF
// export route (server/src/routes/pdfExport.ts) uses to render the requested theme.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "mayi-deck-theme";

export function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing / blocked storage: theme still applies for this page view.
  }
}

function subscribeToThemeChange(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Current theme plus a toggle; persists the choice. */
export function useColorScheme() {
  const theme = useSyncExternalStore<Theme>(subscribeToThemeChange, readTheme, () => "light");
  const next: Theme = theme === "dark" ? "light" : "dark";
  return { theme, next, toggle: () => applyTheme(next) };
}
