"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { createClient } from "@/lib/supabase/browser-client";

const supabase = createClient();

type Category = {
  id: string;
  name: string;
};

export default function EditExpensePage() {
  const params = useParams();

  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [amount, setAmount] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [note, setNote] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error" | "">("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Categories
    const { data: categoryData } =
      await supabase
        .from("expense_categories")
        .select("id, name")
        .eq("is_active", true);

    setCategories(categoryData || []);

    // Expense
    const { data: expenseData, error } =
      await supabase
        .from("expenses")
        .select(`
          amount,
          category_id,
          note
        `)
        .eq("id", params.id)
        .single();

    if (!error && expenseData) {
      setAmount(
        String(expenseData.amount)
      );

      setCategoryId(
        expenseData.category_id
      );

      setNote(
        expenseData.note || ""
      );
    }

    setLoading(false);
  }

  async function handleUpdate() {
    try {
      setSaving(true);

      setMessage("");

      const { error } =
        await supabase
          .from("expenses")
          .update({
            amount: Number(amount),
            category_id: categoryId,
            note,
          })
          .eq("id", params.id);

      if (error) {
        setMessage(error.message);

        setMessageType("error");

        return;
      }

      setMessage(
        "Expense updated successfully"
      );

      setMessageType("success");

      setTimeout(() => {
        router.push(
          `/expenses/${params.id}`
        );
      }, 1000);
    } catch (err) {
      console.log(err);

      setMessage(
        "Something went wrong"
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/expenses/${params.id}`}
          className="rounded-full border p-2"
        >
          <ArrowLeft size={18} />
        </Link>

        <div>
          <h1 className="text-3xl font-bold">
            Edit Expense
          </h1>

          <p className="text-gray-500">
            Update expense details
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${
            messageType === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <div className="space-y-4 rounded-3xl border bg-white p-4 shadow-sm">
        {/* Amount */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Amount
          </label>

          <input
            type="number"
            className="w-full rounded-2xl border p-4 outline-none"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Category
          </label>

          <select
            className="w-full rounded-2xl border p-4 outline-none"
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value)
            }
          >
            <option value="">
              Select Category
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Note
          </label>

          <textarea
            rows={4}
            className="w-full rounded-2xl border p-4 outline-none"
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
          />
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleUpdate}
          disabled={saving}
          className="w-full rounded-2xl bg-black p-4 font-medium text-white disabled:opacity-50"
        >
          {saving
            ? "Updating..."
            : "Update Expense"}
        </button>
      </div>
    </div>
  );
}