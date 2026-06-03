"use client";

import { useState, useEffect, useRef } from "react";
import { Receipt, Search, Trash2, Users } from "lucide-react";
import type { Expense } from "@/lib/gst-types";
import { EXPENSE_CATEGORIES } from "@/lib/gst-types";
import { formatCurrency, formatDate } from "@/lib/gst-utils";

interface AdminUser { id: string; name: string; email: string }

export default function AdminExpensesPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetch("/api/admin/clients").then((r) => r.json()).then((res) => setClients(res.data || [])).finally(() => setLoading(false));
  }, []);

  const loadExpenses = async (uid: string) => {
    setSelectedClient(uid);
    setLoading(true);
    const res = await fetch(`/api/expenses?adminUserId=${uid}`);
    const data = await res.json();
    setItems(data.data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.description.toLowerCase().includes(q) || (i.vendorName || "").toLowerCase().includes(q);
  });

  const total = filtered.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Expenses (Admin)</h1>
        <select value={selectedClient} onChange={(e) => loadExpenses(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      {selectedClient && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl p-4 bg-white border shadow-sm">
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(total)}</p>
            </div>
            <div className="rounded-xl p-4 bg-white border shadow-sm">
              <p className="text-xs text-gray-500">Entries</p>
              <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
            </div>
            <div className="rounded-xl p-4 bg-white border shadow-sm">
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-lg font-bold text-gray-900">{new Set(items.map((i) => i.category)).size}</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {loading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div> :
            filtered.length === 0 ? <div className="p-8 text-center text-gray-400">No expenses</div> : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{formatDate(e.date)}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{EXPENSE_CATEGORIES[e.category]}</span></td>
                      <td className="px-4 py-3 font-medium">{e.description}</td>
                      <td className="px-4 py-3 text-gray-500">{e.vendorName || "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(e.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!selectedClient && (
        <div className="p-12 text-center bg-white rounded-2xl border">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Select a client to view their expenses</p>
        </div>
      )}
    </div>
  );
}
