"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ChevronLeft, Pencil, Trash2 } from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser-client";

import { useLanguage } from "@/context/language-context";

import PageHeader from "@/components/layout/page-header";

const supabase = createClient();

type Income = {
  id: string;
  amount: number;
  note: string | null;
  income_date: string;
  created_by: string;
  income_sources: {
    name: string;
  }[];
};

export default function IncomeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { messages, language } = useLanguage();

  const [income, setIncome] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadIncome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadIncome() {
    setLoading(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: incomeData, error: incomeError } = await supabase
        .from("income")
        .select(
          `
          id,
          amount,
          note,
          income_date,
          created_by,
          income_sources (
            name
          )
        `
        )
        .eq("id", id)
        .eq("is_deleted", false)
        .single();

      if (incomeError || !incomeData) {
        console.error(incomeError);
        setIncome(null);
        setLoading(false);
        return;
      }

      setIncome(incomeData as Income);

      const { data: profileData } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", authUser.id)
        .single();

      const isOwner = incomeData.created_by === authUser.id;
      const isAdmin =
        profileData?.role === "admin" || profileData?.role === "superadmin";

      setCanManage(isOwner || isAdmin);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!income) return;

    const confirmed = window.confirm(messages.income.deleteConfirm);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("income")
        .update({ is_deleted: true })
        .eq("id", income.id);

      if (error) {
        console.error(error);
        return;
      }

      router.push("/transactions");
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="p-4">{messages.common.loading}</div>;
  }

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (!income) {
    return <div className="p-4">{messages.income.notFound}</div>;
  }

  const sourceName =
    income.income_sources?.[0]?.name ??
    (income.income_sources as any)?.name ??
    "-";

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="overflow-hidden rounded-3xl bg-white pb-28">
  {/* Header — back button, title, and actions all in one row */}
  <div className="rounded-t-3xl border-b bg-white py-4">
    <div className="flex items-center justify-between">
      {/* Left: back button + title */}
      <div className="flex items-center gap-3">
        <Link
          href="/transactions"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 transition hover:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </Link>

        <div>
          <h1 className="text-xl leading-tight font-bold">
            {messages.income.detailsTitle}
          </h1>

          <p className="text-xs text-gray-500">
            {messages.income.detailsSubtitle}
          </p>
        </div>
      </div>

      {/* Right: edit + delete */}
      {canManage && (
        <div className="flex gap-2">
          <Link
            href={`/transactions/income/edit/${income.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition hover:bg-gray-200"
          >
            <Pencil size={16} />
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  </div>

  {/* Amount */}
  <div className="mx-4 mt-4 rounded-2xl bg-black p-5 text-white shadow-lg">
    <p className="text-xs font-medium uppercase tracking-widest opacity-60">
      {messages.income.incomeAmount}
    </p>

    <h1 className="mt-2 text-4xl font-bold">
      ৳ {income.amount.toLocaleString()}
    </h1>
  </div>

  {/* Details */}
  <div className="mx-4 mt-3 space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
        {messages.income.source}
      </p>

      <p className="mt-1 font-medium">
        {sourceName || "-"}
      </p>
    </div>

    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
        {messages.income.date}
      </p>

      <p className="mt-1 font-medium">
        {formatDate(income.income_date)}
      </p>
    </div>

    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
        {messages.income.note}
      </p>

      <p className="mt-1 font-medium text-gray-400">
        {income.note?.trim() || "—"}
      </p>
    </div>
  </div>
</div>
  );
}
