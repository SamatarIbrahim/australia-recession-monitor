import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Australia Recession Monitor",
  description: "Are we in a recession? Australian GDP and Sahm rules calculated from official ABS data.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className="antialiased">{children}</body>
    </html>
  );
}
