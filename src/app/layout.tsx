import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "AFC Urgent Care — Hillsdale Softball",
  description:
    "Schedule, roster, and updates for the AFC Urgent Care (Team 3) Hillsdale Softball team.",
  appleWebApp: {
    capable: true,
    title: "AFC Softball",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a5f3f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-dvh max-w-[480px] bg-team-cream shadow-card-lg md:my-6 md:min-h-0 md:rounded-3xl md:overflow-hidden">
          <Nav />
          <main className="safe-bottom">{children}</main>
        </div>
      </body>
    </html>
  );
}
