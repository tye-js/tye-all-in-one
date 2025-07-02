import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import ErrorBoundary from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { fontClassNames } from "@/lib/fonts";
import FontPerformanceMonitor from "@/components/font-performance-monitor";

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
        className={fontClassNames}
      >
        <ErrorBoundary>
          <AuthSessionProvider>
            <FontPerformanceMonitor />
            {children}
            <Toaster />
          </AuthSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
