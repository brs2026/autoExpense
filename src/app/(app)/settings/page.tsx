"use client";

import { useEffect, useState } from "react";

import { LogOut, Plus } from "lucide-react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser-client";

import PageHeader from "@/components/layout/page-header";

import { useLanguage } from "@/context/language-context";

import Link from "next/link";

const supabase = createClient();

type Category = {
  id: string;
  name: string;
};

type UserProfile = {
  full_name: string;
  role: string;
};

export default function SettingsPage() {
  const router = useRouter();

  const { language, setLanguage, messages } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);

  const [newCategory, setNewCategory] = useState("");

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([loadCategories(), loadProfile()]);
  }

  async function loadCategories() {
    const { data } = await supabase
      .from("expense_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setCategories(data);
    }
  }

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={messages.settings.title}
        subtitle={messages.settings.subtitle}
      />

      {/* Profile */}
      <div className="px-4">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">{messages.settings.profile}</h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-gray-500">{messages.settings.name}</p>

              <p className="mt-1 font-medium">{profile?.full_name || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">{messages.settings.role}</p>

              <p className="mt-1 font-medium capitalize">
                {profile?.role || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="px-4">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">
            {messages.settings.language}
          </h2>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setLanguage("en")}
              className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition ${
                language === "en" ? "bg-black text-white" : "bg-white"
              }`}
            >
              English
            </button>

            <button
              onClick={() => setLanguage("bn")}
              className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition ${
                language === "bn" ? "bg-black text-white" : "bg-white"
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>

      {/* User Management */}
      {profile?.role === "superadmin" && (
        <div className="px-4">
          <Link
            href="/users"
            className="flex items-center justify-between rounded-3xl border bg-white p-5 shadow-sm transition active:scale-[0.98]"
          >
            <div>
              <h2 className="text-lg font-semibold">
                {messages.settings.users}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {messages.settings.usersSubtitle}
              </p>
            </div>

            <span className="text-2xl">→</span>
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className="px-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-red-200 bg-red-50 px-4 py-4 font-medium text-red-500 transition active:scale-[0.98]"
        >
          <LogOut size={18} />

          {messages.settings.logout}
        </button>
      </div>
    </div>
  );
}
