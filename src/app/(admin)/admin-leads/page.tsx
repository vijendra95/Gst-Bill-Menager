"use client";

import { useState, useEffect, useRef } from "react";
import { Target, Search, Users } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/gst-types";
import { formatCurrency, formatDate } from "@/lib/gst-utils";

interface AdminUser { id: string; name: string; email: string }

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-blue-100", text: "text-blue-700" },
  contacted: { label: "Contacted", bg: "bg-cyan-100", text: "text-cyan-700" },
  interested: { label: "Interested", bg: "bg-amber-100", text: "text-amber-700" },
  negotiation: { label: "Negotiation", bg: "bg-purple-100", text: "text-purple-700" },
  won: { label: "Won", bg: "bg-emerald-100", text: "text-emerald-700" },
  lost: { label: "Lost", bg: "bg-red-100", text: "text-red-700" },
};

export default function AdminLeadsPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<Lead[]>([]);
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
    const res = await fetch(`/api/leads?adminUserId=${uid}`);
    setItems((await res.json()).data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || (i.company || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Leads (Admin)</h1>
        <select value={selectedClient} onChange={(e) => loadData(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      {selectedClient ? (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl p-4 bg-white border shadow-sm"><p className="text-xs text-gray-500">Total Leads</p><p className="text-lg font-bold">{items.length}</p></div>
            <div className="rounded-xl p-4 bg-white border shadow-sm"><p className="text-xs text-gray-500">Won</p><p className="text-lg font-bold text-emerald-600">{items.filter((i) => i.status === "won").length}</p></div>
            <div className="rounded-xl p-4 bg-white border shadow-sm"><p className="text-xs text-gray-500">Won Value</p><p className="text-lg font-bold text-violet-600">{formatCurrency(items.filter((i) => i.status === "won").reduce((s, i) => s + (i.value || 0), 0))}</p></div>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {loading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div> :
            filtered.length === 0 ? <div className="p-8 text-center text-gray-400">No leads</div> : (
              <div className="divide-y">
                {filtered.map((lead) => {
                  const sc = STATUS_CONFIG[lead.status];
                  return (
                    <div key={lead.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{lead.name} {lead.company && <span className="text-gray-400 text-xs">({lead.company})</span>}</p>
                        <p className="text-xs text-gray-500">{lead.phone} · {lead.email} · {lead.source}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      {lead.value && <p className="font-bold text-sm">{formatCurrency(lead.value)}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Select a client to view their leads</p>
        </div>
      )}
    </div>
  );
}
