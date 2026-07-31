import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "../src/providers";

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
    default: "GoalPulse | Live Football Streaming",
    template: "%s | GoalPulse",
  },
  description:
    "Premium football streaming experience with live matches, match details, and curated football content.",
  alternates: {
    canonical: "/",
  },
  applicationName: "GoalPulse",
  keywords: ["football streaming", "live football", "soccer streams", "match center"],
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
    title: "GoalPulse | Live Football Streaming",
    description:
      "Premium football streaming experience with live matches, match details, and curated football content.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "GoalPulse football streaming preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoalPulse | Live Football Streaming",
    description:
      "Premium football streaming experience with live matches, match details, and curated football content.",
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
