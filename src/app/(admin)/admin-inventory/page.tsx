"use client";

import { useState, useEffect, useRef } from "react";
import { Package, Trash2, AlertTriangle, Search } from "lucide-react";
import type { InventoryItem } from "@/lib/gst-types";

interface AdminItem extends InventoryItem { clientName: string; clientEmail: string }

export default function AdminInventoryPage() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [lowStock, setLowStock] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const didFetch = useRef(false);
  const load = () => {
    setLoading(true);
    fetch("/api/admin/inventory").then((r) => r.json())
      .then((res) => { setItems(res.data?.items || []); setLowStock(res.data?.lowStock || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (didFetch.current) return; didFetch.current = true; load(); }, []);

  const handleDelete = async (item: AdminItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_item", userId: item.userId, id: item.id }),
    });
    load();
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.clientName.toLowerCase().includes(search.toLowerCase()) ||
    i.hsn.includes(search)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Inventory Items</h1>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
            <AlertTriangle className="w-4 h-4" /> Low Stock Alert ({lowStock.length} items across all clients)
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i) => (
              <span key={i.id} className="px-3 py-1 bg-amber-100 rounded-full text-xs font-medium text-amber-800">
                {i.clientName}: {i.name} ({i.currentStock} {i.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search by item or client..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Item Name</th>
                <th className="text-left p-3 font-medium">HSN</th>
                <th className="text-right p-3 font-medium">Stock</th>
                <th className="text-right p-3 font-medium">Purchase ₹</th>
                <th className="text-right p-3 font-medium">Selling ₹</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-xs">{item.clientName}</div>
                    <div className="text-xs text-gray-400">{item.clientEmail}</div>
                  </td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 font-mono text-xs text-gray-500">{item.hsn || "-"}</td>
                  <td className={`p-3 text-right font-bold ${item.currentStock <= item.lowStockAlert ? "text-red-600" : ""}`}>
                    {item.currentStock} {item.unit}
                    {item.currentStock <= item.lowStockAlert && <AlertTriangle className="inline w-3 h-3 ml-1 text-amber-500" />}
                  </td>
                  <td className="p-3 text-right">₹{item.purchasePrice.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right">₹{item.sellingPrice.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400"><Package className="w-8 h-8 mx-auto mb-2" />No inventory items</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
