'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'sc1', label: 'goldieflies', mass: 23, embed: 'soundcloud', url: 'https://soundcloud.com/noah-hill-600496670/goldieflies' },
  { id: 'sc2', label: 'turn my dnb on', mass: 17, embed: 'soundcloud', url: 'https://soundcloud.com/noah-hill-600496670/turn-my-dnb-on' },
  { id: 'sc3', label: 'roxanne', mass: 20, embed: 'soundcloud', url: 'https://soundcloud.com/noah-hill-600496670/roxanne' },
  { id: 'sc4', label: 'crank dat north of richmond', mass: 25, embed: 'soundcloud', url: 'https://soundcloud.com/noah-hill-600496670/crank-dat-north-of-richmond' },
  { id: 'sp1', label: 'spotify1', mass: 15, embed: 'spotify', url: 'https://open.spotify.com/embed/track/5gglGRK7H9uK1BTg9VQEln?utm_source=generator' },
  { id: 'sp2', label: 'spotify2', mass: 25, embed: 'spotify', url: 'https://open.spotify.com/embed/track/2CHeNYF9T1kMrgAr9giAF5?utm_source=generator' },
  { id: 'sp3', label: 'spotify3', mass: 30, embed: 'spotify', url: 'https://open.spotify.com/embed/track/5Hd13VQQ0sOfCXDgE7KQ6J?utm_source=generator' },
  { id: 'sp4', label: 'spotify4', mass: 25, embed: 'spotify', url: 'https://open.spotify.com/embed/track/4DK0nCa5jlCYcoUrNNNCuX?utm_source=generator' },
];

export default function MusicPage() {
  const { randomMode, seed } = useTheme();

  const physicsDefs = useMemo(() => ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    mass: item.mass, 
  })), []);

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);

  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    ITEMS.forEach(item => {
      colors[item.id] = getRandomColor();
    });
    return colors;
  }, [randomMode, seed]);

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {ITEMS.map(item => {
        let content;
        if ((item as any).embed === 'soundcloud') {
          // SoundCloud embed - short but wide
          content = (
            <iframe
              width="450"
              height="133"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent((item as any).url)}&color=%23203235&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
              style={{ border: 'none' }}
            />
          );
        } else if ((item as any).embed === 'spotify') {
          // Spotify embed - thin and wide, smaller
          content = (
            <iframe
              data-testid="embed-iframe"
              style={{ borderRadius: '2px', border: 'none' }}
              src={(item as any).url}
              width="450"
              height="181"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          );
        } else {
          content = item.label;
        }

        return (
          <FloatingItem
            key={item.id}
            id={item.id}
            label={item.label}
            registerRef={registerRef(item.id)}
            setHovered={setHovered}
            style={{ color: itemColors[item.id] }}
          >
            {content}
          </FloatingItem>
        );
      })}
    </main>
  );
}
