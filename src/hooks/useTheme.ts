import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";
const storageKey = "portfolio-theme";

function readPreference(): Theme | null {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0b0d12" : "#faf9f6");
}

export function useTheme() {
  const preference = useRef(readPreference());
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      const next = preference.current ?? (system.matches ? "dark" : "light");
      applyTheme(next);
      setTheme(next);
    };
    const syncStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) {
        preference.current = readPreference();
        syncTheme();
      }
    };
    syncTheme();
    system.addEventListener("change", syncTheme);
    window.addEventListener("storage", syncStorage);
    return () => {
      system.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    preference.current = next;
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The toggle still works when browser storage is unavailable.
    }
  }

  return { theme, toggleTheme };
}
