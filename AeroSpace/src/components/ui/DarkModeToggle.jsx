import React, { useEffect, useState } from 'react';
import './DarkModeToggle.css';

export const DarkModeToggle = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('prefers-dark');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('prefers-dark', JSON.stringify(dark));
  }, [dark]);

  const toggle = () => setDark(!dark);

  return (
    <button className="dark-toggle" onClick={toggle} aria-label="Toggle dark mode">
      {dark ? '🌙' : '☀️'}
    </button>
  );
};
