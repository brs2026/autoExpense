import type { Metadata } from "next";

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
        {children}

        <Toaster
          position="top-center"
          richColors
        />
      </body>
    </html>
  );
}