import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Software',
  openGraph: {
    title: 'Software',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function SoftwareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
