"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const KEY = "lm_theme";

/** Runs in <head> before paint so the saved/system theme is applied with no flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Read what the head script already applied (can't be known during server render).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    // Applied synchronously; the colour change itself is eased by the .theme-fade CSS transition.
    const root = document.documentElement;
    root.classList.add("theme-fade");
    apply(next);
    window.setTimeout(() => root.classList.remove("theme-fade"), 500);
  };

  const dark = theme === "dark";
  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.85 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="relative grid size-9 place-items-center overflow-hidden rounded-xl transition hover:bg-surface"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme && (
          <motion.span
            key={theme}
            initial={{ y: 18, rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
            exit={{ y: -18, rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="grid place-items-center"
          >
            {dark ? <Moon className="size-5 fill-violet-300/30 text-violet-300" /> : <Sun className="size-5 fill-amber-300/40 text-amber-500" />}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
