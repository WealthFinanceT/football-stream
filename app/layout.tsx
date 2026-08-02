import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "../src/providers";
import { TelegramSupportWidget } from "../src/components/common/TelegramSupportWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://goalpulse.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GoalPulse | Live Sports Streaming",
    template: "%s | GoalPulse",
  },
  description:
    "Premium live sports streaming experience with matches, highlights, and curated coverage across football, basketball, UFC, baseball, rugby, cricket, motorsports, tennis, and more.",
  alternates: {
    canonical: "/",
  },
  applicationName: "GoalPulse",
  keywords: ["live sports", "sports streaming", "multi-sport streams", "match center"],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "GoalPulse",
    locale: "en_US",
    url: "/",
    title: "GoalPulse | Live Sports Streaming",
    description:
      "Premium live sports streaming experience with matches, highlights, and curated coverage across football, basketball, UFC, baseball, rugby, cricket, motorsports, tennis, and more.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "GoalPulse live sports streaming preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoalPulse | Live Sports Streaming",
    description:
      "Premium live sports streaming experience with matches, highlights, and curated coverage across football, basketball, UFC, baseball, rugby, cricket, motorsports, tennis, and more.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>
          {children}
          <TelegramSupportWidget />
        </AppProviders>
      </body>
    </html>
  );
}
