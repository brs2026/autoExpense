import type { Metadata } from "next";

import { LanguageProvider } from "@/context/language-context";

import "./globals.css";

export const metadata = {
  title: "AutoExpense",
  description: "Expense Manager",

  metadataBase: new URL("https://auto-expense-sigma.vercel.app"),
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
