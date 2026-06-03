"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Search } from "lucide-react";
import type { EmailTemplate } from "@/lib/gst-types";

interface AdminUser { id: string; name: string; email: string }

export default function AdminEmailTemplatesPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<EmailTemplate[]>([]);
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
    const res = await fetch(`/api/email-templates?adminUserId=${uid}`);
    const data = await res.json();
    setItems(data.data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.subject.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Mail className="w-6 h-6 text-indigo-600" /> Email Templates (Admin)</h1>
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
            <span className="text-sm text-gray-500">{filtered.length} templates</span>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No email templates found</div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((t) => (
                <div key={t.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{t.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">{t.type}</span>
                      {t.isDefault && <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Default</span>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Subject: {t.subject}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{t.body}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!selectedClient && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a client to view their email templates</p>
        </div>
      )}
    </div>
  );
}
