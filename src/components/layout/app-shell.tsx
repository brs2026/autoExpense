"use client";

import { ReactNode } from "react";

import BottomNavbar from "./bottom-nav";

type Props = {
  children: ReactNode;
};

export default function AppShell({
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto min-h-screen max-w-md bg-gray-50 shadow-sm">
        <main className="pb-24">
          {children}
        </main>

        <BottomNavbar />
      </div>
    </div>
  );
}