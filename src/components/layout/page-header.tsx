"use client";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
};

export default function PageHeader({
  title,
  subtitle,
  backHref,
}: Props) {
  return (
    <div className="flex items-start gap-3 p-4 pb-2">
      {backHref && (
        <Link
          href={backHref}
          className="mt-1 rounded-full border bg-white p-2 shadow-sm"
        >
          <ArrowLeft size={18} />
        </Link>
      )}

      <div>
        <h1 className="text-3xl font-bold">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}