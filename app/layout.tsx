import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BackButton } from "@/components/BackButton";
import { headers } from "next/headers";

export const metadata = {
  title: "Noah Hill",
  description: "A modern minimalist personal site",
  openGraph: {
    title: "Noah Hill",
    images: ['/light.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/light.png'],
  },
};

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
