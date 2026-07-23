export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Explicit user choice wins; otherwise fall back to the OS preference. */
export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage unavailable */
  }
  return getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable */
  }
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

/**
 * Apply the resolved theme and keep following the OS preference
 * until the user makes an explicit choice with the toggle.
 */
export function initTheme(): void {
  applyTheme(getTheme());
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* storage unavailable */
    }
    applyTheme(getSystemTheme());
  });
}
