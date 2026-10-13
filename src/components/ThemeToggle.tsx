import { Moon, Sun } from "lucide-react";
import { useColorScheme } from "../colorScheme";

/** Sun/Moon icon button in the deck header; switches between the light and dark themes. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, next, toggle } = useColorScheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
