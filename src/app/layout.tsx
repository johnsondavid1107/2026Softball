import type { Metadata, Viewport } from "next";
import { Aldrich } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const aldrich = Aldrich({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-aldrich",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AFC Urgent Care — Hillsdale Softball",
  description:
    "Schedule, roster, and updates for the AFC Urgent Care (Team 3) Hillsdale Softball team.",
  appleWebApp: {
    capable: true,
    title: "AFC Softball",
    statusBarStyle: "black-translucent",
  },
  icons: [
    {
      rel: "icon",
      // SVG emoji favicon — works in all modern browsers, no image file needed.
      url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🥎</text></svg>",
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1d5a36",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={aldrich.variable}>
      <body>
        <div className="mx-auto min-h-dvh max-w-[480px] bg-team-cream shadow-card-lg md:my-6 md:min-h-0 md:rounded-3xl md:overflow-hidden">
          <Nav />
          <main className="safe-bottom">{children}</main>
        </div>
      </body>
    </html>
  );
}
