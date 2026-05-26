"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/browser-client";

const supabase = createClient();

type Expense = {
  id: string;
  amount: number;
  note: string | null;
  expense_date: string;
  expense_categories: {
    name: string;
  } | null;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();

    const channel = supabase
      .channel("expenses-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        () => {
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);

      const { data, error } = await supabase
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
        });

      if (error) {
        console.error(error);
        return;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-4 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Expenses
        </h1>

        <p className="text-gray-500">
          Manage all expenses
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border bg-white p-4 text-center text-gray-500 shadow-sm">
          Loading expenses...
        </div>
      )}

      {/* Empty State */}
      {!loading && expenses.length === 0 && (
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">
            No expenses added yet
          </p>
        </div>
      )}

      {/* Expense List */}
      <div className="space-y-4">
        {!loading &&
          expenses.map((expense) => (
            <Link
              key={expense.id}
              href={`/expenses/${expense.id}`}
              className="block rounded-2xl border bg-white p-4 shadow-sm transition active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">
                    ৳ {expense.amount}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {expense.expense_categories?.name ||
                      "Uncategorized"}
                  </p>
                </div>

                <p className="text-sm text-gray-400">
                  {new Date(
                    expense.expense_date
                  ).toLocaleDateString()}
                </p>
              </div>

              {expense.note && (
                <p className="mt-3 text-sm text-gray-600">
                  {expense.note}
                </p>
              )}
            </Link>
          ))}
      </div>

      {/* Floating Add Button */}
      <Link
        href="/expenses/add"
        className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}