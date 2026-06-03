"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Download, Printer, Loader2, Upload, X, Image } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Firm } from "@/lib/gst-types";
import { formatDate } from "@/components/documents/doc-templates";

interface LetterheadTemplate {
  id: string;
  name: string;
  headerStyle: string;
  colors: { primary: string; secondary: string; accent: string; border: string };
}

const letterheadTemplates: LetterheadTemplate[] = [
  { id: "corporate-blue", name: "Corporate Blue", headerStyle: "gradient", colors: { primary: "#1e40af", secondary: "#3b82f6", accent: "#dbeafe", border: "#1e40af" } },
  { id: "executive-dark", name: "Executive Dark", headerStyle: "solid", colors: { primary: "#0f172a", secondary: "#1e293b", accent: "#e2e8f0", border: "#334155" } },
  { id: "elegant-gold", name: "Elegant Gold", headerStyle: "bordered", colors: { primary: "#78350f", secondary: "#b45309", accent: "#fef3c7", border: "#d97706" } },
  { id: "modern-teal", name: "Modern Teal", headerStyle: "gradient", colors: { primary: "#115e59", secondary: "#0d9488", accent: "#ccfbf1", border: "#14b8a6" } },
  { id: "classic-red", name: "Classic Red", headerStyle: "line", colors: { primary: "#991b1b", secondary: "#dc2626", accent: "#fee2e2", border: "#ef4444" } },
  { id: "royal-purple", name: "Royal Purple", headerStyle: "gradient", colors: { primary: "#4c1d95", secondary: "#7c3aed", accent: "#ede9fe", border: "#8b5cf6" } },
  { id: "forest-green", name: "Forest Green", headerStyle: "solid", colors: { primary: "#14532d", secondary: "#16a34a", accent: "#dcfce7", border: "#22c55e" } },
  { id: "ocean-blue", name: "Ocean Blue", headerStyle: "bordered", colors: { primary: "#0c4a6e", secondary: "#0284c7", accent: "#e0f2fe", border: "#38bdf8" } },
  { id: "slate-minimal", name: "Slate Minimal", headerStyle: "line", colors: { primary: "#1e293b", secondary: "#475569", accent: "#f1f5f9", border: "#64748b" } },
  { id: "sunset-orange", name: "Sunset Orange", headerStyle: "gradient", colors: { primary: "#7c2d12", secondary: "#ea580c", accent: "#fff7ed", border: "#f97316" } },
];

const fields = [
  { name: "subject", label: "Subject / Title", required: true, placeholder: "Letter subject" },
  { name: "recipientName", label: "Recipient Name", placeholder: "To whom" },
  { name: "recipientDesignation", label: "Recipient Designation", placeholder: "e.g. Manager" },
  { name: "recipientAddress", label: "Recipient Address", type: "textarea", placeholder: "Complete address" },
  { name: "date", label: "Date", type: "date" },
  { name: "body", label: "Letter Body", type: "textarea", required: true, placeholder: "Type your letter content here..." },
  { name: "closing", label: "Closing Line", placeholder: "e.g. Yours sincerely / Warm Regards" },
  { name: "senderName", label: "Sender / Signatory Name", placeholder: "Your name" },
  { name: "senderDesignation", label: "Sender Designation", placeholder: "e.g. Managing Director" },
  { name: "senderPhone", label: "Sender Phone", placeholder: "Phone number" },
  { name: "senderEmail", label: "Sender Email", placeholder: "Email address" },
];

