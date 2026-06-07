"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser-client";

import { useLanguage } from "@/context/language-context";

import Link from "next/link";

import { ChevronLeft, Pencil, Trash2, X } from "lucide-react";

const supabase = createClient();

type Expense = {
  id: string;
  amount: number;
  note: string;
  expense_date: string;
  created_by: string;
  receipt_url: string | null;

  expense_categories: {
    name: string;
  } | null;
};

export default function ExpenseDetailsPage() {
  const params = useParams();

  const router = useRouter();

  const { messages, language } = useLanguage();

  const [expense, setExpense] = useState<Expense | null>(null);

  const [loading, setLoading] = useState(true);

  const [canManage, setCanManage] = useState(false);

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    loadExpense();
  }, []);

  async function loadExpense() {
    const { data, error } = await supabase
      .from("expenses")
      .select(
        `
          id,
          amount,
          note,
          expense_date,
          created_by,
          receipt_url,

          expense_categories (
            name
          )
        `
      )
      .eq("id", params.id)
      .single();

    if (!error && data) {
      const formattedExpense: Expense = {
        ...data,

        expense_categories: Array.isArray(data.expense_categories)
          ? (data.expense_categories[0] ?? null)
          : data.expense_categories,
      };

      setExpense(formattedExpense);

      // Load receipt signed URL
      if (data.receipt_url) {
        const { data: signedData } = await supabase.storage
          .from("expense-receipts")
          .createSignedUrl(data.receipt_url, 3600);

        if (signedData?.signedUrl) {
          setReceiptUrl(signedData.signedUrl);
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const isOwner = data.created_by === user.id;

      const isAdmin =
        profile?.role === "admin" || profile?.role === "superadmin";

      setCanManage(isOwner || isAdmin);
    }

    setLoading(false);
  }

  async function handleDelete() {
    const confirmed = confirm(messages.expenses.deleteConfirm);

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

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  if (loading) {
    return <div className="p-4">{messages.common.loading}</div>;
  }

  if (!expense) {
    return <div className="p-4">{messages.expenses.notFound}</div>;
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl bg-white pb-28 shadow-sm">
        {/* Header — back button, title, and actions all in one row */}
        <div className="rounded-t-3xl border-b bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: back button + title */}
            <div className="flex items-center gap-3">
              <Link
                href="/expenses"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 transition hover:bg-gray-200"
              >
                <ChevronLeft size={20} />
              </Link>

              <div>
                <h1 className="text-xl leading-tight font-bold">
                  {messages.expenses.detailsTitle}
                </h1>
                <p className="text-xs text-gray-500">
                  {messages.expenses.detailsSubtitle}
                </p>
              </div>
            </div>

            {/* Right: edit + delete */}
            {canManage && (
              <div className="flex gap-2">
                <Link
                  href={`/expenses/edit/${expense.id}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition hover:bg-gray-200"
                >
                  <Pencil size={16} />
                </Link>

                <button
                  onClick={handleDelete}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="mx-4 mt-4 rounded-2xl bg-black p-5 text-white shadow-lg">
          <p className="text-xs font-medium tracking-widest uppercase opacity-60">
            {messages.expenses.expenseAmount}
          </p>

          <h1 className="mt-2 text-4xl font-bold">৳ {expense.amount}</h1>
        </div>

        {/* Details */}
        <div className="mx-4 mt-3 space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">
              {messages.expenses.category}
            </p>

            <p className="mt-1 font-medium">
              {expense.expense_categories?.name || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">
              {messages.expenses.date}
            </p>

            <p className="mt-1 font-medium">
              {formatDate(expense.expense_date)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">
              {messages.expenses.note}
            </p>

            <p className="mt-1 font-medium text-gray-400">
              {expense.note || "—"}
            </p>
          </div>
        </div>

        {/* Receipt */}
        <div className="mx-4 mt-3 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">
            {messages.expenses.receipt}
          </h2>

          {receiptUrl ? (
            <button
              type="button"
              onClick={() => setShowImage(true)}
              className="w-full overflow-hidden rounded-2xl border"
            >
              <img
                src={receiptUrl}
                alt="Receipt"
                className="max-h-[400px] w-full object-contain"
              />

              <div className="border-t bg-gray-50 py-3 text-sm text-gray-600">
                {messages.expenses.tapToView}
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed bg-gray-50 p-8 text-center text-sm text-gray-400">
              {messages.expenses.noReceipt}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Receipt Viewer */}
      {showImage && receiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setShowImage(false)}
        >
          <button className="absolute top-4 right-4 text-white">
            <X size={30} />
          </button>

          <img
            src={receiptUrl}
            alt="Receipt"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </>
  );
}
