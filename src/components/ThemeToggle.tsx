import { useEffect } from 'react';

export function ThemeToggle() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('fll-theme', 'dark');
  }, []);

  return null;
}
