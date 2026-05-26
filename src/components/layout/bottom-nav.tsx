"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href;

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs transition ${
                isActive
                  ? "text-black"
                  : "text-gray-400"
              }`}
            >
              <Icon size={22} />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}