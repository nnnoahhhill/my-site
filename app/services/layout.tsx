import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services',
  openGraph: {
    title: 'Services',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
