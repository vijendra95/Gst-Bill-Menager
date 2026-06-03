"use client";

import { useState, useEffect, useRef } from "react";
import { UserCheck, Search, Users } from "lucide-react";
import type { Employee } from "@/lib/gst-types";
import { formatCurrency, formatDate } from "@/lib/gst-utils";

interface AdminUser { id: string; name: string; email: string }

export default function AdminEmployeesPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<Employee[]>([]);
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
    const res = await fetch(`/api/employees?adminUserId=${uid}`);
    setItems((await res.json()).data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.department.toLowerCase().includes(q) || i.empId.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Employees (Admin)</h1>
        <select value={selectedClient} onChange={(e) => loadData(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Select Client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      {selectedClient ? (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl p-4 bg-white border shadow-sm"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{items.length}</p></div>
            <div className="rounded-xl p-4 bg-white border shadow-sm"><p className="text-xs text-gray-500">Active</p><p className="text-lg font-bold text-emerald-600">{items.filter((i) => i.status === "active").length}</p></div>
            <div className="rounded-xl p-4 bg-white border shadow-sm"><p className="text-xs text-gray-500">Monthly Payroll</p><p className="text-lg font-bold">{formatCurrency(items.filter((i) => i.status === "active").reduce((s, i) => s + i.salary, 0))}</p></div>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {loading ? <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div> :
            filtered.length === 0 ? <div className="p-8 text-center text-gray-400">No employees</div> : (
              <div className="divide-y">
                {filtered.map((emp) => (
                  <div key={emp.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">{emp.name.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{emp.name} <span className="text-gray-400 text-xs">({emp.empId})</span></p>
                      <p className="text-xs text-gray-500">{emp.department} · {emp.designation}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(emp.salary)}/mo</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${emp.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{emp.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Select a client to view their employees</p>
        </div>
      )}
    </div>
  );
}
