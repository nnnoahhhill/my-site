import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  openGraph: {
    title: 'About',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
