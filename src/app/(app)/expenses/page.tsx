"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/browser-client";

import PageHeader from "@/components/layout/page-header";

import { useLanguage } from "@/context/language-context";

const supabase = createClient();

type Expense = {
  id: string;
  amount: number;
  note: string | null;
  expense_date: string;
  created_by: string;
  category_id: string;

  spenderName?: string;
  categoryName?: string;
};

type User = {
  id: string;
  full_name: string;
};

type Category = {
  id: string;
  name: string;
};

export default function ExpensesPage() {
  const { messages } = useLanguage();

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      // Load expenses
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
        .order("created_at", {
          ascending: false,
        });

      if (expenseError) {
        console.error(expenseError);
        return;
      }

      // Load users
      const { data: usersData, error: usersError } = await supabase.from(
        "users"
      ).select(`
          id,
          full_name
        `);

      if (usersError) {
        console.error(usersError);
        return;
      }

      // Load categories
      const { data: categoriesData, error: categoriesError } =
        await supabase.from("expense_categories").select(`
          id,
          name
        `);

      if (categoriesError) {
        console.error(categoriesError);
        return;
      }

      // Create user map
      const userMap: Record<string, string> = {};

      (usersData as User[])?.forEach((user) => {
        userMap[user.id] = user.full_name;
      });

      // Create category map
      const categoryMap: Record<string, string> = {};

      (categoriesData as Category[])?.forEach((category) => {
        categoryMap[category.id] = category.name;
      });

      // Merge all data
      const formattedExpenses =
        (expenseData as Expense[])?.map((expense) => ({
          ...expense,

          spenderName: userMap[expense.created_by] || "-",

          categoryName: categoryMap[expense.category_id] || "-",
        })) || [];

      setExpenses(formattedExpenses);
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
        title={messages.expenses.title}
        subtitle={messages.expenses.subtitle}
      />

      <div className="space-y-4 px-4">
        {expenses.length === 0 ? (
          <div className="rounded-3xl border bg-white p-10 text-center text-gray-500 shadow-sm">
            {messages.expenses.noExpenses}
          </div>
        ) : (
          expenses.map((expense) => (
            <Link
              key={expense.id}
              href={`/expenses/${expense.id}`}
              className="block rounded-3xl border bg-white p-5 shadow-sm transition active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Amount */}
                  <h2 className="text-3xl font-bold text-black">
                    ৳ {expense.amount}
                  </h2>

                  {/* Category */}
                  <p className="mt-2 text-base text-gray-700">
                    {expense.categoryName}
                  </p>

                  {/* Spender */}
                  <p className="mt-3 text-sm text-gray-500">
                    {messages.expenses.spentBy}:{" "}
                    <span className="font-medium text-gray-700">
                      {expense.spenderName}
                    </span>
                  </p>

                  {/* Note */}
                  {expense.note && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                      {expense.note}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="shrink-0">
                  <p className="text-sm text-gray-400">
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        href="/expenses/add"
        className="fixed right-4 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-xl transition active:scale-95"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
