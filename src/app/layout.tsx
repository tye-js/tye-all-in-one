import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import ErrorBoundary from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TYE All-in-One",
  description: "Comprehensive web application with information sharing, TTS utility, and content management",
  keywords: ["server deals", "AI tools", "text-to-speech", "content management"],
  authors: [{ name: "TYE Team" }],
  creator: "TYE Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://liveonchain.com",
    title: "TYE All-in-One",
    description: "Comprehensive web application with information sharing, TTS utility, and content management",
    siteName: "TYE All-in-One",
  },
  twitter: {
    card: "summary_large_image",
    title: "TYE All-in-One",
    description: "Comprehensive web application with information sharing, TTS utility, and content management",
    creator: "@tye_team",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthSessionProvider>
            {children}
            <Toaster />
          </AuthSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
