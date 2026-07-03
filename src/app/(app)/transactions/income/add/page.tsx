"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { CalendarDays } from "lucide-react";

import PageHeader from "@/components/layout/page-header";

import { createClient } from "@/lib/supabase/browser-client";

import { useLanguage } from "@/context/language-context";

const supabase = createClient();

type IncomeSource = {
  id: string;
  name: string;
};

export default function IncomeAddPage() {
  const router = useRouter();
  const { messages, language } = useLanguage();

  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [note, setNote] = useState("");
  const [incomeDate, setIncomeDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    ""
  );

  useEffect(() => {
    loadSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSources() {
    const { data, error } = await supabase
      .from("income_sources")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setSources(data as IncomeSource[]);
    }
  }

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
    setMessage("");
    setMessageType("");

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

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(messages.income.userNotFound);
        setMessageType("error");
        return;
      }

      const { error } = await supabase.from("income").insert({
        amount: Number(amount),
        source_id: sourceId,
        note,
        income_date: incomeDate,
        created_by: user.id,
      });

      if (error) {
        console.error(error);
        setMessage(messages.income.incomeFailed);
        setMessageType("error");
        return;
      }

      setMessage(messages.income.incomeAdded);
      setMessageType("success");

      // Reset form
      setAmount("");
      setSourceId("");
      setNote("");
      setIncomeDate(new Date().toISOString().split("T")[0]);

      setTimeout(() => {
        router.push("/transactions");
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage(messages.income.somethingWrong);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-28">

      {/* Header */}
      <div className="px-4">
        <PageHeader
          title={messages.income.addTitle}
          subtitle={messages.income.addSubtitle}
          backHref="/transactions"
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
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div className="flex items-center justify-between rounded-2xl border bg-gray-50 px-4 py-4">
                <p className="text-lg font-medium">
                  {formatDate(incomeDate)}
                </p>
                <CalendarDays size={18} className="text-gray-500" />
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
            disabled={loading}
            className="w-full rounded-2xl bg-green-600 p-4 font-medium text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? messages.income.saving : messages.income.saveIncome}
          </button>

        </div>
      </div>
    </div>
  );
}
