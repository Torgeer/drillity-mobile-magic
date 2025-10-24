import { useEffect, useState } from "react";

export type Theme = "dark" | "gray" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("drillity-theme") as Theme;
    return stored || "gray";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "gray", "light");
    root.classList.add(theme);
    localStorage.setItem("drillity-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
