"use client";

import { useState, useEffect, useRef } from "react";
import { FolderOpen, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/gst-utils";

interface StoredBill {
  id: string; type: "sales" | "purchase" | "other"; billNumber: string;
  partyName: string; amount: number; gstAmount: number; date: string;
  month: string; year: number; category: string; notes: string; createdAt: string;
}

interface AdminUser { id: string; name: string; email: string }

export default function AdminBillManagerPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<StoredBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetch("/api/admin/clients").then((r) => r.json()).then((res) => setClients(res.data || [])).finally(() => setLoading(false));
  }, []);

  const loadData = async (uid: string) => {
    setSelectedClient(uid);
    setLoading(true);
    const res = await fetch(`/api/bill-storage?adminUserId=${uid}`);
    const data = await res.json();
    setItems(data.data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.partyName.toLowerCase().includes(q) || i.billNumber.toLowerCase().includes(q);
  });

  const total = filtered.reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FolderOpen className="w-6 h-6 text-indigo-600" /> Bill Manager (Admin)</h1>
        <select value={selectedClient} onChange={(e) => loadData(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      {selectedClient && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl p-4 bg-white border shadow-sm">
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
            <div className="rounded-xl p-4 bg-white border shadow-sm">
              <p className="text-xs text-gray-500">Bills</p>
              <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
            </div>
            <div className="rounded-xl p-4 bg-white border shadow-sm">
              <p className="text-xs text-gray-500">Purchase</p>
              <p className="text-lg font-bold text-orange-600">{filtered.filter((i) => i.type === "purchase").length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search party or bill number..." className="pl-10 pr-4 py-2 w-full border rounded-lg text-sm" />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No bills found</div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b text-left text-gray-500">
                  <th className="px-4 py-3">Party</th><th className="px-4 py-3">Bill #</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Month</th><th className="px-4 py-3">Date</th>
                </tr></thead>
                <tbody>
                  {filtered.map((i) => (
                    <tr key={i.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{i.partyName}</td>
                      <td className="px-4 py-3">{i.billNumber || "-"}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${i.type === "sales" ? "bg-green-100 text-green-700" : i.type === "purchase" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{i.type}</span></td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(i.amount)}</td>
                      <td className="px-4 py-3">{i.month} {i.year}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(i.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!selectedClient && !loading && (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a client to view their stored bills</p>
        </div>
      )}
    </div>
  );
}
