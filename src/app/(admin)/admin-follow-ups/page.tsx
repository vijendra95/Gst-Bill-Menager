"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Search } from "lucide-react";
import type { FollowUpReminder } from "@/lib/gst-types";
import { formatDate } from "@/lib/gst-utils";

interface AdminUser { id: string; name: string; email: string }

export default function AdminFollowUpsPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<FollowUpReminder[]>([]);
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
    const res = await fetch(`/api/follow-ups?adminUserId=${uid}`);
    const data = await res.json();
    setItems(data.data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.title.toLowerCase().includes(q) || (i.relatedName || "").toLowerCase().includes(q);
  });

  const priorityColors: Record<string, string> = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Bell className="w-6 h-6 text-indigo-600" /> Follow-ups (Admin)</h1>
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
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-10 pr-4 py-2 w-full border rounded-lg text-sm" />
            </div>
            <span className="text-sm text-gray-500">{filtered.length} records</span>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No follow-ups found</div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b text-left text-gray-500">
                  <th className="px-4 py-3">Contact</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Notes</th>
                </tr></thead>
                <tbody>
                  {filtered.map((i) => (
                    <tr key={i.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{i.title}</td>
                      <td className="px-4 py-3">{formatDate(i.dueDate)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[i.priority] || "bg-gray-100 text-gray-600"}`}>{i.priority}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${i.status === "completed" ? "bg-green-100 text-green-700" : i.status === "overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{i.status}</span></td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{i.description || "-"}</td>
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
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a client to view their follow-ups</p>
        </div>
      )}
    </div>
  );
}
