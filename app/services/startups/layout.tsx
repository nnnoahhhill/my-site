import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Startups',
  openGraph: {
    title: 'Startups',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function StartupsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
