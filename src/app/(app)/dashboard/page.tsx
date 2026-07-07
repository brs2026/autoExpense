"use client";

import { useEffect, useState } from "react";

import {
  ChevronDown,
  Wallet,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { createClient } from "@/lib/supabase/browser-client";

import PageHeader from "@/components/layout/page-header";

import { useLanguage } from "@/context/language-context";

const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────

type RecentTransaction = {
  id: string;
  type: "expense" | "income";
  amount: number;
  date: string;
  categoryName: string | null;
  personName: string | null;
};

type MemberTotal = {
  name: string;
  amount: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(month: string): {
  startDate: string;
  endDate: string;
} {
  const [year, mon] = month.split("-").map(Number);
  const startDate = `${year}-${String(mon).padStart(2, "0")}-01`;
  const nextMon = mon === 12 ? 1 : mon + 1;
  const nextYear = mon === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMon).padStart(2, "0")}-01`;
  return { startDate, endDate };
}

function getPreviousMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const prevMon = mon === 1 ? 12 : mon - 1;
  const prevYear = mon === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMon).padStart(2, "0")}`;
}

function getMonthLabel(month: string, language: string): string {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, mon - 1, 1);
  return d.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

function generateMonthOptions(language: string) {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      month: "long",
      year: "numeric",
    });
    options.push({ value, label });
  }
  return options;
}

function getPercentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { messages, language } = useLanguage();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [prevMonthlyExpense, setPrevMonthlyExpense] = useState(0);
  const [prevMonthlyIncome, setPrevMonthlyIncome] = useState(0);
  const [memberTotals, setMemberTotals] = useState<MemberTotal[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [userFullName, setUserFullName] = useState("");
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  const monthOptions = generateMonthOptions(language);
  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label ?? "";
  const previousMonthLabel = getMonthLabel(
    getPreviousMonth(selectedMonth),
    language
  );

  const monthlyProfit = monthlyIncome - monthlyExpense;
  const prevMonthlyProfit = prevMonthlyIncome - prevMonthlyExpense;

  const profitChange = getPercentChange(monthlyProfit, prevMonthlyProfit);
  const incomeChange = getPercentChange(monthlyIncome, prevMonthlyIncome);
  const expenseChange = getPercentChange(monthlyExpense, prevMonthlyExpense);

  // Re-fetch month-aware data whenever selected month changes
  useEffect(() => {
    loadMonthlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Fetch user + recent transactions once; also subscribe to realtime
  useEffect(() => {
    loadUserAndRecent();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          loadMonthlyData();
          loadUserAndRecent();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "income" },
        () => {
          loadMonthlyData();
          loadUserAndRecent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Month-aware fetches ────────────────────────────────────────────────────

  async function loadMonthlyData() {
    setMonthlyLoading(true);
    try {
      const { startDate, endDate } = getMonthRange(selectedMonth);
      const previousMonth = getPreviousMonth(selectedMonth);
      const { startDate: prevStartDate, endDate: prevEndDate } =
        getMonthRange(previousMonth);

      // Monthly expense total
      const { data: expenseData } = await supabase
        .from("expenses")
        .select("amount, created_by")
        .eq("is_deleted", false)
        .gte("expense_date", startDate)
        .lt("expense_date", endDate);

      setMonthlyExpense(
        expenseData?.reduce((sum, e) => sum + e.amount, 0) ?? 0
      );

      // Monthly income total
      const { data: incomeData } = await supabase
        .from("income")
        .select("amount")
        .eq("is_deleted", false)
        .gte("income_date", startDate)
        .lt("income_date", endDate);

      setMonthlyIncome(incomeData?.reduce((sum, i) => sum + i.amount, 0) ?? 0);

      // Previous month expense total (for % comparison)
      const { data: prevExpenseData } = await supabase
        .from("expenses")
        .select("amount")
        .eq("is_deleted", false)
        .gte("expense_date", prevStartDate)
        .lt("expense_date", prevEndDate);

      setPrevMonthlyExpense(
        prevExpenseData?.reduce((sum, e) => sum + e.amount, 0) ?? 0
      );

      // Previous month income total (for % comparison)
      const { data: prevIncomeData } = await supabase
        .from("income")
        .select("amount")
        .eq("is_deleted", false)
        .gte("income_date", prevStartDate)
        .lt("income_date", prevEndDate);

      setPrevMonthlyIncome(
        prevIncomeData?.reduce((sum, i) => sum + i.amount, 0) ?? 0
      );

      // Member contributions — scoped to selected month
      const { data: memberData } = await supabase
        .from("expenses")
        .select(
          `
          amount,
          users (
            full_name
          )
        `
        )
        .eq("is_deleted", false)
        .gte("expense_date", startDate)
        .lt("expense_date", endDate);

      const grouped: Record<string, number> = {};
      memberData?.forEach((item: any) => {
        const name =
          (Array.isArray(item.users)
            ? item.users[0]?.full_name
            : item.users?.full_name) ?? "Unknown";
        grouped[name] = (grouped[name] ?? 0) + item.amount;
      });

      setMemberTotals(
        Object.entries(grouped)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
      );
    } catch (error) {
      console.error("loadMonthlyData error:", error);
    } finally {
      setMonthlyLoading(false);
    }
  }

  // ── Static fetches (never filtered by month) ──────────────────────────────

  async function loadUserAndRecent() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .single();

        setUserFullName(profile?.full_name ?? "");
      }

      // Latest 5 expenses
      const { data: recentExpenses } = await supabase
        .from("expenses")
        .select(
          `
          id,
          amount,
          expense_date,
          expense_categories ( name ),
          users ( full_name )
        `
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);

      // Latest 5 income
      const { data: recentIncome } = await supabase
        .from("income")
        .select(
          `
          id,
          amount,
          income_date,
          users ( full_name )
        `
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);

      const expenses: RecentTransaction[] = (recentExpenses ?? []).map(
        (item: any) => ({
          id: item.id,
          type: "expense",
          amount: item.amount,
          date: item.expense_date,
          categoryName: Array.isArray(item.expense_categories)
            ? (item.expense_categories[0]?.name ?? null)
            : (item.expense_categories?.name ?? null),
          personName: Array.isArray(item.users)
            ? (item.users[0]?.full_name ?? null)
            : (item.users?.full_name ?? null),
        })
      );

      const incomes: RecentTransaction[] = (recentIncome ?? []).map(
        (item: any) => ({
          id: item.id,
          type: "income",
          amount: item.amount,
          date: item.income_date,
          categoryName: null,
          personName: Array.isArray(item.users)
            ? (item.users[0]?.full_name ?? null)
            : (item.users?.full_name ?? null),
        })
      );

      // Merge, sort by date, take latest 5
      setRecentTransactions(
        [...expenses, ...incomes]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5)
      );
    } catch (error) {
      console.error("loadUserAndRecent error:", error);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 px-4 pb-28">
      {/* Header + Month Selector */}
      <div className="flex items-start justify-between gap-3" font-bold>
        <PageHeader
          title={messages.dashboard.title}
          subtitle={
            userFullName
              ? `${messages.dashboard.subtitle}, ${userFullName} `
              : messages.dashboard.subtitle
          }
        />

        <div className="relative mt-5 shrink-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none rounded-2xl border bg-white py-2 pr-8 pl-9 text-sm font-semibold text-gray-700 shadow-sm outline-none"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <Calendar
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
          />
          <ChevronDown
            size={14}
            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>

      {/* Monthly Profit Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
            {messages.dashboard.monthlyProfit}
          </p>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
            <Wallet size={20} />
          </div>
        </div>
        <h2 className="mt-0 text-5xl font-bold">
          ৳ {monthlyProfit.toLocaleString()}
        </h2>

        {!monthlyLoading && profitChange !== null && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
            {profitChange >= 0 ? (
              <ArrowUp size={12} className="text-green-300" />
            ) : (
              <ArrowDown size={12} className="text-red-300" />
            )}
            <span
              className={`text-xs font-semibold ${
                profitChange >= 0 ? "text-green-300" : "text-red-300"
              }`}
            >
              {Math.abs(profitChange).toFixed(1)}%
            </span>
            <span className="text-xs opacity-70">
              {messages.common.vs} {previousMonthLabel}
            </span>
          </div>
        )}
      </div>

      {/* 
      //Monthly Profit Card --- Newer Version Not implemented Yet.(Minus Amount will not show)
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
            {messages.dashboard.monthlyProfit}
          </p>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
            <Wallet size={20} />
          </div>
        </div>
        <h2 className="mt-3 text-5xl font-bold">
          ৳ {Math.max(monthlyProfit, 0).toLocaleString()}
        </h2>
        <p className="mt-2 text-sm opacity-60">
          {messages.dashboard.incomeMinusExpense}
        </p>

        {!monthlyLoading && profitChange !== null && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
            {profitChange >= 0 ? (
              <ArrowUp size={12} className="text-green-300" />
            ) : (
              <ArrowDown size={12} className="text-red-300" />
            )}
            <span
              className={`text-xs font-semibold ${
                profitChange >= 0 ? "text-green-300" : "text-red-300"
              }`}
            >
              {Math.abs(profitChange).toFixed(1)}%
            </span>
            <span className="text-xs opacity-70">vs {previousMonthLabel}</span>
          </div>
        )}
      </div> */}

      {/* Monthly Income + Expense Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl bg-green-600 p-5 text-white shadow-lg">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
            {messages.dashboard.monthlyIncome}
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            ৳ {monthlyIncome.toLocaleString()}
          </h2>
          <p className="mt-2 text-sm opacity-60">
            {messages.dashboard.currentMonthIncome}
          </p>

          {!monthlyLoading && incomeChange !== null && (
            <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
              {incomeChange >= 0 ? (
                <ArrowUp size={11} className="text-green-200" />
              ) : (
                <ArrowDown size={11} className="text-red-300" />
              )}
              <span
                className={`text-xs font-semibold ${
                  incomeChange >= 0 ? "text-green-100" : "text-red-300"
                }`}
              >
                {Math.abs(incomeChange).toFixed(1)}%
              </span>
              <span className="text-[11px] opacity-70">
                vs {previousMonthLabel}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-black p-5 text-white shadow-lg">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
            {messages.dashboard.monthlyExpense}
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            ৳ {monthlyExpense.toLocaleString()}
          </h2>
          <p className="mt-2 text-sm opacity-60">
            {messages.dashboard.currentMonthExpense}
          </p>

          {!monthlyLoading && expenseChange !== null && (
            <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
              {expenseChange >= 0 ? (
                <ArrowUp size={11} className="text-red-300" />
              ) : (
                <ArrowDown size={11} className="text-green-300" />
              )}
              <span
                className={`text-xs font-semibold ${
                  expenseChange >= 0 ? "text-red-300" : "text-green-300"
                }`}
              >
                {Math.abs(expenseChange).toFixed(1)}%
              </span>
              <span className="text-[11px] opacity-70">
                vs {previousMonthLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Member Contributions */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {messages.dashboard.memberContribution}
          </h2>
          <span className="text-xs text-gray-400">{selectedMonthLabel}</span>
        </div>

        <div className="mt-4 space-y-3">
          {monthlyLoading ? (
            <p className="text-sm text-gray-400">{messages.common.loading}</p>
          ) : memberTotals.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <p className="text-sm text-gray-500">
                {messages.dashboard.noExpenses}
              </p>
            </div>
          ) : (
            memberTotals.map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4 transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium">{member.name}</p>
                </div>
                <p className="text-lg font-bold">
                  ৳ {member.amount.toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Transactions — always latest 5, never month-filtered */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">
          {messages.dashboard.recentTransactions}
        </h2>

        {recentTransactions.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-center">
            <p className="text-sm text-gray-500">
              {messages.dashboard.noExpenses}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={`${tx.type}-${tx.id}`}
                className="rounded-2xl bg-gray-50 p-4 transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-xl font-bold ${
                        tx.type === "income" ? "text-green-600" : "text-black"
                      }`}
                    >
                      {tx.type === "income" ? "+" : ""}৳{" "}
                      {tx.amount.toLocaleString()}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {tx.type === "income"
                        ? messages.transactions.income
                        : (tx.categoryName ?? "-")}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {tx.type === "expense"
                        ? messages.transactions.spentBy
                        : messages.transactions.receivedBy}
                      :{" "}
                      <span className="font-medium">
                        {tx.personName ?? "-"}
                      </span>
                    </p>
                  </div>

                  <p className="shrink-0 text-xs text-gray-400">
                    {new Date(tx.date).toLocaleDateString(
                      language === "bn" ? "bn-BD" : "en-US",
                      { day: "2-digit", month: "short", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
