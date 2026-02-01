import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  openGraph: {
    title: 'Contact',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
