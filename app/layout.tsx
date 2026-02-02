import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BackButton } from "@/components/BackButton";
import { headers } from "next/headers";
import { Metadata } from "next";

const PREVIEW_IMAGES = [
  '/previews/white.png',
  '/previews/purp.png',
  '/previews/light-blue.png',
  '/previews/dark-blue.png',
  '/previews/dark.png',
  '/previews/light.png',
];

export async function generateMetadata(): Promise<Metadata> {
  // Use the dynamic og-image API route
  // The preview index comes from query param (?preview=0, ?preview=1, etc.)
  // or rotates based on timestamp if no param is provided
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;
  
  // Get preview index from header (set by middleware from query param or timestamp)
  const previewIndex = headersList.get('x-preview-index') || '0';
  const previewImage = `${baseUrl}/api/og-image?preview=${previewIndex}`;
  
  return {
    title: "Noah Hill",
    description: "A modern minimalist personal site",
    openGraph: {
      title: "Noah Hill",
      images: [previewImage],
    },
    twitter: {
      card: 'summary_large_image',
      images: [previewImage],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const isPunished = headersList.get('x-is-punished') === 'true';

  return (
    <html lang="en">
      <body>
        <ThemeProvider initialPunished={isPunished}>
          {children}
          <BackButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
