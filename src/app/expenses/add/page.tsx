"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/browser-client";
import { toast } from "sonner";

const supabase = createClient();

type Category = {
  id: string;
  name: string;
};

export default function AddExpensePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("id, name")
        .eq("is_active", true);

      if (!error && data) {
        setCategories(data);
      }
    }

    loadCategories();
  }, []);

  async function handleSubmit() {
    try {
      setLoading(true);

      setMessage("");
      setMessageType("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("User not found");
        setMessageType("error");
        return;
      }

      const { error } = await supabase
        .from("expenses")
        .insert({
          amount: Number(amount),
          category_id: categoryId,
          note,
          expense_date: new Date()
            .toISOString()
            .split("T")[0],
          created_by: user.id,
        });

      if (error) {
        console.log(error);

        setMessage(error.message);
        setMessageType("error");

        return;
      }

      setMessage("Expense added successfully");
      setMessageType("success");

      setAmount("");
      setCategoryId("");
      setNote("");

      setTimeout(() => {
        router.push("/expenses");
      }, 1000);
    } catch (err) {
      console.log(err);

      setMessage("Something went wrong");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/expenses"
          className="rounded-full border p-2"
        >
          <ArrowLeft size={18} />
        </Link>

        <div>
          <h1 className="text-3xl font-bold">
            Add Expense
          </h1>

          <p className="text-gray-500">
            Create a new expense
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
            placeholder="Enter amount"
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
            placeholder="Optional note"
            className="w-full rounded-2xl border p-4 outline-none"
            rows={4}
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-black p-4 font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : "Save Expense"}
        </button>
      </div>
    </div>
  );
}