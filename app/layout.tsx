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

function getRandomPreviewImage(): string {
  // Use a deterministic random based on current date (changes daily)
  // This ensures consistency during build but variety over time
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % PREVIEW_IMAGES.length;
  return PREVIEW_IMAGES[index];
}

export async function generateMetadata(): Promise<Metadata> {
  const previewImage = getRandomPreviewImage();
  
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
          <BackButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
