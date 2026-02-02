import { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;
  const previewIndex = headersList.get('x-preview-index') || '0';
  const previewImage = `${baseUrl}/api/og-image?preview=${previewIndex}`;
  
  return {
    title: "join noah",
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
}

export default function CultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
