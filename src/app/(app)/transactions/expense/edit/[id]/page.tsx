"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { CalendarDays } from "lucide-react";

import { createClient } from "@/lib/supabase/browser-client";

import PageHeader from "@/components/layout/page-header";

import { useLanguage } from "@/context/language-context";

const supabase = createClient();

type Category = {
  id: string;
  name: string;
};

export default function EditExpensePage() {
  const params = useParams();

  const router = useRouter();

  const { messages, language } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);

  const [amount, setAmount] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [note, setNote] = useState("");

  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    loadData();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  async function loadData() {
    try {
      setLoading(true);

      const { data: categoryData } = await supabase
        .from("expense_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      setCategories(categoryData || []);

      const { data: expenseData, error } = await supabase
        .from("expenses")
        .select(
          `
          amount,
          category_id,
          note,
          expense_date
        `
        )
        .eq("id", params.id)
        .single();

      if (!error && expenseData) {
        setAmount(String(expenseData.amount));

        setCategoryId(expenseData.category_id);

        setNote(expenseData.note || "");

        setExpenseDate(
          expenseData.expense_date || new Date().toISOString().split("T")[0]
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    try {
      setSaving(true);

      setMessage("");

      setMessageType("");

      if (!amount || Number(amount) <= 0) {
        setMessage(messages.expenses.invalidAmount);

        setMessageType("error");

        return;
      }

      if (!categoryId) {
        setMessage(messages.expenses.selectCategoryValidation);

        setMessageType("error");

        return;
      }

      const { error } = await supabase
        .from("expenses")
        .update({
          amount: Number(amount),

          category_id: categoryId,

          note,

          expense_date: expenseDate,
        })
        .eq("id", params.id);

      if (error) {
        console.error(error);

        setMessage(messages.expenses.updateFailed);

        setMessageType("error");

        return;
      }

      setMessage(messages.expenses.expenseUpdated);

      setMessageType("success");

      setTimeout(() => {
        router.push(`/transactions/expense/${params.id}`);
      }, 1000);
    } catch (err) {
      console.error(err);

      setMessage(messages.expenses.somethingWrong);

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4">{messages.expenses.loadingExpense}</div>;
  }

  return (
    <div className="space-y-6 p-4 pb-28">
      <PageHeader
        title={messages.expenses.editTitle}
        subtitle={messages.expenses.editSubtitle}
        backHref={`/transactions/expense/${params.id}`}
      />

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

      <div className="space-y-5 rounded-3xl border bg-white p-5 shadow-sm">
        {/* Amount */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            {messages.expenses.amount}
          </label>

          <input
            type="number"
            placeholder={messages.expenses.enterAmount}
            className="w-full rounded-2xl border p-4 transition outline-none focus:border-black"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            {messages.expenses.category}
          </label>

          <select
            className="w-full rounded-2xl border p-4 transition outline-none focus:border-black"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{messages.expenses.selectCategory}</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            {messages.expenses.date}
          </label>

          <label className="relative block cursor-pointer">
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />

            <div className="flex items-center justify-between rounded-2xl border bg-gray-50 px-4 py-4 transition hover:bg-gray-100 active:bg-gray-100">
              <p className="text-lg font-medium">{formatDate(expenseDate)}</p>

              <CalendarDays size={18} className="shrink-0 text-gray-500" />
            </div>
          </label>
        </div>

        {/* Note */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            {messages.expenses.note}
          </label>

          <textarea
            placeholder={messages.expenses.optionalNote}
            rows={4}
            className="w-full rounded-2xl border p-4 transition outline-none focus:border-black"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleUpdate}
          disabled={saving}
          className="w-full rounded-2xl bg-black p-4 font-medium text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {saving
            ? messages.expenses.updating
            : messages.expenses.updateExpense}
        </button>
      </div>
    </div>
  );
}
