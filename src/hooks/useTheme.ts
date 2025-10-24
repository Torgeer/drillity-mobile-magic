import { useEffect, useState } from "react";

export type Theme = "light" | "black";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("drillity-theme") as Theme;
    return stored || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "black");
    root.classList.add(theme);
    localStorage.setItem("drillity-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
