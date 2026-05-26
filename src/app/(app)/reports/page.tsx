"use client";

import { useEffect, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { createClient } from "@/lib/supabase/browser-client";

import PageHeader from "@/components/layout/page-header";

import { useLanguage } from "@/context/language-context";

const supabase = createClient();

const COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#84CC16", // lime
];

type CategoryReport = {
  name: string;
  total: number;
};

type MonthlyReport = {
  month: string;
  total: number;
};

export default function ReportsPage() {
  const { messages } = useLanguage();

  const [categoryData, setCategoryData] = useState<CategoryReport[]>([]);

  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);

  const [totalExpense, setTotalExpense] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from("expenses")
      .select(
        `
        amount,
        expense_date,
        expense_categories (
          name
        )
      `
      )
      .eq("is_deleted", false);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Total Expense
    const total = data.reduce((sum, item) => sum + item.amount, 0);

    setTotalExpense(total);

    // Category Breakdown
    const groupedCategories: Record<string, number> = {};

    data.forEach((item) => {
      const category = item.expense_categories?.name || "Unknown";

      groupedCategories[category] =
        (groupedCategories[category] || 0) + item.amount;
    });

    const categoryResult = Object.entries(groupedCategories).map(
      ([name, total]) => ({
        name,
        total,
      })
    );

    setCategoryData(categoryResult);

    // Monthly Report
    const groupedMonths: Record<string, number> = {};

    data.forEach((item) => {
      const month = new Date(item.expense_date).toLocaleString(
        messages.language === "bn" ? "bn-BD" : "en-US",
        {
          month: "short",
        }
      );

      groupedMonths[month] = (groupedMonths[month] || 0) + item.amount;
    });

    const monthlyResult = Object.entries(groupedMonths).map(
      ([month, total]) => ({
        month,
        total,
      })
    );

    setMonthlyData(monthlyResult);

    setLoading(false);
  }

  if (loading) {
    return <div className="p-4">{messages.common.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.reports.title}
        subtitle={messages.reports.subtitle}
      />

      {/* Total Expense */}
      <div className="px-4">
        <div className="rounded-3xl bg-black p-6 text-white">
          <p className="text-sm opacity-70">{messages.reports.totalExpense}</p>

          <h2 className="mt-2 text-5xl font-bold">৳ {totalExpense}</h2>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="px-4">
        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            {messages.reports.monthlyExpenses}
          </h2>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="total" fill="#3B82F6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-4 pb-10">
        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            {messages.reports.categoryBreakdown}
          </h2>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            {categoryData.map((category, index) => (
              <div
                key={category.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />

                  <p className="text-sm">{category.name}</p>
                </div>

                <p className="text-sm font-medium">৳ {category.total}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
