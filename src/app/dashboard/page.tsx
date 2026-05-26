"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser-client";

const supabase = createClient();

type Expense = {
  id: string;
  amount: number;
  note: string;
  expense_date: string;
  expense_categories: {
    name: string;
  } | null;
};

export default function DashboardPage() {
  const [monthlyExpense, setMonthlyExpense] =
    useState(0);

  const [totalExpenses, setTotalExpenses] =
    useState(0);

  const [totalCategories, setTotalCategories] =
    useState(0);

  const [recentExpenses, setRecentExpenses] =
    useState<Expense[]>([]);

  const [loading, setLoading] =
    useState(true);

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

    // Current Month
    const now = new Date();

    const firstDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];

    // Monthly Expense
    const { data: monthlyData } =
      await supabase
        .from("expenses")
        .select("amount")
        .eq("is_deleted", false)
        .gte("expense_date", firstDay);

    const monthlyTotal =
      monthlyData?.reduce(
        (sum, item) => sum + item.amount,
        0
      ) || 0;

    setMonthlyExpense(monthlyTotal);

    // Total Expenses
    const { count: expenseCount } =
      await supabase
        .from("expenses")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_deleted", false);

    setTotalExpenses(expenseCount || 0);

    // Total Categories
    const { count: categoryCount } =
      await supabase
        .from("expense_categories")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_active", true);

    setTotalCategories(categoryCount || 0);

    // Recent Expenses
    const { data: recentData } =
      await supabase
        .from("expenses")
        .select(`
          id,
          amount,
          note,
          expense_date,
          expense_categories (
            name
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

    setRecentExpenses(recentData || []);

    setLoading(false);
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Welcome to AutoExpense
        </p>
      </div>

      {/* Monthly Expense */}
      <div className="rounded-3xl bg-black p-6 text-white shadow-lg">
        <p className="text-sm opacity-80">
          Monthly Expense
        </p>

        <h2 className="mt-3 text-4xl font-bold">
          ৳ {monthlyExpense}
        </h2>

        <p className="mt-2 text-sm opacity-70">
          Current month total expense
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Expenses
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {totalExpenses}
          </h3>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            Categories
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {totalCategories}
          </h3>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Recent Expenses
          </h3>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-gray-500">
            Loading...
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">
              No expenses added yet
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-2xl bg-gray-50 p-3"
              >
                <div>
                  <p className="font-medium">
                    ৳ {expense.amount}
                  </p>

                  <p className="text-sm text-gray-500">
                    {
                      expense
                        .expense_categories
                        ?.name
                    }
                  </p>
                </div>

                <p className="text-xs text-gray-400">
                  {expense.expense_date}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}