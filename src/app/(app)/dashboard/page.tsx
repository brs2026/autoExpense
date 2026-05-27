"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/browser-client";

import PageHeader from "@/components/layout/page-header";

import { useLanguage } from "@/context/language-context";

const supabase = createClient();

type Expense = {
  id: string;
  amount: number;
  note: string | null;
  expense_date: string;

  expense_categories:
    | {
        name: string;
      }[]
    | null;

  users:
    | {
        full_name: string;
      }[]
    | null;
};

type MemberTotal = {
  name: string;
  amount: number;
};

export default function DashboardPage() {
  const { messages } = useLanguage();

  const [monthlyExpense, setMonthlyExpense] = useState(0);

  const [totalExpenses, setTotalExpenses] = useState(0);

  const [totalCategories, setTotalCategories] = useState(0);

  const [myTotal, setMyTotal] = useState(0);

  const [memberTotals, setMemberTotals] = useState<MemberTotal[]>([]);

  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);

    try {
      // Logged In User
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Current Month Start
      const now = new Date();

      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // Monthly Expense
      const { data: monthlyData } = await supabase
        .from("expenses")
        .select("amount")
        .eq("is_deleted", false)
        .gte("expense_date", firstDay);

      const monthlyTotal =
        monthlyData?.reduce((sum, item) => sum + item.amount, 0) || 0;

      setMonthlyExpense(monthlyTotal);

      // Expense Count
      const { count: expenseCount } = await supabase
        .from("expenses")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_deleted", false);

      setTotalExpenses(expenseCount || 0);

      // Category Count
      const { count: categoryCount } = await supabase
        .from("expense_categories")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_active", true);

      setTotalCategories(categoryCount || 0);

      // Recent Expenses
      const { data: recentData } = await supabase
        .from("expenses")
        .select(
          `
          id,
          amount,
          note,
          expense_date,

          expense_categories (
            name
          ),

          users (
            full_name
          )
        `
        )
        .eq("is_deleted", false)
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      setRecentExpenses((recentData || []) as Expense[]);

      // My Spending
      if (user) {
        const { data: myExpenses } = await supabase
          .from("expenses")
          .select("amount")
          .eq("created_by", user.id)
          .eq("is_deleted", false);

        const total =
          myExpenses?.reduce((sum, item) => sum + item.amount, 0) || 0;

        setMyTotal(total);
      }

      // Member Contributions
      const { data: memberExpenses } = await supabase
        .from("expenses")
        .select(
          `
          amount,

          users (
            full_name
          )
        `
        )
        .eq("is_deleted", false);

      const grouped: Record<string, number> = {};

      memberExpenses?.forEach((item: any) => {
        const name = item.users?.full_name || "Unknown";

        grouped[name] = (grouped[name] || 0) + item.amount;
      });

      const totals = Object.entries(grouped).map(([name, amount]) => ({
        name,
        amount,
      }));

      setMemberTotals(totals as MemberTotal[]);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 px-4 pb-28">
      {/* Header */}
      <PageHeader
        title={messages.dashboard.title}
        subtitle={messages.dashboard.subtitle}
      />

      {/* Monthly Expense */}
      <div className="rounded-3xl bg-black p-6 text-white shadow-lg">
        <p className="text-sm opacity-80">
          {messages.dashboard.monthlyExpense}
        </p>

        <h2 className="mt-3 text-5xl font-bold">৳ {monthlyExpense}</h2>

        <p className="mt-2 text-sm opacity-70">
          {messages.dashboard.currentMonthExpense}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            {messages.dashboard.totalExpenses}
          </p>

          <h3 className="mt-2 text-3xl font-bold">{totalExpenses}</h3>
        </div>

        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            {messages.dashboard.categories}
          </p>

          <h3 className="mt-2 text-3xl font-bold">{totalCategories}</h3>
        </div>
      </div>

      {/* My Spending */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">
          {messages.dashboard.yourSpending}
        </p>

        <h2 className="mt-2 text-4xl font-bold">৳ {myTotal}</h2>
      </div>

      {/* Member Contributions */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {messages.dashboard.memberContribution}
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {memberTotals.map((member) => (
            <div
              key={member.name}
              className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  {member.name?.charAt(0)?.toUpperCase()}
                </div>

                <p className="font-medium">{member.name}</p>
              </div>

              <p className="text-lg font-bold">৳ {member.amount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {messages.dashboard.recentExpenses}
          </h2>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-gray-500">
            {messages.common.loading}
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-center">
            <p className="text-sm text-gray-500">
              {messages.dashboard.noExpenses}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold">৳ {expense.amount}</p>

                    <p className="mt-1 text-sm text-gray-600">
                      {expense.expense_categories?.[0]?.name || "-"}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {messages.expenses.spentBy}:{" "}
                      <span className="font-medium">
                        {expense.users?.[0]?.full_name || "-"}
                      </span>
                    </p>
                  </div>

                  <p className="text-xs text-gray-400">
                    {new Date(expense.expense_date).toLocaleDateString()}
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
