import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music',
  openGraph: {
    title: 'Music',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function MusicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
