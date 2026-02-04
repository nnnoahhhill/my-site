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
    title: "buy them",
    icons: {
      icon: [
        { url: '/footglove_favicon/favicon.ico', sizes: 'any' },
        { url: '/footglove_favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/footglove_favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/footglove_favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'manifest', url: '/footglove_favicon/site.webmanifest' },
      ],
    },
    openGraph: {
      title: "buy them",
      images: [previewImage],
    },
    twitter: {
      card: 'summary_large_image',
      images: [previewImage],
    },
  };
}

export default function FootGlovingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
