"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";
import type { Invoice, Expense } from "@/lib/gst-types";
import { formatCurrency } from "@/lib/gst-utils";

interface AdminUser { id: string; name: string; email: string }

export default function AdminProfitLossPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetch("/api/admin/clients").then((r) => r.json()).then((res) => setClients(res.data || [])).finally(() => setLoading(false));
  }, []);

  const loadData = async (uid: string) => {
    setSelectedClient(uid);
    setLoading(true);
    const [iRes, eRes] = await Promise.all([
      fetch(`/api/invoices?adminUserId=${uid}`).then((r) => r.json()),
      fetch(`/api/expenses?adminUserId=${uid}`).then((r) => r.json()),
    ]);
    setInvoices(iRes.data || []);
    setExpenses(eRes.data || []);
    setLoading(false);
  };

  const totalIncome = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const profit = totalIncome - totalExpenses;

  const monthlyData: Record<string, { income: number; expense: number }> = {};
  invoices.forEach((inv) => {
    const m = inv.date.substring(0, 7);
    if (!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0 };
    monthlyData[m].income += inv.grandTotal;
  });
  expenses.forEach((exp) => {
    const m = exp.date.substring(0, 7);
    if (!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0 };
    monthlyData[m].expense += exp.totalAmount;
  });
  const months = Object.keys(monthlyData).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-indigo-600" /> Profit & Loss (Admin)</h1>
        <select value={selectedClient} onChange={(e) => loadData(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      {selectedClient && !loading && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl p-5 bg-white border shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.length} invoices</p>
            </div>
            <div className="rounded-xl p-5 bg-white border shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-gray-400 mt-1">{expenses.length} entries</p>
            </div>
            <div className="rounded-xl p-5 bg-white border shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Net Profit / Loss</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(Math.abs(profit))}</p>
              <p className="text-xs text-gray-400 mt-1">{profit >= 0 ? "Profit" : "Loss"}</p>
            </div>
          </div>

          {months.length > 0 && (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b text-left text-gray-500">
                  <th className="px-4 py-3">Month</th><th className="px-4 py-3">Income</th><th className="px-4 py-3">Expenses</th><th className="px-4 py-3">Net</th>
                </tr></thead>
                <tbody>
                  {months.map((m) => {
                    const d = monthlyData[m];
                    const net = d.income - d.expense;
                    return (
                      <tr key={m} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{m}</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">{formatCurrency(d.income)}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold">{formatCurrency(d.expense)}</td>
                        <td className={`px-4 py-3 font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(Math.abs(net))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedClient && loading && <div className="text-center py-12 text-gray-500">Loading...</div>}

      {!selectedClient && !loading && (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a client to view their profit & loss</p>
        </div>
      )}
    </div>
  );
}
