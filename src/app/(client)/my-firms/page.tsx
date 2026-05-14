"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Plus, Trash2, Edit2, Save, X, Upload, PenTool, Landmark, Loader2 } from "lucide-react";
import Image from "next/image";
import type { Firm, Signature } from "@/lib/gst-types";
import { INDIAN_STATES } from "@/lib/gst-types";
import { useAutoSave, loadDraft } from "@/lib/use-auto-save";

const emptyFirm = {
  isGst: true,
  name: "", address: "", city: "", state: "", stateCode: "", pincode: "",
  gstin: "", pan: "", phone: "", email: "",
  bankName: "", accountNumber: "", ifscCode: "", branchName: "",
  hsnCode: "", signatureText: "", letterhead: "",
};

export default function MyFirmsPage() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const firmDraftKey = "firm_new_draft";
  const savedFirmDraft = useRef(loadDraft<typeof emptyFirm>(firmDraftKey));
  const [form, setForm] = useState(savedFirmDraft.current || emptyFirm);
  const { clearDraft: clearFirmDraft } = useAutoSave(firmDraftKey, form);

  // Signature upload state
  const [showSigUpload, setShowSigUpload] = useState<string | null>(null);
  const [sigName, setSigName] = useState("");
  const [sigImage, setSigImage] = useState("");
  const [gstLookup, setGstLookup] = useState(false);
  const [gstMsg, setGstMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const didMount = useRef(false);
  const load = async () => {
    const [fRes, sRes] = await Promise.all([
      fetch("/api/firms").then((r) => r.json()),
      fetch("/api/signatures").then((r) => r.json()),
    ]);
    if (fRes.data) setFirms(fRes.data);
    if (sRes.data) setSignatures(sRes.data);
  };

  useEffect(() => { if (didMount.current) return; didMount.current = true; load(); }, []);

  const handleGstin = async (gstin: string) => {
    const updates: Partial<typeof form> = { gstin };
    if (gstin.length >= 2) {
      const code = gstin.substring(0, 2);
      if (INDIAN_STATES[code]) { updates.stateCode = code; updates.state = INDIAN_STATES[code]; }
    }
    if (gstin.length >= 12) updates.pan = gstin.substring(2, 12);
    setForm((p) => ({ ...p, ...updates }));

    if (gstin.length === 15) {
      setGstLookup(true); setGstMsg("");
      try {
        const res = await fetch(`/api/gstin-lookup?gstin=${gstin}`);
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          setForm((f) => ({
            ...f, gstin,
            name: d.name || f.name, address: d.address || f.address,
            city: d.city || f.city, state: d.state || f.state,
            stateCode: d.stateCode || f.stateCode, pincode: d.pincode || f.pincode,
            pan: d.pan || f.pan,
          }));
          setGstMsg(json.partial ? "State & PAN extracted from GSTIN" : "Auto-filled from GSTIN!");
        }
      } catch { setGstMsg("Could not lookup GSTIN"); }
      finally { setGstLookup(false); }
    }
  };

  const handleSave = async () => {
    if (!form.name) return alert("Firm name is required");
    if (form.isGst && !form.gstin) return alert("GSTIN is required for GST firm");
    const action = editId ? "update" : "create";
    const res = await fetch("/api/firms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id: editId, ...form }),
    });
    if (res.ok) {
      clearFirmDraft();
      setShowForm(false); setEditId(null); setForm(emptyFirm);
      load();
    }
  };

  const handleEdit = (f: Firm) => {
    setEditId(f.id);
    setForm({
      isGst: f.isGst !== false,
      name: f.name, address: f.address, city: f.city, state: f.state,
      stateCode: f.stateCode, pincode: f.pincode, gstin: f.gstin, pan: f.pan,
      phone: f.phone, email: f.email, bankName: f.bankName,
      accountNumber: f.accountNumber, ifscCode: f.ifscCode, branchName: f.branchName,
      hsnCode: f.hsnCode, signatureText: f.signatureText, letterhead: f.letterhead || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this firm?")) return;
    await fetch("/api/firms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    load();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) return alert("File too large. Max 500KB.");
    const reader = new FileReader();
    reader.onload = () => setSigImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSigUpload = async () => {
    if (!sigName || !sigImage || !showSigUpload) return alert("Director name and signature image required");
    const res = await fetch("/api/signatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", firmId: showSigUpload, directorName: sigName, imageData: sigImage }),
    });
    if (res.ok) {
      setShowSigUpload(null); setSigName(""); setSigImage("");
      load();
    }
  };

  const handleSigDelete = async (id: string) => {
    if (!confirm("Delete this signature?")) return;
    await fetch("/api/signatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    load();
  };

  const firmSignatures = (firmId: string) => signatures.filter((s) => s.firmId === firmId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Firms</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyFirm); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Firm
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{editId ? "Edit Firm" : "Add New Firm"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyFirm); }}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {/* GST / Non-GST Toggle */}
          <div className="flex gap-3 mb-4">
            <button onClick={() => setForm((p) => ({ ...p, isGst: true }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${form.isGst ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              GST Firm
            </button>
            <button onClick={() => setForm((p) => ({ ...p, isGst: false }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${!form.isGst ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              Non-GST
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firm / Person Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={form.isGst ? "Bainsla Music" : "Ajit Kumar"} />
            </div>
            {form.isGst && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN * {gstLookup && <Loader2 className="inline w-3.5 h-3.5 animate-spin text-blue-500 ml-1" />}</label>
                <input value={form.gstin} onChange={(e) => handleGstin(e.target.value.toUpperCase())}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="29ABCDE1234F1Z5" maxLength={15} />
                {gstMsg && <p className="text-xs mt-1 text-emerald-600">{gstMsg}</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN {form.isGst ? "(auto)" : ""}</label>
              {form.isGst ? (
                <input value={form.pan} readOnly className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" />
              ) : (
                <input value={form.pan} onChange={(e) => setForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ABCDE1234F" maxLength={10} />
              )}
            </div>
            {form.isGst && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State (auto)</label>
                <input value={form.state} readOnly className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Jaipur" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input value={form.pincode} onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="302001" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="firm@email.com" />
            </div>
            {form.isGst && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default HSN Code</label>
                <input value={form.hsnCode} onChange={(e) => setForm((p) => ({ ...p, hsnCode: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="998361" />
              </div>
            )}
            <div className="md:col-span-3 border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Landmark className="w-4 h-4" /> Bank Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="State Bank of India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1234567890" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input value={form.ifscCode} onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono" placeholder="SBIN0001234" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input value={form.branchName} onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Main Branch, Jaipur" />
                </div>
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Authorized Signatory Name</label>
              <input value={form.signatureText} onChange={(e) => setForm((p) => ({ ...p, signatureText: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Name of authorized signatory" />
            </div>
            <div className="md:col-span-3 border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Company Letterhead (Optional)</h3>
              <p className="text-xs text-gray-500 mb-2">Upload your company letterhead image. Invoice will print on this letterhead background.</p>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { alert("Max 2MB allowed"); return; }
                const reader = new FileReader();
                reader.onload = () => setForm((p) => ({ ...p, letterhead: reader.result as string }));
                reader.readAsDataURL(file);
              }} className="border rounded-lg px-3 py-2 text-sm w-full" />
              {form.letterhead && (
                <div className="mt-2 border rounded-lg p-2 bg-gray-50 relative">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.letterhead} alt="Letterhead" className="max-h-32 mx-auto object-contain" />
                  <button type="button" onClick={() => setForm((p) => ({ ...p, letterhead: "" }))}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs">✕ Remove</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyFirm); }}
              className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> {editId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Signature Upload Modal */}
      {showSigUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><PenTool className="w-5 h-5" /> Upload Director Signature</h2>
              <button onClick={() => { setShowSigUpload(null); setSigName(""); setSigImage(""); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Director Name *</label>
                <input value={sigName} onChange={(e) => setSigName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Name of the director" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature Image * (max 500KB)</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              {sigImage && (
                <div className="border rounded-lg p-3 bg-gray-50 text-center">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <Image src={sigImage} alt="Signature" width={200} height={80} className="max-h-20 mx-auto object-contain" />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowSigUpload(null); setSigName(""); setSigImage(""); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleSigUpload}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {firms.map((f) => {
          const fSigs = firmSignatures(f.id);
          return (
            <div key={f.id} className="bg-white rounded-xl shadow p-5 border hover:border-indigo-300 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{f.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.isGst !== false ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {f.isGst !== false ? "GST" : "Non-GST"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{f.gstin || f.pan || ""}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(f)} className="text-gray-400 hover:text-indigo-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                {f.address && <p>{f.address}{f.city ? `, ${f.city}` : ""}</p>}
                {f.state && <p>{f.state} {f.stateCode ? `(${f.stateCode})` : ""} {f.pincode && `- ${f.pincode}`}</p>}
                {f.phone && <p>Ph: {f.phone}</p>}
                {f.hsnCode && <p>HSN: {f.hsnCode}</p>}
              </div>

              {/* Bank Account Details */}
              {(f.bankName || f.accountNumber) && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1"><Landmark className="w-3 h-3" /> Bank Details</p>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    {f.bankName && <p><span className="text-gray-400">Bank:</span> {f.bankName}{f.branchName ? ` (${f.branchName})` : ""}</p>}
                    {f.accountNumber && <p><span className="text-gray-400">A/C:</span> {f.accountNumber}</p>}
                    {f.ifscCode && <p><span className="text-gray-400">IFSC:</span> {f.ifscCode}</p>}
                  </div>
                </div>
              )}

              {/* Director Signatures */}
              <div className="mt-4 border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Director Signatures</p>
                  <button onClick={() => setShowSigUpload(f.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Signature
                  </button>
                </div>
                {fSigs.length === 0 ? (
                  <p className="text-xs text-gray-400">No signatures uploaded yet</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {fSigs.map((sig) => (
                      <div key={sig.id} className="border rounded-lg p-2 bg-gray-50 relative group">
                        <Image src={sig.imageData} alt={sig.directorName} width={100} height={50} className="h-12 w-auto object-contain" />
                        <p className="text-xs text-gray-600 mt-1 text-center">{sig.directorName}</p>
                        <button onClick={() => handleSigDelete(sig.id)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {firms.length === 0 && !showForm && (
          <div className="col-span-2 text-center py-12 text-gray-400">
            No firms added yet. Click &quot;Add Firm&quot; to add your companies.
          </div>
        )}
      </div>
    </div>
  );
}
