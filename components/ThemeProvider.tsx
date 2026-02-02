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
  setHomePageColors: (bgColor: string, textColors: string[]) => void;
  getColorFromHomePalette: (itemId: string) => string;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

// Utils - Generate a deterministic color based on seed and item identifier
export function getRandomColor(seed: number, itemId?: string) {
  // Ensure seed is a valid number
  const safeSeed = typeof seed === 'number' && !isNaN(seed) ? seed : 0;
  
  // Create a combined seed from the main seed and item ID
  let combinedSeed = safeSeed;
  if (itemId) {
    // Hash the item ID to a number
    let hash = 0;
    for (let i = 0; i < itemId.length; i++) {
      hash = ((hash << 5) - hash) + itemId.charCodeAt(i);
      hash = hash & hash;
    }
    combinedSeed = safeSeed + Math.abs(hash);
  }
  
  // Use a simple seeded random algorithm to generate a deterministic color
  // This ensures the same seed + itemId always produces the same color
  let value = Math.abs(combinedSeed);
  value = (value * 9301 + 49297) % 233280;
  const normalized = value / 233280;
  const colorValue = Math.floor(normalized * 16777215);
  return '#' + colorValue.toString(16).padStart(6, '0');
}

export function ThemeProvider({ children, initialPunished = false }: { children: React.ReactNode, initialPunished?: boolean }) {
  // Load from localStorage on mount
  const [brightness, setBrightness] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-brightness');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [randomMode, setRandomMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-random');
      return saved === 'true';
    }
    return false;
  });
  const [seed, setSeed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-seed');
      const parsed = saved ? parseInt(saved, 10) : 0;
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  });
  const [punished, setPunished] = useState(initialPunished); // If user is "trapped"
  const [showTrap, setShowTrap] = useState(false); // Show the popup
  const [bgStyle, setBgStyle] = useState<React.CSSProperties>({});
  
  // Store home page colors (background and text colors)
  const [homePageBgColor, setHomePageBgColor] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme-home-bg') || null;
    }
    return null;
  });
  const [homePageTextColors, setHomePageTextColors] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-home-text-colors');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // Save to localStorage whenever brightness changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-brightness', brightness.toString());
    }
  }, [brightness]);
  
  // Save to localStorage whenever randomMode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-random', randomMode.toString());
    }
  }, [randomMode]);
  
  // Save to localStorage whenever seed changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-seed', seed.toString());
    }
  }, [seed]);
  
  // Save home page colors to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (homePageBgColor) {
        localStorage.setItem('theme-home-bg', homePageBgColor);
      }
      if (homePageTextColors.length > 0) {
        localStorage.setItem('theme-home-text-colors', JSON.stringify(homePageTextColors));
      }
    }
  }, [homePageBgColor, homePageTextColors]);
  
  // Trap Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Check if invisible
    // +10 = invisible (light)
    // -10 = invisible (dark)
    if ((brightness >= 10) || (brightness <= -10)) {
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
      // Use stored home page background color if available, otherwise generate new one
      const bgColor = homePageBgColor || getRandomColor(seed, 'body-bg');
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = getRandomColor(seed, 'body-text'); // Default text color, though items override
    } else {
      // Calculate Colors based on Brightness
      // Range: -10 ... 0 ... +10
      // 0 = default (white bg, black text)
      // +5 = full white bg, black text
      // +10 = white bg, invisible text
      // -5 = full black bg, white text
      // -10 = black bg, invisible text
      
      let bg = '#ffffff';
      let text = '#000000';
      let textOpacity = 1;

      if (brightness > 5) {
        // +5 to +10: Fade text out on White BG
        bg = '#ffffff';
        text = '#000000';
        textOpacity = Math.max(0, 1 - ((brightness - 5) / 5));
        document.body.style.backgroundColor = bg;
        document.body.style.color = `rgba(0, 0, 0, ${textOpacity})`;
      } else if (brightness > 0) {
        // 0 to +5: Full white BG, black text (no fade yet)
        bg = '#ffffff';
        text = '#000000';
        document.body.style.backgroundColor = bg;
        document.body.style.color = text;
      } else if (brightness > -5) {
        // 0 to -5: Fade BG to Black, Text to White
        const ratio = Math.abs(brightness) / 5;
        const cVal = Math.round(255 * (1 - ratio)); // 255 -> 0
        bg = `rgb(${cVal}, ${cVal}, ${cVal})`;
        const tVal = Math.round(255 * ratio); // 0 -> 255
        text = `rgb(${tVal}, ${tVal}, ${tVal})`;
        document.body.style.backgroundColor = bg;
        document.body.style.color = text;
      } else {
        // -5 to -10: Fade Text out on Black BG
        bg = '#000000';
        text = '#ffffff';
        const val = Math.abs(brightness); // 5 to 10
        textOpacity = Math.max(0, 1 - ((val - 5) / 5));
        document.body.style.backgroundColor = bg;
        document.body.style.color = `rgba(255, 255, 255, ${textOpacity})`;
      }
    }
  }, [brightness, randomMode, seed, homePageBgColor]);

  const changeBrightness = useCallback((delta: number) => {
    setRandomMode(false);
    setBrightness(b => {
      // If we're in random mode, jump directly to full light or full dark
      if (randomMode) {
        if (delta > 0) {
          return 5; // Full light: white bg, black text
        } else {
          return -5; // Full dark: black bg, white text
        }
      }
      // Otherwise, increment/decrement normally
      const nb = b + delta;
      // Clamp to -10 to +10 range
      // -10 = black bg, invisible text
      // +10 = white bg, invisible text
      return Math.min(Math.max(nb, -10), 10);
    });
  }, [randomMode]);

  const triggerRandom = useCallback(() => {
    setRandomMode(true);
    setSeed(s => s + 1);
    setBrightness(0); // Reset brightness underlying?
    // Clear stored home page colors so new ones will be generated
    setHomePageBgColor(null);
    setHomePageTextColors([]);
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

  // Store home page colors (called from home page)
  const setHomePageColors = useCallback((bgColor: string, textColors: string[]) => {
    setHomePageBgColor(bgColor);
    setHomePageTextColors(textColors);
  }, []);

  // Get a color from the home page palette for other pages
  // Each item gets a different color by using the same seeded random approach as getRandomColor
  const getColorFromHomePalette = useCallback((itemId: string) => {
    if (homePageTextColors.length === 0) {
      // Fallback if no home page colors stored yet
      return getRandomColor(seed, itemId);
    }
    
    // Use the same approach as getRandomColor to create a deterministic but varied index
    const safeSeed = typeof seed === 'number' && !isNaN(seed) ? seed : 0;
    
    // Hash the item ID to a number (same as getRandomColor)
    let hash = 0;
    for (let i = 0; i < itemId.length; i++) {
      hash = ((hash << 5) - hash) + itemId.charCodeAt(i);
      hash = hash & hash;
    }
    const combinedSeed = safeSeed + Math.abs(hash);
    
    // Use the same seeded random algorithm as getRandomColor
    let value = Math.abs(combinedSeed);
    value = (value * 9301 + 49297) % 233280;
    const normalized = value / 233280;
    
    // Use this to pick an index from the palette
    const index = Math.floor(normalized * homePageTextColors.length);
    
    return homePageTextColors[index];
  }, [homePageTextColors, seed]);

  return (
    <ThemeContext.Provider value={{
      brightness,
      changeBrightness,
      randomMode,
      triggerRandom,
      punished,
      reset,
      keepIt,
      seed,
      setHomePageColors,
      getColorFromHomePalette
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
