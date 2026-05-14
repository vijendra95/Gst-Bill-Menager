"use client";

import { useState, useEffect, useRef } from "react";
import { Truck, Trash2, XCircle, Search } from "lucide-react";
import type { EWayBill } from "@/lib/gst-types";

interface AdminBill extends EWayBill { clientName: string; clientEmail: string }

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
};

export default function AdminEWayBillsPage() {
  const [bills, setBills] = useState<AdminBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const didFetch = useRef(false);
  const load = () => {
    setLoading(true);
    fetch("/api/admin/eway-bills").then((r) => r.json())
      .then((res) => setBills(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (didFetch.current) return; didFetch.current = true; load(); }, []);

  const handleCancel = async (bill: AdminBill) => {
    if (!confirm("Cancel this E-Way Bill?")) return;
    await fetch("/api/admin/eway-bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", userId: bill.userId, id: bill.id }),
    });
    load();
  };

  const handleDelete = async (bill: AdminBill) => {
    if (!confirm("Delete this E-Way Bill?")) return;
    await fetch("/api/admin/eway-bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", userId: bill.userId, id: bill.id }),
    });
    load();
  };

  const filtered = bills.filter((b) =>
    b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.clientName.toLowerCase().includes(search.toLowerCase()) ||
    b.vehicleNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All E-Way Bills</h1>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search by invoice, client, vehicle..." />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{bills.filter((b) => b.status === "active").length}</p>
          <p className="text-xs text-green-600 font-medium">Active</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{bills.filter((b) => b.status === "cancelled").length}</p>
          <p className="text-xs text-red-600 font-medium">Cancelled</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{bills.filter((b) => b.status === "expired").length}</p>
          <p className="text-xs text-gray-600 font-medium">Expired</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Invoice #</th>
                <th className="text-left p-3 font-medium">Vehicle</th>
                <th className="text-left p-3 font-medium">Route</th>
                <th className="text-left p-3 font-medium">Transport</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bill) => (
                <tr key={bill.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-xs">{bill.clientName}</div>
                    <div className="text-xs text-gray-400">{bill.clientEmail}</div>
                  </td>
                  <td className="p-3 font-mono text-xs">{bill.invoiceNumber}</td>
                  <td className="p-3 font-bold text-xs">{bill.vehicleNumber || "-"}</td>
                  <td className="p-3 text-xs">{bill.fromState} → {bill.toState} ({bill.distance} km)</td>
                  <td className="p-3 text-xs">
                    {bill.transporterName || "-"}<br />
                    <span className="text-gray-400 capitalize">{bill.transportMode}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[bill.status] || ""}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {bill.status === "active" && (
                      <button onClick={() => handleCancel(bill)} className="p-1.5 hover:bg-orange-50 rounded text-orange-600" title="Cancel"><XCircle className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handleDelete(bill)} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400"><Truck className="w-8 h-8 mx-auto mb-2" />No E-Way Bills</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
