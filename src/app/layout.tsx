import type { Metadata } from "next";

import { LanguageProvider } from "@/context/language-context";

import "./globals.css";

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AutoExpense",
  description:
    "Vehicle expense management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
  <LanguageProvider>
    {children}
  </LanguageProvider>
</body>
    </html>
  );
}