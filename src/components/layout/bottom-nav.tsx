"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";

import { useLanguage } from "@/context/language-context";

const items = [
  {
    key: "home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "expenses",
    href: "/expenses",
    icon: Receipt,
  },
  {
    key: "reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const { messages } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-3">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs transition-all ${
                active
                  ? "text-black"
                  : "text-gray-400"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={
                  active ? 2.5 : 2
                }
              />

              <span>
                {
                  messages.nav[
                    item.key as keyof typeof messages.nav
                  ]
                }
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}