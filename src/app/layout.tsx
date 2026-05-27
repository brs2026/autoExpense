import type { Metadata } from "next";

import { LanguageProvider } from "@/context/language-context";

import "./globals.css";

export const metadata: Metadata = {
  title: "AutoExpense",
  description: "Vehicle expense management system",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
