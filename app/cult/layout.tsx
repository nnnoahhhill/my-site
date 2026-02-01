import { Metadata } from 'next';

// Check if this is an invite link (has ?invite=true or similar)
// For now, we'll use a dynamic approach - but since layouts are static,
// we'll default to the special "gatekeep" metadata
export const metadata: Metadata = {
  title: 'Cult',
  description: 'Join the cult',
  openGraph: {
    title: 'gatekeep this at all costs',
    images: ['/noshare.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gatekeep this at all costs',
    images: ['/noshare.png'],
  },
};

export default function CultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
