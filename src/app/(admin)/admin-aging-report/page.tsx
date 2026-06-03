"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import type { Invoice } from "@/lib/gst-types";
import { formatCurrency, formatDate } from "@/lib/gst-utils";

interface AdminUser { id: string; name: string; email: string }

export default function AdminAgingReportPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
    const res = await fetch(`/api/invoices?adminUserId=${uid}`);
    const data = await res.json();
    setInvoices(data.data || []);
    setLoading(false);
  };

  const unpaid = invoices.filter((i) => i.status !== "paid");
  const now = Date.now();
  const getDays = (d: string) => Math.floor((now - new Date(d).getTime()) / 86400000);

  const buckets = {
    "0-30": unpaid.filter((i) => getDays(i.date) <= 30),
    "31-60": unpaid.filter((i) => { const d = getDays(i.date); return d > 30 && d <= 60; }),
    "61-90": unpaid.filter((i) => { const d = getDays(i.date); return d > 60 && d <= 90; }),
    "90+": unpaid.filter((i) => getDays(i.date) > 90),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Clock className="w-6 h-6 text-indigo-600" /> Aging Report (Admin)</h1>
        <select value={selectedClient} onChange={(e) => loadData(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      {selectedClient && !loading && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Object.entries(buckets).map(([label, items]) => (
              <div key={label} className="rounded-xl p-4 bg-white border shadow-sm">
                <p className="text-xs text-gray-500">{label} Days</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(items.reduce((s, i) => s + i.grandTotal, 0))}</p>
                <p className="text-xs text-gray-400">{items.length} invoices</p>
              </div>
            ))}
          </div>

          {unpaid.length > 0 ? (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b text-left text-gray-500">
                  <th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Days</th>
                </tr></thead>
                <tbody>
                  {unpaid.sort((a, b) => getDays(b.date) - getDays(a.date)).map((i) => {
                    const days = getDays(i.date);
                    return (
                      <tr key={i.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-medium">{i.invoiceNumber}</td>
                        <td className="px-4 py-3 font-medium">{i.customer.name}</td>
                        <td className="px-4 py-3">{formatDate(i.date)}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(i.grandTotal)}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${days <= 30 ? "bg-green-100 text-green-700" : days <= 60 ? "bg-yellow-100 text-yellow-700" : days <= 90 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>{days} days</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">No unpaid invoices</div>
          )}
        </>
      )}

      {selectedClient && loading && <div className="text-center py-12 text-gray-500">Loading...</div>}

      {!selectedClient && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a client to view their aging report</p>
        </div>
      )}
    </div>
  );
}
