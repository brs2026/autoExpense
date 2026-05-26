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

const supabase = createClient();

const COLORS = [
  "#000000",
  "#444444",
  "#666666",
  "#888888",
  "#AAAAAA",
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
  const [categoryData, setCategoryData] =
    useState<CategoryReport[]>([]);

  const [monthlyData, setMonthlyData] =
    useState<MonthlyReport[]>([]);

  const [totalExpense, setTotalExpense] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        amount,
        expense_date,
        expense_categories (
          name
        )
      `)
      .eq("is_deleted", false);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Total Expense
    const total = data.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    setTotalExpense(total);

    // Category Breakdown
    const groupedCategories: Record<
      string,
      number
    > = {};

    data.forEach((item) => {
      const category =
        item.expense_categories?.name ||
        "Unknown";

      groupedCategories[category] =
        (groupedCategories[category] || 0) +
        item.amount;
    });

    const categoryResult =
      Object.entries(groupedCategories).map(
        ([name, total]) => ({
          name,
          total,
        })
      );

    setCategoryData(categoryResult);

    // Monthly Report
    const groupedMonths: Record<
      string,
      number
    > = {};

    data.forEach((item) => {
      const month = new Date(
        item.expense_date
      ).toLocaleString("default", {
        month: "short",
      });

      groupedMonths[month] =
        (groupedMonths[month] || 0) +
        item.amount;
    });

    const monthlyResult =
      Object.entries(groupedMonths).map(
        ([month, total]) => ({
          month,
          total,
        })
      );

    setMonthlyData(monthlyResult);

    setLoading(false);
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Reports
        </h1>

        <p className="text-gray-500">
          Expense analytics overview
        </p>
      </div>

      {/* Total Expense */}
      <div className="rounded-3xl bg-black p-6 text-white">
        <p className="text-sm opacity-70">
          Total Expense
        </p>

        <h2 className="mt-2 text-5xl font-bold">
          ৳ {totalExpense}
        </h2>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-4 text-center">
          Loading reports...
        </div>
      ) : (
        <>
          {/* Monthly Chart */}
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              Monthly Expenses
            </h2>

            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="total"
                    fill="#000000"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Chart */}
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              Category Breakdown
            </h2>

            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {categoryData.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            COLORS[
                              index %
                                COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {categoryData.map(
                (category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[
                              index %
                                COLORS.length
                            ],
                        }}
                      />

                      <p className="text-sm">
                        {category.name}
                      </p>
                    </div>

                    <p className="text-sm font-medium">
                      ৳ {category.total}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}