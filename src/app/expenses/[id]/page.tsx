"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Pencil,
  Trash2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/browser-client";

const supabase = createClient();

type Expense = {
  id: string;
  amount: number;
  note: string;
  expense_date: string;
  created_by: string;

  expense_categories: {
    name: string;
  } | null;
};

export default function ExpenseDetailsPage() {
  const params = useParams();

  const router = useRouter();

  const [expense, setExpense] =
    useState<Expense | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [canManage, setCanManage] =
    useState(false);

  useEffect(() => {
    loadExpense();
  }, []);

  async function loadExpense() {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        id,
        amount,
        note,
        expense_date,
        created_by,
        expense_categories (
          name
        )
      `)
      .eq("id", params.id)
      .single();

    if (!error && data) {
      setExpense(data);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } =
        await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

      const isOwner =
        data.created_by === user.id;

      const isAdmin =
        profile?.role === "admin" ||
        profile?.role === "superadmin";

      setCanManage(isOwner || isAdmin);
    }

    setLoading(false);
  }

  async function handleDelete() {
    const confirmed = confirm(
      "Delete this expense?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("expenses")
      .update({
        is_deleted: true,
      })
      .eq("id", params.id);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/expenses");
  }

  if (loading) {
    return (
      <div className="p-4">
        Loading...
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="p-4">
        Expense not found
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/expenses"
          className="rounded-full border p-2"
        >
          <ArrowLeft size={18} />
        </Link>

        {canManage && (
          <div className="flex gap-2">
            <Link
              href={`/expenses/edit/${expense.id}`}
              className="rounded-full border p-2"
            >
              <Pencil size={18} />
            </Link>

            <button
              onClick={handleDelete}
              className="rounded-full border p-2 text-red-500"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Amount Card */}
      <div className="rounded-3xl bg-black p-6 text-white">
        <p className="text-sm opacity-70">
          Expense Amount
        </p>

        <h1 className="mt-2 text-5xl font-bold">
          ৳ {expense.amount}
        </h1>
      </div>

      {/* Details */}
      <div className="space-y-4 rounded-3xl border bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm text-gray-500">
            Category
          </p>

          <p className="mt-1 font-medium">
            {
              expense.expense_categories
                ?.name
            }
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Date
          </p>

          <p className="mt-1 font-medium">
            {expense.expense_date}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Note
          </p>

          <p className="mt-1 font-medium">
            {expense.note || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}