"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Save, Building2, ArrowRight, PenTool } from "lucide-react";
import Image from "next/image";
import type { Customer, Product, InvoiceType, Firm, Signature, Invoice } from "@/lib/gst-types";
import { INVOICE_TYPE_LABELS, GST_RATES, UNITS, HSN_LIBRARY } from "@/lib/gst-types";
import { calculateGST, isInterState, formatCurrency } from "@/lib/gst-utils";
import { useAutoSave, loadDraft } from "@/lib/use-auto-save";

interface ItemRow {
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  gstRate: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CreateInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [editMode, setEditMode] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("tax_invoice");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year] = useState(new Date().getFullYear());
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");

  // Bill number
  const [billNumber, setBillNumber] = useState("");
  const [billNumberError, setBillNumberError] = useState("");

  // Quick mode: just enter amount, auto-calc GST
  const [quickMode, setQuickMode] = useState(false);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [quickGstRate, setQuickGstRate] = useState(18);
  const [quickHsn, setQuickHsn] = useState("");
  const [gstMode, setGstMode] = useState<"exclude" | "include">("exclude");

  // Detailed mode items
  const [items, setItems] = useState<ItemRow[]>([{ description: "", hsn: "", qty: 1, unit: "PCS", rate: 0, gstRate: 18 }]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({ hsn: true, qty: true, rate: true, taxableAmount: true, gstRate: true, unit: true });
  const [invoiceTemplate, setInvoiceTemplate] = useState<"premium" | "classic" | "minimal" | "corporate">("premium");

  // Auto-save draft
  const invoiceDraft = {
    firmId: selectedFirm?.id || "",
    customerId: selectedCustomer?.id || "",
    signatureId: selectedSignature?.id || "",
    invoiceType, month, date, dueDate, billNumber,
    quickMode, quickAmount, quickDescription, quickGstRate, quickHsn, gstMode,
    items, notes, terms,
  };
  const { clearDraft: clearInvoiceDraft } = useAutoSave("invoice_draft", invoiceDraft);

  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [lastBillFilled, setLastBillFilled] = useState(false);

  const didFetch = useRef(false);
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    Promise.all([
      fetch("/api/firms").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/signatures").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ]).then(([fRes, cRes, pRes, sRes, iRes]) => {
      const f = fRes.data || [];
      const c = cRes.data || [];
      const s = sRes.data || [];
      setFirms(f);
      if (f.length === 1) setSelectedFirm(f[0]);
      setCustomers(c);
      setProducts(pRes.data || []);
      setSignatures(s);
      setAllInvoices(iRes.data || []);

      // Edit mode — load invoice data
      if (editId) {
        const inv = (iRes.data || []).find((i: Invoice) => i.id === editId);
        if (inv) {
          setEditMode(true);
          setEditInvoice(inv);
          if (inv.firm) { const firm = f.find((x: Firm) => x.id === inv.firm?.id); if (firm) setSelectedFirm(firm); }
          if (inv.customer) { const cust = c.find((x: Customer) => x.id === inv.customer?.id); if (cust) setSelectedCustomer(cust); }
          if (inv.signature) { const sig = s.find((x: Signature) => x.id === inv.signature?.id); if (sig) setSelectedSignature(sig); }
          setInvoiceType(inv.invoiceType);
          setDate(inv.date);
          setDueDate(inv.dueDate || "");
          setBillNumber(inv.invoiceNumber);
          if (inv.gstMode) setGstMode(inv.gstMode);
          if (inv.notes) setNotes(inv.notes);
          if (inv.terms) setTerms(inv.terms);
          if (inv.template) setInvoiceTemplate(inv.template);
          if (inv.columnVisibility) setColumnVisibility({ hsn: inv.columnVisibility.hsn !== false, qty: inv.columnVisibility.qty !== false, rate: inv.columnVisibility.rate !== false, taxableAmount: inv.columnVisibility.taxableAmount !== false, gstRate: inv.columnVisibility.gstRate !== false, unit: inv.columnVisibility.unit !== false });
          if (inv.items.length === 1 && inv.items[0].qty === 1 && inv.items[0].unit === "MON") {
            setQuickMode(true);
            setQuickDescription(inv.items[0].description);
            setQuickHsn(inv.items[0].hsn);
            setQuickGstRate(inv.items[0].gstRate);
            setQuickAmount(String(inv.items[0].rate));
          } else {
            setQuickMode(false);
            setItems(inv.items.map((it: { description: string; hsn: string; qty: number; unit: string; rate: number; gstRate: number }) => ({ description: it.description, hsn: it.hsn, qty: it.qty, unit: it.unit, rate: it.rate, gstRate: it.gstRate })));
          }
        }
      } else {
        // Restore invoice draft (only for new invoices)
        const draft = loadDraft<Record<string, unknown>>("invoice_draft");
        if (draft) {
          if (draft.firmId) { const firm = f.find((x: Firm) => x.id === draft.firmId); if (firm) setSelectedFirm(firm); }
          if (draft.customerId) { const cust = c.find((x: Customer) => x.id === draft.customerId); if (cust) setSelectedCustomer(cust); }
          if (draft.signatureId) { const sig = s.find((x: Signature) => x.id === draft.signatureId); if (sig) setSelectedSignature(sig); }
          if (draft.invoiceType) setInvoiceType(draft.invoiceType as InvoiceType);
          if (draft.date) setDate(draft.date as string);
          if (draft.dueDate) setDueDate(draft.dueDate as string);
          if (draft.billNumber) setBillNumber(draft.billNumber as string);
          if (draft.quickMode !== undefined) setQuickMode(draft.quickMode as boolean);
          if (draft.quickAmount) setQuickAmount(draft.quickAmount as string);
          if (draft.quickDescription) setQuickDescription(draft.quickDescription as string);
          if (draft.quickGstRate !== undefined) setQuickGstRate(draft.quickGstRate as number);
          if (draft.quickHsn) setQuickHsn(draft.quickHsn as string);
          if (draft.gstMode) setGstMode(draft.gstMode as "exclude" | "include");
          if (draft.items && Array.isArray(draft.items) && (draft.items as ItemRow[]).length > 0) setItems(draft.items as ItemRow[]);
          if (draft.notes) setNotes(draft.notes as string);
          if (draft.terms) setTerms(draft.terms as string);
        }

        // Auto-increment bill number from last invoice (only for new invoices)
        if (!editId && !draft?.billNumber) {
          const invoices = iRes.data || [];
          if (invoices.length > 0) {
            const lastNum = invoices[0].invoiceNumber || "";
            const match = lastNum.match(/^(\d+)([\/-])(.+)$/);
            if (match) {
              const next = String(parseInt(match[1], 10) + 1);
              setBillNumber(`${next}${match[2]}${match[3]}`);
            } else {
              const numMatch = lastNum.match(/(\d+)/);
              if (numMatch) {
                const idx = lastNum.indexOf(numMatch[1]);
                const next = String(parseInt(numMatch[1], 10) + 1);
                setBillNumber(lastNum.substring(0, idx) + next + lastNum.substring(idx + numMatch[1].length));
              }
            }
          }
        }
      }
    }).finally(() => setLoading(false));
  }, [editId]);

  // Auto-fill from last invoice when same firm + customer pair selected
  const lastFillRef = useRef("");
  const applyLastBill = (firm: Firm, customer: Customer) => {
    if (allInvoices.length === 0) return;
    const pairKey = `${firm.id}_${customer.id}`;
    if (lastFillRef.current === pairKey) return;
    lastFillRef.current = pairKey;
    const matching = allInvoices.filter(
      (inv) => inv.firm?.id === firm.id && inv.customer?.id === customer.id
    );
    if (matching.length === 0) return;
    const lastInv = matching[0];
    setInvoiceType(lastInv.invoiceType);
    if (lastInv.notes) setNotes(lastInv.notes);
    if (lastInv.terms) setTerms(lastInv.terms);
    if (lastInv.signature) {
      const sig = signatures.find((s) => s.id === lastInv.signature?.id);
      if (sig) setSelectedSignature(sig);
    }
    if (lastInv.items.length > 0) {
      const firstItem = lastInv.items[0];
      setQuickDescription(firstItem.description);
      setQuickHsn(firstItem.hsn);
      setQuickGstRate(firstItem.gstRate);
    }
    setLastBillFilled(true);
  };

  const sellerState = selectedFirm?.stateCode || "";
  const buyerState = selectedCustomer?.stateCode || "";
  const interState = sellerState && buyerState ? isInterState(sellerState, buyerState) : false;

  // Quick mode calculations — handle Include/Exclude GST
  const rawAmount = parseFloat(quickAmount) || 0;
  const effectiveGstRate = columnVisibility.gstRate ? quickGstRate : 0;
  const qAmount = gstMode === "include" && effectiveGstRate > 0
    ? Math.round((rawAmount * 100) / (100 + effectiveGstRate) * 100) / 100
    : rawAmount;
  const qGst = calculateGST(qAmount, effectiveGstRate, interState);

  // Detailed mode calculations — handle Include/Exclude GST
  const calculated = items.map((item) => {
    const itemGstRate = columnVisibility.gstRate ? item.gstRate : 0;
    const rawAmt = item.qty * item.rate;
    const amount = gstMode === "include" && itemGstRate > 0
      ? Math.round((rawAmt * 100) / (100 + itemGstRate) * 100) / 100
      : rawAmt;
    const gst = calculateGST(amount, itemGstRate, interState);
    return { ...item, amount, ...gst };
  });

  const subtotal = quickMode ? qAmount : calculated.reduce((s, i) => s + i.amount, 0);
  const totalCgst = quickMode ? qGst.cgst : calculated.reduce((s, i) => s + i.cgst, 0);
  const totalSgst = quickMode ? qGst.sgst : calculated.reduce((s, i) => s + i.sgst, 0);
  const totalIgst = quickMode ? qGst.igst : calculated.reduce((s, i) => s + i.igst, 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = subtotal + totalTax;

  const addItem = () => setItems([...items, { description: "", hsn: "", qty: 1, unit: "PCS", rate: 0, gstRate: 18 }]);
  const removeItem = (idx: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };
  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const selectProduct = (idx: number, productId: string) => {
    const p = products.find((pr) => pr.id === productId);
    if (p) {
      setItems(items.map((item, i) =>
        i === idx ? { ...item, description: p.name, hsn: p.hsn, rate: p.rate, unit: p.unit, gstRate: p.gstRate } : item
      ));
    }
  };

  const handleSave = async () => {
    if (!selectedFirm) { alert("Please select your firm"); return; }
    if (!selectedCustomer) { alert("Please select Bill To party"); return; }
    if (!editMode && !billNumber.trim()) { alert("Please enter bill number"); return; }
    if (!editMode && billNumberError) { alert(billNumberError); return; }

    const signatureData = selectedSignature ? {
      id: selectedSignature.id,
      directorName: selectedSignature.directorName,
      imageData: selectedSignature.imageData,
    } : undefined;
    if (quickMode && !qAmount) { alert("Please enter amount"); return; }
    if (!quickMode && items.some((i) => !i.description)) { alert("Please fill all item descriptions"); return; }
    setSaving(true);

    const invoiceItems = quickMode
      ? [{
          description: quickDescription || `${MONTHS[month]} ${year} - Service`,
          hsn: quickHsn || selectedFirm.hsnCode || "998361",
          qty: 1,
          unit: "MON",
          rate: qAmount,
          gstRate: effectiveGstRate,
        }]
      : items.map((i) => ({
          description: i.description,
          hsn: i.hsn || selectedFirm.hsnCode || "",
          qty: i.qty,
          unit: i.unit,
          rate: i.rate,
          gstRate: columnVisibility.gstRate ? i.gstRate : 0,
        }));

    const firmData = {
      id: selectedFirm.id,
      name: selectedFirm.name,
      address: selectedFirm.address,
      city: selectedFirm.city,
      state: selectedFirm.state,
      stateCode: selectedFirm.stateCode,
      gstin: selectedFirm.gstin,
      pan: selectedFirm.pan,
      phone: selectedFirm.phone,
      email: selectedFirm.email,
      bankName: selectedFirm.bankName,
      accountNumber: selectedFirm.accountNumber,
      ifscCode: selectedFirm.ifscCode,
      branchName: selectedFirm.branchName,
      signatureText: selectedFirm.signatureText,
      logo: selectedFirm.logo || undefined,
    };

    const customerData = {
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      address: selectedCustomer.address,
      city: selectedCustomer.city,
      state: selectedCustomer.state,
      stateCode: selectedCustomer.stateCode,
      gstin: selectedCustomer.gstin,
      phone: selectedCustomer.phone || "",
      email: selectedCustomer.email || "",
    };

    const payload = editMode && editInvoice ? {
      action: "update",
      id: editInvoice.id,
      invoiceType,
      date,
      dueDate,
      firm: firmData,
      customer: customerData,
      items: invoiceItems,
      notes,
      terms,
      gstMode,
      letterhead: selectedFirm.letterhead || undefined,
      signature: signatureData,
      columnVisibility,
      template: invoiceTemplate,
    } : {
      action: "create",
      invoiceType,
      customInvoiceNumber: billNumber.trim(),
      date,
      dueDate,
      firm: firmData,
      customer: customerData,
      items: invoiceItems,
      notes,
      terms,
      gstMode,
      letterhead: selectedFirm.letterhead || undefined,
      signature: signatureData,
      columnVisibility,
      template: invoiceTemplate,
    };

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (data.success) {
      clearInvoiceDraft();
      router.push(`/invoice-view?id=${data.data.id}`);
    } else {
      alert(data.error || (editMode ? "Failed to update invoice" : "Failed to create invoice"));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">{editMode ? "Edit Invoice" : "Create Invoice"}</h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        {/* Firm (From) → Customer (To) Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: My Firm */}
          <div className="border-2 border-dashed border-indigo-200 rounded-xl p-4 bg-indigo-50/30">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <label className="text-sm font-semibold text-indigo-700">FROM (My Firm) *</label>
            </div>
            {firms.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-2">No firms added yet</p>
                <a href="/my-firms" className="text-indigo-600 text-sm font-medium hover:underline">+ Add Firm</a>
              </div>
            ) : (
              <select
                value={selectedFirm?.id || ""}
                onChange={(e) => { const f = firms.find((x) => x.id === e.target.value) || null; setSelectedFirm(f); if (f && selectedCustomer) applyLastBill(f, selectedCustomer); }}
                className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              >
                <option value="">Select your firm...</option>
                {firms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
            {selectedFirm && (
              <div className="mt-3 text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-800">{selectedFirm.name}</p>
                <p>GSTIN: {selectedFirm.gstin}</p>
                <p>{selectedFirm.city}, {selectedFirm.state}</p>
              </div>
            )}
          </div>

          {/* Right: Bill To */}
          <div className="border-2 border-dashed border-orange-200 rounded-xl p-4 bg-orange-50/30">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-5 h-5 text-orange-600" />
              <label className="text-sm font-semibold text-orange-700">BILL TO (Party) *</label>
            </div>
            {customers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-2">No parties added yet</p>
                <a href="/customers" className="text-orange-600 text-sm font-medium hover:underline">+ Add Party</a>
              </div>
            ) : (
              <select
                value={selectedCustomer?.id || ""}
                onChange={(e) => { const c = customers.find((x) => x.id === e.target.value) || null; setSelectedCustomer(c); if (selectedFirm && c) applyLastBill(selectedFirm, c); }}
                className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
              >
                <option value="">Select party...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.gstin ? `(${c.gstin})` : ""}</option>)}
              </select>
            )}
            {selectedCustomer && (
              <div className="mt-3 text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-800">{selectedCustomer.name}</p>
                <p>GSTIN: {selectedCustomer.gstin}</p>
                <p>{selectedCustomer.city}, {selectedCustomer.state}</p>
                {interState && <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">Inter-State (IGST)</span>}
                {!interState && sellerState && buyerState && <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Intra-State (CGST+SGST)</span>}
              </div>
            )}
          </div>
        </div>

        {/* Auto-fill from last bill notification */}
        {lastBillFilled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Last bill settings loaded</span> — description, HSN, GST rate, signature auto-filled. Just enter the amount.
            </p>
            <button onClick={() => setLastBillFilled(false)} className="text-blue-500 hover:text-blue-700 text-xs font-medium ml-3">Dismiss</button>
          </div>
        )}

        {/* Bill Number, Invoice Type, Month, Date */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bill Number *</label>
            <input value={billNumber} onChange={(e) => {
              const val = e.target.value;
              setBillNumber(val);
              if (val.trim()) {
                fetch(`/api/invoices?checkNumber=${encodeURIComponent(val.trim())}`)
                  .then((r) => r.json())
                  .then((d) => { setBillNumberError(d.exists ? `Bill #${val.trim()} already exists` : ""); });
              } else { setBillNumberError(""); }
            }}
              placeholder="01/2026"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm font-mono ${
                billNumberError ? "border-red-400 focus:ring-red-500 bg-red-50" : "focus:ring-indigo-500"
              }`} />
            {billNumberError && <p className="text-xs text-red-500 mt-1">{billNumberError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Type</label>
            <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              {Object.entries(INVOICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
        </div>

        {/* Quick Mode Toggle + GST Include/Exclude */}
        <div className="flex flex-wrap items-center gap-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setQuickMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${quickMode ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              ⚡ Quick Invoice
            </button>
            <button onClick={() => setQuickMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!quickMode ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              📋 Detailed
            </button>
          </div>
          <div className="flex items-center gap-1 ml-auto bg-amber-50 border border-amber-200 rounded-lg p-1">
            <button onClick={() => setGstMode("exclude")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${gstMode === "exclude" ? "bg-amber-500 text-white shadow" : "text-amber-700 hover:bg-amber-100"}`}>
              GST Exclude
            </button>
            <button onClick={() => setGstMode("include")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${gstMode === "include" ? "bg-amber-500 text-white shadow" : "text-amber-700 hover:bg-amber-100"}`}>
              GST Include
            </button>
          </div>
        </div>
        {gstMode === "include" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
            GST Include mode: Enter total amount (GST included). Base amount will be auto-calculated by removing {quickGstRate}% GST.
          </div>
        )}

        {/* Quick Mode */}
        {quickMode && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-700 mb-4">Quick Invoice — Select category, enter amount, GST auto-calculated</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service / Goods Category</label>
                <select onChange={(e) => {
                  const hsn = HSN_LIBRARY.find((h) => h.code === e.target.value);
                  if (hsn) {
                    setQuickDescription(hsn.category);
                    setQuickGstRate(hsn.gstRate);
                    setQuickHsn(hsn.code);
                  }
                }} defaultValue=""
                  className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="">Select category → HSN auto-fill</option>
                  {HSN_LIBRARY.map((h) => <option key={h.code} value={h.code}>{h.category} — {h.code} ({h.gstRate}%)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HSN/SAC Code</label>
                <input value={quickHsn} onChange={(e) => setQuickHsn(e.target.value)}
                  placeholder="Auto or enter manually"
                  className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input value={quickDescription} onChange={(e) => setQuickDescription(e.target.value)}
                  placeholder={`${MONTHS[month]} ${year} - Service`}
                  className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{gstMode === "include" ? "Total Amount (GST Included) *" : "Amount (before GST) *"}</label>
                <input type="number" value={quickAmount} onChange={(e) => setQuickAmount(e.target.value)}
                  placeholder={gstMode === "include" ? "100000" : "56257"}
                  className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-lg font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST Rate</label>
                <select value={quickGstRate} onChange={(e) => setQuickGstRate(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Mode */}
        {!quickMode && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Items</label>
              <button onClick={addItem} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Item / Product</label>
                      {products.length > 0 && (
                        <select onChange={(e) => selectProduct(idx, e.target.value)} value="" className="w-full px-2 py-1.5 border rounded text-sm mb-1">
                          <option value="">Pick from catalog...</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.hsn})</option>)}
                        </select>
                      )}
                      <input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Item description" className="w-full px-2 py-1.5 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">HSN</label>
                      <select onChange={(e) => {
                        const h = HSN_LIBRARY.find((x) => x.code === e.target.value);
                        if (h) { updateItem(idx, "hsn", h.code); updateItem(idx, "gstRate", h.gstRate); }
                      }} defaultValue="" className="w-full px-2 py-1.5 border rounded text-sm mb-1">
                        <option value="">Category → HSN</option>
                        {HSN_LIBRARY.map((h) => <option key={h.code} value={h.code}>{h.category} ({h.code})</option>)}
                      </select>
                      <input value={item.hsn} onChange={(e) => updateItem(idx, "hsn", e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm font-mono" placeholder="or type manually" />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                        <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Unit</label>
                        <select value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)}
                          className="w-full px-2 py-1.5 border rounded text-sm">
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Rate</label>
                        <input type="number" min="0" value={item.rate} onChange={(e) => updateItem(idx, "rate", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">GST %</label>
                      <select value={item.gstRate} onChange={(e) => updateItem(idx, "gstRate", parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border rounded text-sm">
                        {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Amount</label>
                        <p className="text-sm font-semibold">{formatCurrency(calculated[idx]?.amount || 0)}</p>
                      </div>
                      {items.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 ml-2 mb-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Inline Add Item Button - below items */}
            <button onClick={addItem} className="mt-3 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition font-medium text-sm">
              <Plus className="w-5 h-5" /> Add Another Item
            </button>
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-80 space-y-2 text-sm">
              {gstMode === "include" && rawAmount > 0 && (
                <div className="flex justify-between text-amber-700 bg-amber-50 rounded px-2 py-1">
                  <span>Entered Amount (GST incl.)</span><span className="font-semibold">{formatCurrency(rawAmount)}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Base Amount</span><span>{formatCurrency(subtotal)}</span></div>
              {!interState ? (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">CGST ({quickMode ? quickGstRate / 2 : ""}%)</span><span>{formatCurrency(totalCgst)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">SGST ({quickMode ? quickGstRate / 2 : ""}%)</span><span>{formatCurrency(totalSgst)}</span></div>
                </>
              ) : (
                <div className="flex justify-between"><span className="text-gray-500">IGST ({quickMode ? quickGstRate : ""}%)</span><span>{formatCurrency(totalIgst)}</span></div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold text-lg">
                <span>Grand Total</span><span className="text-indigo-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Selection */}
        {selectedFirm && (() => {
          const firmSigs = signatures.filter((s) => s.firmId === selectedFirm.id);
          return firmSigs.length > 0 ? (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium">Director Signature</label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setSelectedSignature(null)}
                  className={`border-2 rounded-lg px-4 py-3 text-sm transition ${!selectedSignature ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                  No Signature
                </button>
                {firmSigs.map((sig) => (
                  <button key={sig.id} onClick={() => setSelectedSignature(sig)}
                    className={`border-2 rounded-lg p-3 text-center transition ${selectedSignature?.id === sig.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <Image src={sig.imageData} alt={sig.directorName} width={80} height={40} className="h-10 w-auto object-contain mx-auto" />
                    <p className="text-xs text-gray-600 mt-1">{sig.directorName}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t pt-4 text-sm text-gray-400">
              No signatures uploaded for this firm. <a href="/my-firms" className="text-indigo-600 hover:underline">Upload in My Firms</a>
            </div>
          );
        })()}

        {/* Column Visibility Toggles */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2">Invoice Column Settings <span className="text-gray-400 font-normal">(toggle to show/hide in PDF)</span></label>
          <div className="flex flex-wrap gap-3">
            {([
              { key: "hsn" as const, label: "HSN/SAC" },
              { key: "qty" as const, label: "Quantity" },
              { key: "unit" as const, label: "Unit" },
              { key: "rate" as const, label: "Rate" },
              { key: "taxableAmount" as const, label: "Taxable Amount" },
              { key: "gstRate" as const, label: "GST %" },
            ]).map((col) => (
              <label key={col.key} className="flex items-center gap-2 cursor-pointer text-sm bg-gray-50 border rounded-lg px-3 py-2 hover:bg-gray-100 transition">
                <input type="checkbox" checked={columnVisibility[col.key]} onChange={(e) => setColumnVisibility((prev) => ({ ...prev, [col.key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className={columnVisibility[col.key] ? "text-gray-800" : "text-gray-400 line-through"}>{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Invoice Template Design */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2">Invoice Design Template</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { key: "premium" as const, label: "Premium", desc: "Dark blue + gold, modern", color: "from-blue-900 to-blue-700" },
              { key: "classic" as const, label: "Classic", desc: "Traditional GST bill style", color: "from-gray-700 to-gray-500" },
              { key: "minimal" as const, label: "Minimal", desc: "Simple black & white", color: "from-gray-900 to-gray-700" },
              { key: "corporate" as const, label: "Corporate", desc: "Blue-grey formal", color: "from-slate-700 to-slate-500" },
            ]).map((t) => (
              <button key={t.key} type="button" onClick={() => setInvoiceTemplate(t.key)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${invoiceTemplate === t.key ? "border-indigo-600 bg-indigo-50 shadow-md" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                <div className={`h-2 w-full rounded-full bg-gradient-to-r ${t.color} mb-2`} />
                <p className={`text-sm font-semibold ${invoiceTemplate === t.key ? "text-indigo-700" : "text-gray-800"}`}>{t.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Optional notes..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
            <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Payment terms..." />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={() => router.push("/invoices")} className="px-6 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? (editMode ? "Updating..." : "Creating...") : (editMode ? "Update Invoice" : "Create Invoice")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>}>
      <CreateInvoiceContent />
    </Suspense>
  );
}
