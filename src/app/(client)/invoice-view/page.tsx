"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Printer, Download, Share2, Mail, ArrowLeft } from "lucide-react";
import type { Invoice, BusinessSettings } from "@/lib/gst-types";
import { INVOICE_TYPE_LABELS } from "@/lib/gst-types";
import { formatCurrency, formatDate, numberToWords } from "@/lib/gst-utils";

function InvoiceViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const adminUserId = searchParams.get("userId");

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const didFetch = useRef(false);
  useEffect(() => {
    if (didFetch.current || !id) return;
    didFetch.current = true;
    const invoiceUrl = adminUserId
      ? `/api/invoices?id=${id}&adminUserId=${adminUserId}`
      : `/api/invoices?id=${id}`;
    Promise.all([
      fetch(invoiceUrl).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([iRes, sRes]) => {
      setInvoice(iRes.data || null);
      setSettings(sRes.data || null);
    }).finally(() => setLoading(false));
  }, [id, adminUserId]);

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!invoice) return;
    const text = `Invoice ${invoice.invoiceNumber}\nCustomer: ${invoice.customer.name}\nAmount: ${formatCurrency(invoice.grandTotal)}\nDate: ${formatDate(invoice.date)}\n\nView: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    if (!invoice) return;
    const subject = `Invoice ${invoice.invoiceNumber} - ${invoice.firm?.name || settings?.companyName || "GST Bill"}`;
    const body = `Dear ${invoice.customer.name},\n\nPlease find the invoice details below:\n\nInvoice #: ${invoice.invoiceNumber}\nAmount: ${formatCurrency(invoice.grandTotal)}\nDate: ${formatDate(invoice.date)}\nDue Date: ${invoice.dueDate ? formatDate(invoice.dueDate) : "N/A"}\n\nThank you for your business.\n\n${invoice.firm?.name || settings?.companyName || ""}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
  if (!invoice) return <div className="text-center py-20 text-gray-400">Invoice not found</div>;

  const firmName = invoice.firm?.name || settings?.companyName || "Your Company";
  const firmAddress = invoice.firm?.address || settings?.address || "";
  const firmCity = invoice.firm?.city || settings?.city || "";
  const firmState = invoice.firm?.state || settings?.state || "";
  const firmGstin = invoice.firm?.gstin || settings?.gstin || "";
  const firmPan = invoice.firm?.pan || settings?.pan || "";
  const firmPhone = invoice.firm?.phone || settings?.phone || "";
  const firmEmail = invoice.firm?.email || "";
  const hasLetterhead = !!invoice.letterhead;

  const placeOfSupply = invoice.customer.state
    ? `${invoice.customer.state}${invoice.customer.stateCode ? ` (${invoice.customer.stateCode})` : ""}`
    : "";

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm">
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={handleEmail} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm">
            <Mail className="w-4 h-4" /> Email
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium shadow-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Premium GST Invoice */}
      <div className="bg-white max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        {/* Google Fonts */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Letterhead background */}
        {hasLetterhead && (
          <div className="absolute inset-0 z-0 print:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={invoice.letterhead} alt="Letterhead" className="w-full h-full object-cover opacity-15 print:opacity-20" />
          </div>
        )}

        <div className="relative z-10 border border-gray-200 shadow-lg">
          {/* ═══ HEADER ═══ */}
          <div className="text-white px-7 py-6 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4e 40%, #1a3f6f 70%, #2a5298 100%)" }}>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg" style={{ fontFamily: "'Playfair Display', Georgia, serif", background: "linear-gradient(135deg, #c9a84c 0%, #f0d78c 50%, #c9a84c 100%)", color: "#0a1628" }}>
                {firmName.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", letterSpacing: "3px" }}>{firmName}</h1>
                <p className="text-sm mt-1 font-medium tracking-widest uppercase" style={{ color: "#c9a84c" }}>{INVOICE_TYPE_LABELS[invoice.invoiceType]}</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-md text-xs font-bold tracking-widest uppercase" style={{ border: "1.5px solid #c9a84c", color: "#c9a84c", background: "rgba(201, 168, 76, 0.08)" }}>
              Original for Recipient
            </div>
          </div>

          {/* ═══ SELLER + INVOICE DETAILS ═══ */}
          <div className="grid grid-cols-5 border-b border-gray-200">
            {/* Seller Details - 3 cols */}
            <div className="col-span-3 px-7 py-5 border-r border-gray-200">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #122a4e, #1a3f6f)" }}>
                  <span className="text-white text-[10px] font-bold">S</span>
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", color: "#122a4e" }}>Seller / Supplier Details</h3>
              </div>
              <table className="text-[13px] leading-relaxed">
                <tbody>
                  <tr><td className="pr-4 py-1 font-semibold text-gray-500 whitespace-nowrap" style={{ fontFamily: "'Inter', sans-serif" }}>Company Name</td><td className="px-2 text-gray-300">:</td><td className="py-1 font-bold text-gray-900" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: "14px" }}>{firmName}</td></tr>
                  {firmAddress && <tr><td className="pr-4 py-1 font-semibold text-gray-500">Address</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-700">{firmAddress}{firmCity ? `, ${firmCity}` : ""}{firmState ? ` - ${firmState}` : ""}, India</td></tr>}
                  {firmGstin && <tr><td className="pr-4 py-1 font-semibold text-gray-500">GSTIN</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-800 font-mono font-semibold tracking-wide">{firmGstin}</td></tr>}
                  {firmPan && <tr><td className="pr-4 py-1 font-semibold text-gray-500">PAN</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-800 font-mono font-semibold tracking-wide">{firmPan}</td></tr>}
                  {firmState && <tr><td className="pr-4 py-1 font-semibold text-gray-500">State</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-700">{firmState}</td></tr>}
                  {firmPhone && <tr><td className="pr-4 py-1 font-semibold text-gray-500">Contact</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-700 font-medium">{firmPhone}</td></tr>}
                  {firmEmail && <tr><td className="pr-4 py-1 font-semibold text-gray-500">Email</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-700">{firmEmail}</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Invoice Details - 2 cols */}
            <div className="col-span-2 px-6 py-5" style={{ background: "linear-gradient(180deg, #f0f4fa 0%, #e4ebf5 100%)" }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #122a4e, #1a3f6f)" }}>
                  <span className="text-white text-[10px] font-bold">I</span>
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", color: "#122a4e" }}>Invoice Details</h3>
              </div>
              <table className="text-[13px] w-full leading-relaxed">
                <tbody>
                  <tr><td className="pr-4 py-1.5 font-semibold text-gray-500">Invoice No.</td><td className="px-2 text-gray-300">:</td><td className="py-1.5 font-bold text-gray-900 text-[15px]" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>{invoice.invoiceNumber}</td></tr>
                  <tr><td className="pr-4 py-1.5 font-semibold text-gray-500">Invoice Date</td><td className="px-2 text-gray-300">:</td><td className="py-1.5 text-gray-700 font-medium">{formatDate(invoice.date)}</td></tr>
                  {invoice.dueDate && <tr><td className="pr-4 py-1.5 font-semibold text-gray-500">Due Date</td><td className="px-2 text-gray-300">:</td><td className="py-1.5 text-gray-700 font-medium">{formatDate(invoice.dueDate)}</td></tr>}
                  {placeOfSupply && <tr><td className="pr-4 py-1.5 font-semibold text-gray-500">Place of Supply</td><td className="px-2 text-gray-300">:</td><td className="py-1.5 text-gray-700 font-medium">{placeOfSupply}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ BILL TO ═══ */}
          <div className="px-7 py-5 border-b border-gray-200">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #122a4e, #1a3f6f)" }}>
                <span className="text-white text-[10px] font-bold">B</span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", color: "#122a4e" }}>Bill To</h3>
            </div>
            <table className="text-[13px] leading-relaxed">
              <tbody>
                <tr><td className="pr-4 py-1 font-semibold text-gray-500 whitespace-nowrap">Customer Name</td><td className="px-2 text-gray-300">:</td><td className="py-1 font-bold text-gray-900" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: "14px" }}>{invoice.customer.name}</td></tr>
                {invoice.customer.address && <tr><td className="pr-4 py-1 font-semibold text-gray-500">Address</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-700">{invoice.customer.address}{invoice.customer.city ? `, ${invoice.customer.city}` : ""}{invoice.customer.state ? `, ${invoice.customer.state}` : ""}, India</td></tr>}
                {invoice.customer.gstin && <tr><td className="pr-4 py-1 font-semibold text-gray-500">GSTIN</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-800 font-mono font-semibold tracking-wide">{invoice.customer.gstin}</td></tr>}
                {invoice.customer.state && <tr><td className="pr-4 py-1 font-semibold text-gray-500">State</td><td className="px-2 text-gray-300">:</td><td className="py-1 text-gray-700">{invoice.customer.state}{invoice.customer.stateCode ? ` (${invoice.customer.stateCode})` : ""}</td></tr>}
              </tbody>
            </table>
          </div>

          {/* ═══ ITEMS TABLE ═══ */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
              <thead>
                <tr className="text-white" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4e 40%, #1a3f6f 100%)" }}>
                  <th className="px-3 py-3.5 text-center border-r border-blue-900/40 w-12 font-semibold text-[12px] uppercase tracking-wider" rowSpan={2}>Sr.</th>
                  <th className="px-3 py-3.5 text-left border-r border-blue-900/40 font-semibold text-[12px] uppercase tracking-wider" rowSpan={2}>Description of Goods / Services</th>
                  <th className="px-3 py-3.5 text-center border-r border-blue-900/40 w-20 font-semibold text-[12px] uppercase tracking-wider" rowSpan={2}>HSN / SAC</th>
                  <th className="px-3 py-3.5 text-center border-r border-blue-900/40 w-14 font-semibold text-[12px] uppercase tracking-wider" rowSpan={2}>Qty</th>
                  <th className="px-3 py-3.5 text-right border-r border-blue-900/40 w-24 font-semibold text-[12px] uppercase tracking-wider" rowSpan={2}>Rate (₹)</th>
                  <th className="px-3 py-3.5 text-right border-r border-blue-900/40 w-28 font-semibold text-[12px] uppercase tracking-wider" rowSpan={2}>Taxable Value</th>
                  {!invoice.isInterState ? (
                    <th className="px-2 py-2 text-center border-r border-blue-900/40 font-semibold text-[11px] uppercase tracking-wider" colSpan={2}>Tax Rate</th>
                  ) : (
                    <th className="px-2 py-2 text-center border-r border-blue-900/40 font-semibold text-[11px] uppercase tracking-wider">Tax Rate</th>
                  )}
                  <th className="px-3 py-3.5 text-right border-r border-blue-900/40 w-24 font-semibold text-[12px] uppercase tracking-wider" rowSpan={2}>Tax (₹)</th>
                  <th className="px-3 py-3.5 text-right w-28 font-semibold text-[12px] uppercase tracking-wider" rowSpan={2}>Total (₹)</th>
                </tr>
                <tr className="text-white text-[11px]" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4e 40%, #1a3f6f 100%)" }}>
                  {!invoice.isInterState ? (
                    <>
                      <th className="px-2 py-2 text-center border-r border-blue-900/40 w-14 font-semibold tracking-wider">CGST</th>
                      <th className="px-2 py-2 text-center border-r border-blue-900/40 w-14 font-semibold tracking-wider">SGST</th>
                    </>
                  ) : (
                    <th className="px-2 py-2 text-center border-r border-blue-900/40 w-14 font-semibold tracking-wider">IGST</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => {
                  const itemTax = item.cgst + item.sgst + item.igst;
                  const lineTotal = item.amount + itemTax;
                  return (
                    <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"} hover:bg-blue-50/30 transition-colors`}>
                      <td className="px-3 py-3.5 text-center border-r border-gray-100 font-semibold text-gray-600">{idx + 1}</td>
                      <td className="px-3 py-3.5 border-r border-gray-100 font-semibold text-gray-900">{item.description}</td>
                      <td className="px-3 py-3.5 text-center border-r border-gray-100 font-mono text-gray-600 font-medium text-[12px]">{item.hsn}</td>
                      <td className="px-3 py-3.5 text-center border-r border-gray-100 font-medium text-gray-700">{item.qty} {item.unit}</td>
                      <td className="px-3 py-3.5 text-right border-r border-gray-100 font-medium text-gray-700">{formatCurrency(item.rate)}</td>
                      <td className="px-3 py-3.5 text-right border-r border-gray-100 font-semibold text-gray-800">{formatCurrency(item.amount)}</td>
                      {!invoice.isInterState ? (
                        <>
                          <td className="px-2 py-3.5 text-center border-r border-gray-100 font-medium text-gray-600">{item.gstRate / 2}%</td>
                          <td className="px-2 py-3.5 text-center border-r border-gray-100 font-medium text-gray-600">{item.gstRate / 2}%</td>
                        </>
                      ) : (
                        <td className="px-2 py-3.5 text-center border-r border-gray-100 font-medium text-gray-600">{item.gstRate}%</td>
                      )}
                      <td className="px-3 py-3.5 text-right border-r border-gray-100 font-semibold text-gray-800">
                        {formatCurrency(itemTax)}
                        {!invoice.isInterState ? (
                          <span className="block text-[10px] text-gray-400 mt-0.5 font-normal">(C: {formatCurrency(item.cgst)} + S: {formatCurrency(item.sgst)})</span>
                        ) : (
                          <span className="block text-[10px] text-gray-400 mt-0.5 font-normal">(IGST)</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold text-gray-900" style={{ fontSize: "14px" }}>{formatCurrency(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ═══ TOTALS ═══ */}
          <div className="border-t border-gray-200">
            <table className="w-full text-[13px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              <tbody>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="px-6 py-3 text-right font-semibold text-gray-500 uppercase tracking-wide text-[12px]" colSpan={2}>Subtotal (Taxable Value)</td>
                  <td className="px-6 py-3 text-right font-bold w-36 text-gray-800" style={{ fontSize: "14px" }}>{formatCurrency(invoice.subtotal)}</td>
                </tr>
                {!invoice.isInterState ? (
                  <>
                    <tr className="border-b border-gray-100">
                      <td className="px-6 py-2.5 text-right font-semibold text-gray-500 text-[12px]" colSpan={2}>CGST @ {invoice.items[0]?.gstRate ? invoice.items[0].gstRate / 2 : 0}%</td>
                      <td className="px-6 py-2.5 text-right font-bold w-36 text-gray-700">{formatCurrency(invoice.totalCgst)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-6 py-2.5 text-right font-semibold text-gray-500 text-[12px]" colSpan={2}>SGST @ {invoice.items[0]?.gstRate ? invoice.items[0].gstRate / 2 : 0}%</td>
                      <td className="px-6 py-2.5 text-right font-bold w-36 text-gray-700">{formatCurrency(invoice.totalSgst)}</td>
                    </tr>
                  </>
                ) : (
                  <tr className="border-b border-gray-100">
                    <td className="px-6 py-2.5 text-right font-semibold text-gray-500 text-[12px]" colSpan={2}>IGST @ {invoice.items[0]?.gstRate || 0}%</td>
                    <td className="px-6 py-2.5 text-right font-bold w-36 text-gray-700">{formatCurrency(invoice.totalIgst)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ═══ GRAND TOTAL + AMOUNT IN WORDS ═══ */}
          <div className="flex border-t-2" style={{ borderColor: "#122a4e" }}>
            <div className="flex-1 px-7 py-4" style={{ background: "linear-gradient(135deg, #f0f4fa 0%, #e8eef7 100%)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#122a4e" }}>Amount in Words</p>
              <p className="text-sm font-semibold italic" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#122a4e", lineHeight: "1.5" }}>{numberToWords(invoice.grandTotal)}</p>
            </div>
            <div className="px-8 py-4 flex items-center gap-5" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4e 50%, #1a3f6f 100%)" }}>
              <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "#c9a84c", fontFamily: "'Outfit', 'Inter', sans-serif" }}>Grand Total</span>
              <span className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Outfit', 'Inter', sans-serif", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {formatCurrency(invoice.grandTotal)}
              </span>
            </div>
          </div>

          {/* ═══ BOTTOM: PAYMENT + TERMS + SIGNATURE ═══ */}
          <div className="grid grid-cols-3 border-t border-gray-200 text-[13px]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Payment Details */}
            <div className="px-5 py-5 border-r border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #122a4e, #1a3f6f)" }}>
                  <span className="text-white text-[9px] font-bold">₹</span>
                </div>
                <h4 className="font-bold uppercase text-[11px] tracking-widest" style={{ color: "#122a4e", fontFamily: "'Outfit', 'Inter', sans-serif" }}>Payment Details</h4>
              </div>
              {(invoice.firm?.bankName || settings?.bankName) ? (
                <table className="text-[12px] leading-relaxed">
                  <tbody>
                    <tr><td className="pr-2 py-0.5 font-semibold text-gray-500">Bank</td><td className="px-1.5 text-gray-300">:</td><td className="py-0.5 font-medium text-gray-800">{invoice.firm?.bankName || settings?.bankName}</td></tr>
                    <tr><td className="pr-2 py-0.5 font-semibold text-gray-500">A/C No.</td><td className="px-1.5 text-gray-300">:</td><td className="py-0.5 font-mono font-medium text-gray-800 tracking-wide">{invoice.firm?.accountNumber || settings?.accountNumber}</td></tr>
                    <tr><td className="pr-2 py-0.5 font-semibold text-gray-500">IFSC</td><td className="px-1.5 text-gray-300">:</td><td className="py-0.5 font-mono font-medium text-gray-800 tracking-wide">{invoice.firm?.ifscCode || settings?.ifscCode}</td></tr>
                    {(invoice.firm?.branchName || settings?.branchName) && <tr><td className="pr-2 py-0.5 font-semibold text-gray-500">Branch</td><td className="px-1.5 text-gray-300">:</td><td className="py-0.5 font-medium text-gray-700">{invoice.firm?.branchName || settings?.branchName}</td></tr>}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 italic text-[12px]">Not provided</p>
              )}
            </div>

            {/* Terms & Notes */}
            <div className="px-5 py-5 border-r border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #122a4e, #1a3f6f)" }}>
                  <span className="text-white text-[9px] font-bold">T</span>
                </div>
                <h4 className="font-bold uppercase text-[11px] tracking-widest" style={{ color: "#122a4e", fontFamily: "'Outfit', 'Inter', sans-serif" }}>Terms & Notes</h4>
              </div>
              <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                {invoice.terms ? (
                  invoice.terms.split("\n").map((line, i) => <li key={i}>{line}</li>)
                ) : (
                  <>
                    <li>Goods once sold will not be taken back.</li>
                    <li>Please make payment within the due date.</li>
                    <li>Interest @ 18% p.a. on overdue payments.</li>
                  </>
                )}
              </ul>
              {invoice.notes && (
                <p className="mt-2.5 pt-2.5 border-t border-gray-200 text-[11px] text-gray-600 leading-relaxed">{invoice.notes}</p>
              )}
            </div>

            {/* Authorized Signatory */}
            <div className="px-5 py-5 flex flex-col items-center justify-between">
              <h4 className="font-bold uppercase text-[11px] tracking-widest" style={{ color: "#122a4e", fontFamily: "'Outfit', 'Inter', sans-serif" }}>Authorized Signatory</h4>
              <div className="flex-1 flex items-center justify-center py-3">
                {invoice.signature ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={invoice.signature.imageData} alt={invoice.signature.directorName} className="h-20 w-auto object-contain" />
                  </>
                ) : (
                  <div className="w-full border-b-2 border-dotted border-gray-300 mt-8" />
                )}
              </div>
              <div className="text-center">
                {invoice.signature?.directorName && (
                  <p className="font-bold text-[13px] text-gray-900" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>{invoice.signature.directorName}</p>
                )}
                {(invoice.firm?.signatureText || settings?.signatureText) && !invoice.signature?.directorName && (
                  <p className="font-bold text-[13px] text-gray-900" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>{invoice.firm?.signatureText || settings?.signatureText}</p>
                )}
                <p className="text-[11px] text-gray-500 mt-1 font-medium">For {firmName}</p>
                <p className="text-[10px] text-gray-400 italic mt-0.5">Authorized Signatory</p>
              </div>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="text-white text-center py-3 text-[11px] font-medium tracking-widest" style={{ background: "linear-gradient(135deg, #0a1628 0%, #122a4e 40%, #1a3f6f 70%, #2a5298 100%)" }}>
            This is a Computer Generated Invoice &nbsp;&bull;&nbsp; E. &amp; O.E.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceViewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>}>
      <InvoiceViewContent />
    </Suspense>
  );
}
