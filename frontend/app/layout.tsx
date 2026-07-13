import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoLog - Web Log Analyzer",
  description: "Advanced dashboard and error log management stream",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
