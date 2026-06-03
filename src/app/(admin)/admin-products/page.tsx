"use client";

import { useState, useEffect, useRef } from "react";
import { Package, Search } from "lucide-react";
import type { Product } from "@/lib/gst-types";
import { formatCurrency } from "@/lib/gst-utils";

interface AdminUser { id: string; name: string; email: string }

export default function AdminProductsPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<Product[]>([]);
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
    const res = await fetch(`/api/products?adminUserId=${uid}`);
    const data = await res.json();
    setItems(data.data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.hsn.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Package className="w-6 h-6 text-indigo-600" /> Products (Admin)</h1>
        <select value={selectedClient} onChange={(e) => loadData(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      {selectedClient && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or HSN..." className="pl-10 pr-4 py-2 w-full border rounded-lg text-sm" />
            </div>
            <span className="text-sm text-gray-500">{filtered.length} products</span>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No products found</div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b text-left text-gray-500">
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">HSN/SAC</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Rate</th><th className="px-4 py-3">GST %</th><th className="px-4 py-3">Unit</th>
                </tr></thead>
                <tbody>
                  {filtered.map((i) => (
                    <tr key={i.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{i.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{i.hsn}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${i.type === "goods" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{i.type}</span></td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(i.rate)}</td>
                      <td className="px-4 py-3">{i.gstRate}%</td>
                      <td className="px-4 py-3 text-gray-500">{i.unit}</td>
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
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a client to view their products</p>
        </div>
      )}
    </div>
  );
}
