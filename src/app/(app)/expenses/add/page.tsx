"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/browser-client";

import PageHeader from "@/components/layout/page-header";

import { useLanguage } from "@/context/language-context";

import { CalendarDays } from "lucide-react";

const supabase = createClient();

type Category = {
  id: string;
  name: string;
};

export default function AddExpensePage() {
  const router = useRouter();

  const { messages, language } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);

  const [amount, setAmount] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setCategories(data);
      }
    }

    loadCategories();
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

  async function handleSubmit() {
    try {
      setLoading(true);

      setMessage("");

      setMessageType("");

      if (!amount || Number(amount) <= 0) {
        setMessage(
          language === "bn"
            ? "অনুগ্রহ করে সঠিক পরিমাণ লিখুন"
            : "Please enter a valid amount"
        );

        setMessageType("error");

        return;
      }

      if (!categoryId) {
        setMessage(
          language === "bn"
            ? "অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন"
            : "Please select a category"
        );

        setMessageType("error");

        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(messages.expenses.userNotFound);

        setMessageType("error");

        return;
      }

      const { error } = await supabase.from("expenses").insert({
        amount: Number(amount),

        category_id: categoryId,

        note,

        expense_date: expenseDate,

        created_by: user.id,
      });

      if (error) {
        console.log(error);

        setMessage(messages.expenses.expenseFailed);

        setMessageType("error");

        return;
      }

      setMessage(messages.expenses.expenseAdded);

      setMessageType("success");

      setAmount("");

      setCategoryId("");

      setNote("");

      setExpenseDate(new Date().toISOString().split("T")[0]);

      setTimeout(() => {
        router.push("/expenses");
      }, 1000);
    } catch (err) {
      console.log(err);

      setMessage(messages.expenses.somethingWrong);

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-4 pb-28">
      <PageHeader
        title={messages.expenses.addTitle}
        subtitle={messages.expenses.addSubtitle}
        backHref="/expenses"
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
            className="w-full rounded-2xl border p-4 transition outline-none focus:border-black"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-black p-4 font-medium text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? messages.expenses.saving : messages.expenses.saveExpense}
        </button>
      </div>
    </div>
  );
}
