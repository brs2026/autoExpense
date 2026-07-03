"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { CalendarDays } from "lucide-react";

import PageHeader from "@/components/layout/page-header";

import { createClient } from "@/lib/supabase/browser-client";

import { useLanguage } from "@/context/language-context";

const supabase = createClient();

type IncomeSource = {
  id: string;
  name: string;
};

export default function IncomeEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { messages, language } = useLanguage();

  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [note, setNote] = useState("");
  const [incomeDate, setIncomeDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    ""
  );

  useEffect(() => {
    if (id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [{ data: sourcesData, error: sourcesError }, { data: incomeData, error: incomeError }] =
        await Promise.all([
          supabase
            .from("income_sources")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),
          supabase
            .from("income")
            .select("amount, source_id, note, income_date")
            .eq("id", id)
            .single(),
        ]);

      if (sourcesError) console.error(sourcesError);
      if (incomeError) console.error(incomeError);

      if (sourcesData) {
        setSources(sourcesData as IncomeSource[]);
      }

      if (incomeData) {
        setAmount(String(incomeData.amount));
        setSourceId(incomeData.source_id ?? "");
        setNote(incomeData.note ?? "");
        setIncomeDate(incomeData.income_date ?? "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function formatDisplayDate(dateStr: string) {
    if (!dateStr) return "";
    const locale = language === "bn" ? "bn-BD" : "en-GB";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  async function handleSubmit() {
    // Validation
    if (!amount || Number(amount) <= 0) {
      setMessage(messages.income.invalidAmount);
      setMessageType("error");
      return;
    }

    if (!sourceId) {
      setMessage(messages.income.selectSourceValidation);
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const { error } = await supabase
        .from("income")
        .update({
          amount: Number(amount),
          source_id: sourceId,
          note,
          income_date: incomeDate,
        })
        .eq("id", id);

      if (error) {
        console.error(error);
        setMessage(messages.income.updateFailed);
        setMessageType("error");
        return;
      }

      setMessage(messages.income.incomeUpdated);
      setMessageType("success");

      setTimeout(() => {
        router.push(`/transactions/income/${id}`);
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage(messages.income.updateFailed);
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="p-4">{messages.common.loading}</div>;
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-28">

      {/* Header */}
      <div className="px-4">
        <PageHeader
          title={messages.income.editTitle}
          subtitle={messages.income.editSubtitle}
          backHref={`/transactions/income/${id}`}
        />
      </div>

      {/* Form */}
      <div className="px-4">
        <div className="space-y-5 rounded-3xl border bg-white p-5 shadow-sm">

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {messages.income.amount}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={messages.income.enterAmount}
              className="w-full rounded-2xl border p-4 outline-none transition focus:border-black"
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {messages.income.source}
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full rounded-2xl border bg-white p-4 outline-none transition focus:border-black"
            >
              <option value="">{messages.income.selectSource}</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {messages.income.date}
            </label>
            <label className="relative block cursor-pointer">
              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex items-center justify-between rounded-2xl border bg-gray-50 px-4 py-4">
                <p className="text-gray-800">
                  {incomeDate
                    ? formatDisplayDate(incomeDate)
                    : messages.income.date}
                </p>
                <CalendarDays size={18} className="text-gray-400" />
              </div>
            </label>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {messages.income.note}
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={messages.income.optionalNote}
              className="w-full rounded-2xl border p-4 outline-none transition focus:border-black"
            />
          </div>

          {/* Feedback Message */}
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

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full rounded-2xl bg-black p-4 font-medium text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {saving
              ? messages.income.updating
              : messages.income.updateIncome}
          </button>

        </div>
      </div>
    </div>
  );
}
