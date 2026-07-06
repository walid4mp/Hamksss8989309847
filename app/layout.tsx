import type { Metadata } from "next";
import PlausibleProvider from "next-plausible";
import "./globals.css";

const title = "WarHex AI Studio – AI Code Generator";
const description =
  "Generate apps, manage pricing plans, payment methods, and developer access from one AI coding workspace.";
const url = "https://llamacoder.io/";
const ogimage = "https://llamacoder.io/og-image.png";
const sitename = "WarHex AI Studio";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <PlausibleProvider domain="llamacoder.io" />
      </head>

      {children}
    </html>
  );
}
