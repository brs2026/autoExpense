"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser-client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}
