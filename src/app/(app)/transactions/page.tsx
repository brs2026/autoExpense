"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import {
  Plus,
  X,
  SlidersHorizontal,
  Calendar,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser-client";
import { useLanguage } from "@/context/language-context";
import {
  getExpenseCategoryVisual,
  getIncomeCategoryVisual,
} from "@/lib/category-icons";

const supabase = createClient();

type TxType = "expense" | "income";

type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  note: string | null;
  date: string;
  created_by: string;
  categoryName?: string;
  personName?: string;
};

type UserType = {
  id: string;
  full_name: string;
};

type Category = {
  id: string;
  name: string;
};

const TABS: { key: "all" | TxType }[] = [
  { key: "all" },
  { key: "expense" },
  { key: "income" },
];

function formatCardDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TransactionIcon({ t }: { t: Transaction }) {
  const visual =
    t.type === "income"
      ? getIncomeCategoryVisual(t.categoryName || "")
      : getExpenseCategoryVisual(t.categoryName || "");

  const Icon = visual.icon;

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
      style={{ backgroundColor: `${visual.color}1A` }}
    >
      <Icon size={22} style={{ color: visual.color }} strokeWidth={2} />
    </div>
  );
}

export default function TransactionsPage() {
  const { messages } = useLanguage();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | TxType>("all");
  const [fabOpen, setFabOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const months = (() => {
    const result: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
      result.push({ value, label });
    }
    return result;
  })();

  const selectedMonthLabel =
    months.find((m) => m.value === selectedMonth)?.label || "";

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  function getMonthRange(month: string) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0);
    const toStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    return { start: toStr(start), end: toStr(end) };
  }

  async function loadTransactions() {
    setLoading(true);
    try {
      const { start, end } = getMonthRange(selectedMonth);

      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select(
          `
          id,
          amount,
          note,
          expense_date,
          created_by,
          category_id
        `
        )
        .eq("is_deleted", false)
        .gte("expense_date", start)
        .lte("expense_date", end)
        .order("expense_date", { ascending: false });

      if (expenseError) {
        console.error(expenseError);
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
          source_id,
          income_sources (
            id,
            name
          )
        `
        )
        .eq("is_deleted", false)
        .gte("income_date", start)
        .lte("income_date", end)
        .order("income_date", { ascending: false });

      if (incomeError) {
        console.error(incomeError);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select(`id, full_name`);

      if (usersError) {
        console.error(usersError);
        return;
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("expense_categories")
        .select(`id, name`);

      if (categoriesError) {
        console.error(categoriesError);
        return;
      }

      const userMap: Record<string, string> = {};
      (usersData as UserType[])?.forEach((user) => {
        userMap[user.id] = user.full_name;
      });

      const categoryMap: Record<string, Category> = {};
      (categoriesData as Category[])?.forEach((category) => {
        categoryMap[category.id] = category;
      });

      const formattedExpenses: Transaction[] =
        (expenseData as any[])?.map((e) => {
          const cat = categoryMap[e.category_id];
          return {
            id: e.id,
            type: "expense" as const,
            amount: e.amount,
            note: e.note,
            date: e.expense_date,
            created_by: e.created_by,
            categoryName: cat?.name || "-",
            personName: userMap[e.created_by] || "-",
          };
        }) || [];

      const formattedIncome: Transaction[] = (incomeData as any[])?.map((i) => {
        const source = Array.isArray(i.income_sources)
          ? i.income_sources[0]
          : i.income_sources;

        return {
          id: i.id,
          type: "income" as const,
          amount: i.amount,
          note: i.note,
          date: i.income_date,
          created_by: i.created_by,
          personName: userMap[i.created_by] || "-",
          categoryName: source?.name || messages.transactions.income,
        };
      });

      const merged = [...formattedExpenses, ...formattedIncome].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(merged);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = transactions.filter((t) =>
    activeTab === "all" ? true : t.type === activeTab
  );

  if (loading) {
    return <div className="p-4">{messages.common.loading}</div>;
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-4">
        <PageHeader
          title={messages.transactions.title}
          subtitle={messages.transactions.subtitle}
        />
        <button
          type="button"
          onClick={() => {}}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center text-black"
        >
          <SlidersHorizontal size={22} />
        </button>
      </div>

      {/* Month Selector */}
      <div className="px-4">
        <div className="relative">
          <Calendar
            size={18}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
          />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full appearance-none rounded-2xl border bg-white py-3.5 pr-11 pl-11 text-base font-semibold text-gray-800 shadow-sm"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const colorClasses =
            tab.key === "all"
              ? isActive
                ? "bg-black text-white"
                : "bg-white text-black border"
              : tab.key === "expense"
                ? isActive
                  ? "bg-red-50 text-red-500 border border-red-200"
                  : "bg-white text-red-500 border"
                : isActive
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-white text-green-600 border";

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-full px-4 py-3 text-base font-bold transition ${colorClasses}`}
            >
              {messages.transactions[tab.key]}
            </button>
          );
        })}
      </div>

      {/* Transaction List */}
      <div className="space-y-3 px-3">
        {filteredTransactions.length === 0 ? (
          <div className="rounded-3xl border bg-white p-10 text-center text-gray-500 shadow-sm">
            {messages.transactions.noTransactions}
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isIncome = t.type === "income";
            const accentColor = isIncome ? "#16a34a" : "#ef4444";
            const accentBg = isIncome ? "#dcfce7" : "#fee2e2";
            const dotColor = isIncome ? "#bbf7d0" : "#fecaca";

            return (
              <Link
                key={`${t.type}-${t.id}`}
                href={`/transactions/${t.type}/${t.id}`}
                className="relative flex items-center overflow-hidden rounded-3xl border bg-white shadow-sm transition active:scale-[0.98]"
              >
                {/* Dotted pattern — right side decoration */}
                <div
                  className="pointer-events-none absolute top-0 right-0 h-full w-32 opacity-30"
                  style={{
                    backgroundImage: `radial-gradient(circle, ${dotColor} 1.5px, transparent 1.5px)`,
                    backgroundSize: "10px 10px",
                  }}
                />

                {/* Icon first, then thin vertical bar */}
                <div className="flex shrink-0 items-center gap-1 py-4 pl-4">
                  <TransactionIcon t={t} />
                  <div
                    className="h-25 w-[1px] rounded-full opacity-60"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>

                {/* Content */}
                <div className="relative min-w-0 flex-1 px-3 py-4">
                  {/* Type Badge */}
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[7px] font-bold tracking-wider uppercase"
                    style={{ backgroundColor: accentBg, color: accentColor }}
                  >
                    {isIncome
                      ? messages.transactions.income
                      : messages.transactions.expense}
                  </span>

                  {/* Title */}
                  <h2 className="mt-1 truncate text-[18px] font-bold text-gray-900">
                    {t.categoryName}
                  </h2>

                  {/* Person */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <User size={12} className="shrink-0 text-gray-400" />
                    <p className="truncate text-[13px] text-gray-500">
                      {isIncome
                        ? messages.transactions.receivedBy
                        : messages.transactions.spentBy}
                      :{" "}
                      <span className="font-semibold text-gray-700">
                        {t.personName}
                      </span>
                    </p>
                  </div>

                  {/* Date */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Calendar size={12} className="shrink-0 text-gray-400" />
                    <p className="text-[12px] text-gray-400">
                      {formatCardDate(t.date)}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="relative shrink-0 px-3 py-4">
                  <p
                    className="text-[18px] font-bold"
                    style={{ color: accentColor }}
                  >
                    {isIncome ? "+" : "-"}৳ {t.amount.toLocaleString()}
                  </p>
                </div>

                {/* Half-circle chevron flush to right edge */}
                <div
                  className="flex h-full min-h-[90px] w-10 shrink-0 items-center justify-center rounded-l-full"
                  style={{ backgroundColor: accentBg }}
                >
                  <ChevronRight
                    size={18}
                    style={{ color: accentColor }}
                    strokeWidth={2.5}
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Floating Add Buttons */}
      <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-3">
        {fabOpen && (
          <>
            <Link
              href="/transactions/income/add"
              className="flex h-12 items-center gap-2 rounded-full bg-green-600 px-5 text-sm font-semibold text-white shadow-xl transition active:scale-95"
            >
              <Icons.ArrowUp size={18} />
              {messages.transactions.addIncome}
            </Link>
            <Link
              href="/transactions/expense/add"
              className="flex h-12 items-center gap-2 rounded-full bg-red-500 px-5 text-sm font-semibold text-white shadow-xl transition active:scale-95"
            >
              <Icons.ArrowDown size={16} />
              {messages.transactions.addExpense}
            </Link>
          </>
        )}

        <button
          type="button"
          onClick={() => setFabOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-xl transition active:scale-95"
        >
          {fabOpen ? <X size={26} /> : <Plus size={26} />}
        </button>
      </div>
    </div>
  );
}
