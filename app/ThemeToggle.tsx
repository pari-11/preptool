'use client';

import { Moon, Sun } from 'lucide-react';

// Flips the `dark` class on <html> and remembers the choice. The icon is chosen in CSS from that
// class, so there is no state to disagree with the server render. Storage can be blocked
// (private windows), so every access is guarded and the toggle still works for the visit.
export function ThemeToggle() {
  function toggle() {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      // not persisted; the choice lasts until the page is reloaded
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}
