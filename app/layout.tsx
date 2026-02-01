import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { headers } from "next/headers";

export const metadata = {
  title: "Noah Hill",
  description: "A modern minimalist personal site",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const isPunished = headersList.get('x-is-punished') === 'true';

  return (
    <html lang="en">
      <body>
        <ThemeProvider initialPunished={isPunished}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
