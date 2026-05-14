"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Search, X, Loader2 } from "lucide-react";
import type { Customer } from "@/lib/gst-types";
import { INDIAN_STATES } from "@/lib/gst-types";
import { useAutoSave, loadDraft } from "@/lib/use-auto-save";

function CustomerForm({ customer, onSave, onCancel }: {
  customer?: Customer;
  onSave: (data: Record<string, string | boolean>) => void;
  onCancel: () => void;
}) {
  const draftKey = customer ? `customer_edit_${customer.id}` : "customer_new_draft";
  const saved = useRef(loadDraft<Record<string, string | boolean>>(draftKey));
  const initial = saved.current && !customer ? saved.current : null;
  const [form, setForm] = useState({
    isGst: initial?.isGst ?? (customer?.isGst !== false),
    name: (initial?.name as string) || customer?.name || "",
    address: (initial?.address as string) || customer?.address || "",
    city: (initial?.city as string) || customer?.city || "",
    state: (initial?.state as string) || customer?.state || "",
    stateCode: (initial?.stateCode as string) || customer?.stateCode || "",
    pincode: (initial?.pincode as string) || customer?.pincode || "",
    gstin: (initial?.gstin as string) || customer?.gstin || "",
    pan: (initial?.pan as string) || customer?.pan || "",
    phone: (initial?.phone as string) || customer?.phone || "",
    email: (initial?.email as string) || customer?.email || "",
  });
  const { clearDraft } = useAutoSave(draftKey, form);
  const [gstLookup, setGstLookup] = useState(false);
  const [gstMsg, setGstMsg] = useState("");

  const handleGstinChange = async (val: string) => {
    const upper = val.toUpperCase();
    setForm((f) => {
      const n = { ...f, gstin: upper };
      if (upper.length >= 2) {
        const sc = upper.substring(0, 2);
        if (INDIAN_STATES[sc]) { n.stateCode = sc; n.state = INDIAN_STATES[sc]; }
      }
      if (upper.length >= 12) n.pan = upper.substring(2, 12);
      return n;
    });

    if (upper.length === 15) {
      setGstLookup(true);
      setGstMsg("");
      try {
        const res = await fetch(`/api/gstin-lookup?gstin=${upper}`);
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          setForm((f) => ({
            ...f,
            gstin: upper,
            name: d.name || f.name,
            address: d.address || f.address,
            city: d.city || f.city,
            state: d.state || f.state,
            stateCode: d.stateCode || f.stateCode,
            pincode: d.pincode || f.pincode,
            pan: d.pan || f.pan,
          }));
          setGstMsg(json.partial ? "State & PAN extracted from GSTIN" : "Auto-filled from GSTIN!");
        }
      } catch { setGstMsg("Could not lookup GSTIN"); }
      finally { setGstLookup(false); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{customer ? "Edit Party" : "Add Party"}</h2>
          <button onClick={onCancel}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* GST / Non-GST Toggle */}
          <div className="flex gap-3">
            <button onClick={() => setForm({ ...form, isGst: true })}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${form.isGst ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              GST Party
            </button>
            <button onClick={() => setForm({ ...form, isGst: false })}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${!form.isGst ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              Non-GST
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{form.isGst ? "Company Name" : "Name"} *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={form.isGst ? "ABC Enterprises" : "Aman Kumar"} />
          </div>
          {form.isGst && (
            <div>
              <label className="block text-sm font-medium mb-1">GSTIN * {gstLookup && <Loader2 className="inline w-3.5 h-3.5 animate-spin text-blue-500 ml-1" />}</label>
              <input value={form.gstin} onChange={(e) => handleGstinChange(e.target.value)} maxLength={15}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="07AABCU9603R1ZM" />
              {gstMsg && <p className="text-xs mt-1 text-emerald-600">{gstMsg}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {form.isGst && (
              <div>
                <label className="block text-sm font-medium mb-1">State {form.isGst ? "(auto from GSTIN)" : ""}</label>
                <select value={form.stateCode} onChange={(e) => setForm({ ...form, stateCode: e.target.value, state: INDIAN_STATES[e.target.value] || "" })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select State</option>
                  {Object.entries(INDIAN_STATES).map(([c, n]) => <option key={c} value={c}>{c} - {n}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">PAN {form.isGst ? "(auto)" : ""}</label>
              {form.isGst ? (
                <input value={form.pan} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-mono" />
              ) : (
                <input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} maxLength={10}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="ABCDE1234F" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode</label>
              <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name) { alert("Name is required"); return; } if (form.isGst && !form.gstin) { alert("GSTIN is required for GST party"); return; } clearDraft(); onSave(form); }}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>(undefined);

  const fetchRef = useRef(0);
  const fetchCustomers = () => {
    const id = ++fetchRef.current;
    setLoading(true);
    fetch("/api/customers").then((r) => r.json())
      .then((res) => { if (fetchRef.current === id) setCustomers(res.data || []); })
      .finally(() => { if (fetchRef.current === id) setLoading(false); });
  };

  const didMount = useRef(false);
  useEffect(() => { if (didMount.current) return; didMount.current = true; fetchCustomers(); }, []);

  const handleSave = async (data: Record<string, string | boolean>) => {
    const action = editing ? "update" : "create";
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(editing ? { id: editing.id } : {}), ...data }),
    });
    setShowForm(false);
    setEditing(undefined);
    fetchCustomers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    fetchCustomers();
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.gstin.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bill To (Parties)</h1>
        <button onClick={() => { setEditing(undefined); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Party
        </button>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">GSTIN</th>
                <th className="text-left p-3 font-medium">City</th>
                <th className="text-left p-3 font-medium">State</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {c.name}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${c.isGst !== false ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {c.isGst !== false ? "GST" : "Non-GST"}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-600">{c.gstin || c.pan || "-"}</td>
                  <td className="p-3 text-gray-500">{c.city || "-"}</td>
                  <td className="p-3 text-gray-500">{c.state || "-"}</td>
                  <td className="p-3 text-gray-500">{c.phone || "-"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-4 h-4 text-blue-500" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-gray-100 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <CustomerForm customer={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(undefined); }} />}
    </div>
  );
}
