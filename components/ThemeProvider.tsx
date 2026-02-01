'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeContextType = {
  brightness: number;
  changeBrightness: (delta: number) => void;
  randomMode: boolean;
  triggerRandom: () => void;
  punished: boolean;
  reset: () => void;
  keepIt: () => void;
  seed: number;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

// Utils
export function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

export function ThemeProvider({ children, initialPunished = false }: { children: React.ReactNode, initialPunished?: boolean }) {
  const [brightness, setBrightness] = useState(0);
  const [randomMode, setRandomMode] = useState(false);
  const [seed, setSeed] = useState(0); // Triggers re-render for random colors
  const [punished, setPunished] = useState(initialPunished); // If user is "trapped"
  const [showTrap, setShowTrap] = useState(false); // Show the popup
  const [bgStyle, setBgStyle] = useState<React.CSSProperties>({});
  
  // Trap Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Check if invisible
    // +5 = invisible (light)
    // -10 = invisible (dark)
    if ((brightness >= 5) || (brightness <= -10)) {
       timer = setTimeout(() => {
         setShowTrap(true);
       }, 3000);
    } else {
      setShowTrap(false);
    }
    return () => clearTimeout(timer);
  }, [brightness]);

  // Apply Theme Side Effects
  useEffect(() => {
    if (randomMode) {
      document.body.style.backgroundColor = getRandomColor();
      document.body.style.color = getRandomColor(); // Default text color, though items override
    } else {
      // Calculate Colors based on Brightness
      // Range: -10 ... 0 ... +5
      
      let bg = '#ffffff';
      let text = '#000000';
      let textOpacity = 1;

      if (brightness > 0) {
        // 0 to 5: Fade text out on White BG
        bg = '#ffffff';
        text = '#000000';
        textOpacity = Math.max(0, 1 - (brightness / 5));
      } else if (brightness > -5) {
        // 0 to -5: Fade BG to Black, Text to White
        // Interpolate BG from White to Black
        // Interpolate Text from Black to White
        const ratio = Math.abs(brightness) / 5;
        const cVal = Math.round(255 * (1 - ratio)); // 255 -> 0
        bg = `rgb(${cVal}, ${cVal}, ${cVal})`;
        const tVal = Math.round(255 * ratio); // 0 -> 255
        text = `rgb(${tVal}, ${tVal}, ${tVal})`;
      } else {
        // -5 to -10: Fade Text out on Black BG
        bg = '#000000';
        text = '#ffffff';
        // -5 -> opacity 1
        // -10 -> opacity 0
        const val = Math.abs(brightness); // 5 to 10
        textOpacity = Math.max(0, 1 - ((val - 5) / 5));
      }

      document.body.style.backgroundColor = bg;
      document.body.style.color = text;
      // We set a CSS variable for text opacity to use in items if needed, 
      // or just rely on body color opacity? 
      // `color` with alpha doesn't work well if we want the "text" variable to just be rgb.
      // Let's set the alpha on the color directly.
      if (text.startsWith('#')) {
         // hex to rgba? lazy way:
         document.body.style.opacity = '1'; // Reset body opacity
         // Actually, just changing the color's alpha is best.
         // But the logic above generates rgb(...) for 0 to -5.
         // For the fade outs (+0 to +5 and -5 to -10), let's use rgba.
         if (brightness > 0) {
            document.body.style.color = `rgba(0, 0, 0, ${textOpacity})`;
         } else if (brightness <= -5) {
            document.body.style.color = `rgba(255, 255, 255, ${textOpacity})`;
         }
      } else {
        document.body.style.color = text;
      }
    }
  }, [brightness, randomMode, seed]);

  const changeBrightness = useCallback((delta: number) => {
    setRandomMode(false);
    setBrightness(b => {
      const nb = b + delta;
      // Clamp? Prompt says "if u click 5 times... fully dark". Doesn't say it stops.
      // But functionality breaks at +5/-10. Let's unclamp or clamp to slightly beyond?
      // "5 extra clicks... fully transparent". 
      // Let's clamp to keep it sane: -15 to +10?
      return Math.min(Math.max(nb, -10), 5);
    });
  }, []);

  const triggerRandom = useCallback(() => {
    setRandomMode(true);
    setSeed(s => s + 1);
    setBrightness(0); // Reset brightness underlying?
  }, []);

  const reset = useCallback(() => {
    setBrightness(0);
    setRandomMode(false);
    setShowTrap(false);
  }, []);

  const keepIt = useCallback(() => {
    // "Have to find a way to contact me"
    // Block the site.
    setPunished(true);
    // TODO: Call API to block IP
    fetch('/api/punish', { method: 'POST' }).catch(console.error);
    setShowTrap(false);
  }, []);

  return (
    <ThemeContext.Provider value={{
      brightness,
      changeBrightness,
      randomMode,
      triggerRandom,
      punished,
      reset,
      keepIt,
      seed
    }}>
      {children}
      {/* Trap Modal */}
      {showTrap && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          color: 'black',
          padding: '2rem',
          border: '2px solid black',
          zIndex: 9999,
          textAlign: 'center'
        }}>
          <h1>lmao</h1>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '1rem 0' }}>
            <button onClick={reset}>reset</button>
            <button onClick={keepIt}>keep it</button>
          </div>
          <p style={{ fontSize: '0.7rem', maxWidth: '300px' }}>
            if you click keep it you have to find a way to contact me directly to make the website usable again
          </p>
        </div>
      )}
      {punished && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'black',
          color: 'transparent',
          zIndex: 10000,
          pointerEvents: 'none' // Can't click anything
        }}>
          {/* Invisible wall of punishment */}
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext)!;
