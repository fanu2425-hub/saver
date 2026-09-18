import React from 'react';
import { ThemeToggle } from './ThemeToggle.tsx';

interface HeroProps {
  profit: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Hero: React.FC<HeroProps> = ({ profit, isDark, onToggleTheme }) => {
  return (
    <section className="hero" id="hero-section">
      <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

      <div className="eyebrow" id="hero-eyebrow">Small business money tracker</div>
      <h1 id="hero-title">Money Pocket</h1>
      <p id="hero-description">Record sales, customers, stock, and QAR profit.</p>

      <div className="balance" id="balance">
        {profit.toFixed(2)} <small>QAR</small>
      </div>
      <div className="sub" id="hero-subtitle">Profit so far</div>
    </section>
  );
};
