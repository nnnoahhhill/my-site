import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cool as Fuck Art Car',
  openGraph: {
    title: 'Cool as Fuck Art Car',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function ArtCarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
