"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  LogOut,
  Plus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/browser-client";

const supabase = createClient();

type Category = {
  id: string;
  name: string;
};

type Profile = {
  full_name: string;
  role: string;
};

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [newCategory, setNewCategory] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Current User
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Profile
    const { data: profileData } =
      await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

    setProfile(profileData);

    // Categories
    const { data: categoryData } =
      await supabase
        .from("expense_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        });

    setCategories(categoryData || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("expense_categories")
        .insert({
          name: newCategory,
          is_active: true,
        });

      if (error) {
        alert(error.message);
        return;
      }

      setNewCategory("");

      loadData();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Settings
        </h1>

        <p className="text-gray-500">
          Manage your app settings
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-3xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">
          Profile
        </h2>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-sm text-gray-500">
              Name
            </p>

            <p className="font-medium">
              {profile?.full_name || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Role
            </p>

            <p className="font-medium capitalize">
              {profile?.role || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-3xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Categories
          </h2>
        </div>

        {/* Add Category */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="New category"
            className="flex-1 rounded-2xl border p-3 outline-none"
            value={newCategory}
            onChange={(e) =>
              setNewCategory(e.target.value)
            }
          />

          <button
            onClick={handleAddCategory}
            disabled={loading}
            className="rounded-2xl bg-black px-4 text-white"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Category List */}
        <div className="mt-4 space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl bg-gray-50 p-3"
            >
              {category.name}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 font-medium text-red-600"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
}