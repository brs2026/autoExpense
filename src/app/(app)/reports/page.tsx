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
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

type Expense = {
  amount: number;
  expense_date: string;
  category_id: string;
};

type Category = {
  id: string;
  name: string;
};

type CategoryReport = {
  name: string;
  total: number;
};

type MonthlyReport = {
  month: string;
  total: number;
};

export default function ReportsPage() {
  const { messages, language } = useLanguage();

  const [categoryData, setCategoryData] = useState<CategoryReport[]>([]);

  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);

  const [totalExpense, setTotalExpense] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);

      // Expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select(
          `
          amount,
          expense_date,
          category_id
        `
        )
        .eq("is_deleted", false);

      if (expenseError || !expenseData) {
        console.error(expenseError);

        return;
      }

      // Categories
      const { data: categoriesData, error: categoriesError } =
        await supabase.from("expense_categories").select(`
          id,
          name
        `);

      if (categoriesError) {
        console.error(categoriesError);

        return;
      }

      const expenses = expenseData as Expense[];

      const categories = categoriesData as Category[];

      // Total Expense
      const total = expenses.reduce((sum, item) => sum + item.amount, 0);

      setTotalExpense(total);

      // Category Map
      const categoryMap: Record<string, string> = {};

      categories.forEach((category) => {
        categoryMap[category.id] = category.name;
      });

      // Category Breakdown
      const groupedCategories: Record<string, number> = {};

      expenses.forEach((item) => {
        const category = categoryMap[item.category_id] || "Unknown";

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

      expenses.forEach((item) => {
        const month = new Date(item.expense_date).toLocaleString(
          language === "bn" ? "bn-BD" : "en-US",
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4">{messages.common.loading}</div>;
  }

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title={messages.reports.title}
        subtitle={messages.reports.subtitle}
      />

      {/* Total Expense */}
      <div className="px-4">
        <div className="rounded-3xl bg-black p-6 text-white shadow-lg">
          <p className="text-sm opacity-70">{messages.reports.totalExpense}</p>

          <h2 className="mt-2 text-5xl font-bold">৳ {totalExpense}</h2>
        </div>
      </div>

      {/* Monthly Expenses */}
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
      <div className="px-4">
        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            {messages.reports.categoryBreakdown}
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            {categoryData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />

                  <span className="text-sm">{item.name}</span>
                </div>

                <span className="text-sm font-medium">৳ {item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
