"use client";

import { useEffect, useState } from "react";

import PageHeader from "@/components/layout/page-header";

import { useLanguage } from "@/context/language-context";

import { createClient } from "@/lib/supabase/browser-client";

const supabase = createClient();

type UserItem = {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
};

export default function UsersPage() {
  const { messages } = useLanguage();

  const [users, setUsers] = useState<UserItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState("member");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        username,
        full_name,
        role,
        is_active
      `
      )
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setUsers(data);
    }

    setLoading(false);
  }

  async function createUser() {
    try {
      const response = await fetch("/api/users/create", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error);
        return;
      }

      setFullName("");
      setUsername("");
      setPassword("");
      setRole("member");

      loadUsers();
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleUser(id: string, active: boolean) {
    await supabase
      .from("users")
      .update({
        is_active: !active,
      })
      .eq("id", id);

    loadUsers();
  }

  if (loading) {
    return <div className="p-4">{messages.common.loading}</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={messages.users.title}
        subtitle={messages.users.subtitle}
      />

      {/* Create User */}
      <div className="px-4">
        <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">{messages.users.createUser}</h2>

          <input
            type="text"
            placeholder={messages.users.fullName}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 outline-none"
          />

          <input
            type="text"
            placeholder={messages.users.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 outline-none"
          />

          <input
            type="password"
            placeholder={messages.users.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 outline-none"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 outline-none"
          >
            <option value="member">Member</option>

            <option value="admin">Admin</option>

            <option value="superadmin">Super Admin</option>
          </select>

          <button
            onClick={createUser}
            className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white transition active:scale-[0.98]"
          >
            {messages.users.create}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4 px-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-3xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{user.full_name}</h2>

                <p className="text-sm text-gray-500">@{user.username}</p>

                <div className="mt-3 flex gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {user.role}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      user.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.is_active
                      ? messages.users.active
                      : messages.users.disabled}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleUser(user.id, user.is_active)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                  user.is_active
                    ? "bg-red-50 text-red-500"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {user.is_active
                  ? messages.users.disable
                  : messages.users.enable}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
