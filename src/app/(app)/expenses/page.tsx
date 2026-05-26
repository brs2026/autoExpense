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
  note: string;
  expense_date: string;

  expense_categories: {
    name: string;
  } | null;
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
      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
          id,
          amount,
          note,
          expense_date,
          expense_categories (
            name
          )
        `
        )
        .eq("is_deleted", false)
        .order("expense_date", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setExpenses(data);
      }
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
    <div className="space-y-6">
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
              className="block rounded-3xl border bg-white p-4 shadow-sm transition active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">৳ {expense.amount}</h2>

                  <p className="mt-1 text-gray-600">
                    {expense.expense_categories?.name || "-"}
                  </p>

                  {expense.note && (
                    <p className="mt-3 text-sm text-gray-500">{expense.note}</p>
                  )}
                </div>

                <p className="text-sm text-gray-400">{expense.expense_date}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        href="/expenses/add"
        className="fixed right-4 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition active:scale-95"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
