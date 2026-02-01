import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects',
  openGraph: {
    title: 'Projects',
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