function renderLetterhead(
  data: Record<string, string>,
  template: LetterheadTemplate,
  firm: Firm | null,
  logo: string | null,
  signature: string | null
) {
  const c = template.colors;
  const companyName = firm?.name || "Your Company Name";
  const companyAddress = [firm?.address, firm?.city, firm?.state, firm?.pincode].filter(Boolean).join(", ");
  const companyGstin = firm?.gstin || "";
  const companyPhone = firm?.phone || "";
  const companyEmail = firm?.email || "";

  const renderHeader = () => {
    const logoEl = logo ? (
      <img src={logo} alt="Logo" style={{ height: "60px", width: "auto", objectFit: "contain" }} />
    ) : null;

    const companyInfo = (
      <div style={{ textAlign: logo ? "right" : "left" }}>
        <div style={{ fontSize: "24px", fontWeight: 800, color: template.headerStyle === "gradient" || template.headerStyle === "solid" ? "white" : c.primary, letterSpacing: "0.5px" }}>
          {companyName}
        </div>
        {companyAddress && (
          <div style={{ fontSize: "10.5px", marginTop: "3px", opacity: template.headerStyle === "gradient" || template.headerStyle === "solid" ? 0.85 : 0.7, color: template.headerStyle === "gradient" || template.headerStyle === "solid" ? "white" : "#4b5563" }}>
            {companyAddress}
          </div>
        )}
        <div style={{ fontSize: "10px", marginTop: "2px", opacity: template.headerStyle === "gradient" || template.headerStyle === "solid" ? 0.75 : 0.6, color: template.headerStyle === "gradient" || template.headerStyle === "solid" ? "white" : "#6b7280" }}>
          {companyPhone && `Ph: ${companyPhone}`}
          {companyEmail && ` | ${companyEmail}`}
          {companyGstin && ` | GSTIN: ${companyGstin}`}
        </div>
      </div>
    );

    switch (template.headerStyle) {
      case "gradient":
        return (
          <div style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`, padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {logoEl && <div style={{ marginRight: "20px" }}>{logoEl}</div>}
            <div style={{ flex: 1 }}>{companyInfo}</div>
          </div>
        );
      case "solid":
        return (
          <div style={{ background: c.primary, padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {logoEl && <div style={{ marginRight: "20px" }}>{logoEl}</div>}
            <div style={{ flex: 1 }}>{companyInfo}</div>
          </div>
        );
      case "bordered":
        return (
          <div style={{ padding: "24px 40px", borderBottom: `3px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {logoEl && <div style={{ marginRight: "20px" }}>{logoEl}</div>}
            <div style={{ flex: 1 }}>{companyInfo}</div>
          </div>
        );
      case "line":
      default:
        return (
          <div style={{ padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {logoEl && <div style={{ marginRight: "20px" }}>{logoEl}</div>}
            <div style={{ flex: 1 }}>{companyInfo}</div>
            <div style={{ width: "60px", height: "3px", background: `linear-gradient(90deg, ${c.primary}, ${c.secondary})`, borderRadius: "2px", position: "absolute" as const, right: "40px", top: "70px" }} />
          </div>
        );
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "white", minHeight: "297mm", position: "relative", overflow: "hidden" }}>
      {/* Watermark */}
      <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%) rotate(-35deg)", fontSize: "70px", fontWeight: 800, color: c.primary, opacity: 0.025, letterSpacing: "8px", pointerEvents: "none", whiteSpace: "nowrap" }}>
        {companyName}
      </div>

      {/* Left side accent bar (some templates) */}
      {(template.headerStyle === "gradient" || template.headerStyle === "solid") && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: `linear-gradient(to bottom, ${c.primary}, ${c.secondary}, transparent)` }} />
      )}

      {/* Header */}
      {renderHeader()}

      {/* Divider line below header for non-gradient/solid */}
      {template.headerStyle === "line" && (
        <div style={{ height: "2px", background: `linear-gradient(90deg, ${c.primary}, ${c.border}, transparent)`, marginLeft: "40px", marginRight: "40px" }} />
      )}

      {/* Body */}
      <div style={{ padding: "30px 40px", fontSize: "13px", lineHeight: "1.9", color: "#1f2937", minHeight: "200mm" }}>
        {/* Date */}
        <div style={{ textAlign: "right", fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>
          Date: {formatDate(data.date || "")}
        </div>

        {/* Recipient */}
        {data.recipientName && (
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontWeight: 600, fontSize: "12px", color: "#6b7280" }}>To,</div>
            <div style={{ fontWeight: 700, fontSize: "13.5px", color: c.primary }}>{data.recipientName}</div>
            {data.recipientDesignation && <div style={{ fontSize: "12px", color: "#4b5563" }}>{data.recipientDesignation}</div>}
            {data.recipientAddress && <div style={{ fontSize: "11.5px", color: "#6b7280", whiteSpace: "pre-wrap", marginTop: "2px" }}>{data.recipientAddress}</div>}
          </div>
        )}

        {/* Subject */}
        <div style={{ marginBottom: "18px", padding: "8px 0", borderBottom: `1px solid ${c.accent}` }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Subject: </span>
          <strong style={{ fontSize: "13.5px", color: c.primary }}>{data.subject || "___________"}</strong>
        </div>

        {/* Salutation */}
        {data.recipientName && (
          <p style={{ marginBottom: "12px" }}>Dear <strong>{data.recipientName}</strong>,</p>
        )}

        {/* Body */}
        <div style={{ whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "2", color: "#374151" }}>
          {data.body || "Letter content..."}
        </div>

        {/* Closing & Signature */}
        <div style={{ marginTop: "50px" }}>
          <div style={{ fontSize: "13px", marginBottom: "4px", color: "#374151" }}>{data.closing || "Yours sincerely,"}</div>
          <div style={{ marginTop: "35px" }}>
            {signature && <img src={signature} alt="Signature" style={{ height: "50px", objectFit: "contain", marginBottom: "4px" }} />}
            <div style={{ borderTop: `2px solid ${c.primary}`, width: "200px", paddingTop: "8px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: c.primary }}>{data.senderName || "Authorized Signatory"}</div>
              {data.senderDesignation && <div style={{ fontSize: "11px", color: "#6b7280" }}>{data.senderDesignation}</div>}
              <div style={{ fontSize: "11px", color: "#6b7280" }}>{companyName}</div>
              {data.senderPhone && <div style={{ fontSize: "10.5px", color: "#9ca3af", marginTop: "2px" }}>Ph: {data.senderPhone}</div>}
              {data.senderEmail && <div style={{ fontSize: "10.5px", color: "#9ca3af" }}>{data.senderEmail}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${c.primary}, ${c.border}, ${c.secondary})` }} />
        <div style={{ padding: "10px 40px", display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "#9ca3af", background: c.accent + "40" }}>
          <span>{companyName}</span>
          <span>{companyAddress}</span>
          {companyPhone && <span>Ph: {companyPhone}</span>}
        </div>
      </div>
    </div>
  );
}

export default function LetterheadPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState(letterheadTemplates[0]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/firms").then(r => r.json()).then(res => {
      const f = res.data || [];
      setFirms(f);
      if (f.length === 1) setSelectedFirm(f[0]);
    });
    try {
      const savedLogo = localStorage.getItem("letterhead_logo");
      const savedSig = localStorage.getItem("doc_signature");
      if (savedLogo) setLogo(savedLogo);
      if (savedSig) setSignature(savedSig);
    } catch { /* noop */ }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (type === "logo") {
        setLogo(dataUrl);
        try { localStorage.setItem("letterhead_logo", dataUrl); } catch { /* noop */ }
      } else {
        setSignature(dataUrl);
        try { localStorage.setItem("doc_signature", dataUrl); } catch { /* noop */ }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const set = (name: string, value: string) => setForm(prev => ({ ...prev, [name]: value }));

  const handlePreview = () => {
    const missing = fields.filter(f => f.required && !form[f.name]);
    if (missing.length > 0) {
      alert(`Please fill: ${missing.map(f => f.label).join(", ")}`);
      return;
    }
    setShowPreview(true);
  };

  const handlePDF = async () => {
    if (!docRef.current) return;
    setPdfLoading(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(docRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`Letterhead_${form.subject || "document"}.pdf`);
      try {
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Letterhead",
            title: `Letterhead - ${form.subject || "Document"}`,
            recipientName: form.recipientName || "",
            firmName: selectedFirm?.name || "",
            templateName: selectedTemplate.name,
            formData: form,
          }),
        });
      } catch { /* noop */ }
    } catch { window.print(); }
    finally { setPdfLoading(false); }
  };

  if (showPreview) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to Form
          </button>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handlePDF} disabled={pdfLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </button>
          </div>
        </div>
        <div ref={docRef} className="bg-white shadow-xl mx-auto print:shadow-none" style={{ maxWidth: "210mm" }}>
          {renderLetterhead(form, selectedTemplate, selectedFirm, logo, signature)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push("/documents")} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Letterhead</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Firm Selection */}
          {firms.length > 1 && (
            <div className="bg-white rounded-xl border p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Firm</label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={selectedFirm?.id || ""}
                onChange={(e) => setSelectedFirm(firms.find(f => f.id === e.target.value) || null)}
              >
                <option value="">Choose firm...</option>
                {firms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}

          {/* Logo & Signature Upload */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Branding Assets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "logo")} />
                {logo ? (
                  <div className="relative inline-block">
                    <img src={logo} alt="Logo" className="h-16 object-contain border rounded-lg p-2" />
                    <button onClick={() => { setLogo(null); try { localStorage.removeItem("letterhead_logo"); } catch {} }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => logoRef.current?.click()} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 w-full justify-center">
                    <Image className="w-4 h-4" /> Upload Logo
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
                <input ref={signatureRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "signature")} />
                {signature ? (
                  <div className="relative inline-block">
                    <img src={signature} alt="Signature" className="h-16 object-contain border rounded-lg p-2" />
                    <button onClick={() => { setSignature(null); try { localStorage.removeItem("doc_signature"); } catch {} }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => signatureRef.current?.click()} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 w-full justify-center">
                    <Upload className="w-4 h-4" /> Upload Signature
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Letter Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      value={form[f.name] || ""}
                      onChange={(e) => set(f.name, e.target.value)}
                      placeholder={f.placeholder}
                      rows={f.name === "body" ? 8 : 3}
                      className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <input
                      type={f.type || "text"}
                      value={form[f.name] || ""}
                      onChange={(e) => set(f.name, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Templates */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Choose Template</h3>
            <div className="grid grid-cols-2 gap-3">
              {letterheadTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${selectedTemplate.id === t.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"}`}
                >
                  {/* Mini preview */}
                  <div className="w-full h-16 rounded overflow-hidden bg-white border mb-2">
                    <div style={{ background: t.headerStyle === "gradient" ? `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})` : t.headerStyle === "solid" ? t.colors.primary : "white", height: "30%", borderBottom: t.headerStyle === "bordered" || t.headerStyle === "line" ? `2px solid ${t.colors.border}` : "none" }} />
                    <div style={{ padding: "4px", height: "70%" }}>
                      <div style={{ width: "70%", height: "2px", background: "#e5e7eb", marginBottom: "3px" }} />
                      <div style={{ width: "50%", height: "2px", background: "#e5e7eb", marginBottom: "3px" }} />
                      <div style={{ width: "60%", height: "2px", background: "#e5e7eb" }} />
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-gray-700 text-center truncate">{t.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handlePreview}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
          >
            Generate Letterhead
          </button>
        </div>
      </div>
    </div>
  );
}
