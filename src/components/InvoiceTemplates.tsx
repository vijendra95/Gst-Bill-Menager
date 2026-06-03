"use client";

import type { Invoice, BusinessSettings } from "@/lib/gst-types";
import { INVOICE_TYPE_LABELS } from "@/lib/gst-types";
import { formatCurrency, formatDate, numberToWords } from "@/lib/gst-utils";

export interface InvoiceTemplateProps {
  invoice: Invoice;
  settings: BusinessSettings | null;
  currentUserId: string;
  cv: { hsn: boolean; qty: boolean; rate: boolean; taxableAmount: boolean; gstRate: boolean; unit: boolean };
}

function firmData(invoice: Invoice, settings: BusinessSettings | null) {
  return {
    name: invoice.firm?.name || settings?.companyName || "Your Company",
    address: invoice.firm?.address || settings?.address || "",
    city: invoice.firm?.city || settings?.city || "",
    state: invoice.firm?.state || settings?.state || "",
    gstin: invoice.firm?.gstin || settings?.gstin || "",
    pan: invoice.firm?.pan || settings?.pan || "",
    phone: invoice.firm?.phone || settings?.phone || "",
    email: invoice.firm?.email || "",
    logo: invoice.firm?.logo || "",
  };
}

function placeOfSupply(invoice: Invoice) {
  return invoice.customer.state
    ? `${invoice.customer.state}${invoice.customer.stateCode ? ` (${invoice.customer.stateCode})` : ""}`
    : "";
}

function hsnSummary(invoice: Invoice) {
  const map: Record<string, { hsn: string; taxableValue: number; cgst: number; sgst: number; igst: number; totalTax: number; rate: number }> = {};
  for (const item of invoice.items) {
    const key = item.hsn || "N/A";
    if (!map[key]) map[key] = { hsn: key, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, rate: item.gstRate };
    map[key].taxableValue += item.amount;
    map[key].cgst += item.cgst;
    map[key].sgst += item.sgst;
    map[key].igst += item.igst;
    map[key].totalTax += item.cgst + item.sgst + item.igst;
  }
  return Object.values(map);
}

function QRSection({ invoice, currentUserId }: { invoice: Invoice; currentUserId: string }) {
  if (invoice.invoiceType !== "tax_invoice" || !invoice.firm?.gstin) return null;
  return (
    <div className="flex items-center justify-between px-5 py-2 border-t border-black/30 bg-gray-50">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`https://gstbillmanager.com/verify?id=${invoice.id}&uid=${invoice.userId}`)}`}
          alt="QR" width={60} height={60} className="rounded"
        />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">E-Invoice QR Code</p>
          <p className="text-[9px] text-gray-400">Scan to verify invoice details</p>
        </div>
      </div>
      <div className="text-right text-[9px] text-gray-400">
        <p>IRN: {invoice.id.substring(0, 16).toUpperCase()}</p>
      </div>
    </div>
  );
}

function SignatureBlock({ invoice, settings, firmName }: { invoice: Invoice; settings: BusinessSettings | null; firmName: string }) {
  return (
    <div className="flex flex-col items-center justify-between min-h-[100px]">
      <p className="font-bold uppercase text-[11px] tracking-widest text-gray-700">Authorized Signatory</p>
      <div className="flex-1 flex items-center justify-center py-2">
        {invoice.signature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={invoice.signature.imageData} alt={invoice.signature.directorName} className="h-16 w-auto object-contain" />
        ) : (
          <div className="w-32 border-b-2 border-dotted border-gray-400 mt-6" />
        )}
      </div>
      <div className="text-center">
        {invoice.signature?.directorName && <p className="font-bold text-[12px] text-gray-900">{invoice.signature.directorName}</p>}
        {(invoice.firm?.signatureText || settings?.signatureText) && !invoice.signature?.directorName && (
          <p className="font-bold text-[12px] text-gray-900">{invoice.firm?.signatureText || settings?.signatureText}</p>
        )}
        <p className="text-[10px] text-gray-500 mt-0.5">For {firmName}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TEMPLATE 1: CLASSIC (Traditional GST Bill — like Reliable Peripherals)
// ════════════════════════════════════════════════════════════════
export function ClassicTemplate({ invoice, settings, currentUserId, cv }: InvoiceTemplateProps) {
  const f = firmData(invoice, settings);
  const pos = placeOfSupply(invoice);
  const hsn = hsnSummary(invoice);

  return (
    <div className="bg-white max-w-4xl mx-auto print:shadow-none print:p-0" style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", fontSize: "12px" }}>
      {invoice.letterhead && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={invoice.letterhead} alt="" className="w-full h-full object-cover opacity-10" />
        </div>
      )}
      <div className="relative z-10 border-2 border-black">
        {/* Header */}
        <div className="text-center border-b-2 border-black px-4 py-2 font-bold text-[14px] uppercase tracking-wide bg-gray-100">
          {INVOICE_TYPE_LABELS[invoice.invoiceType]}
        </div>

        {/* Company + Invoice Details */}
        <div className="flex border-b-2 border-black">
          {/* Seller */}
          <div className="flex-1 p-4 border-r-2 border-black">
            <div className="flex items-start gap-3">
              {f.logo && (
                <div className="w-14 h-14 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.logo} alt={f.name} className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <p className="font-bold text-[16px] uppercase mb-1">{f.name}</p>
                {f.address && <p className="text-[11px]">{f.address}{f.city ? `, ${f.city}` : ""}{f.state ? `-${f.state}` : ""}</p>}
                {f.gstin && <p className="text-[11px]">GSTIN/UIN: <span className="font-bold">{f.gstin}</span></p>}
                {f.state && <p className="text-[11px]">State Name: {f.state}</p>}
                {f.phone && <p className="text-[11px]">Contact: {f.phone}</p>}
                {f.email && <p className="text-[11px]">E-Mail: {f.email}</p>}
              </div>
            </div>
          </div>
          {/* Invoice Meta */}
          <div className="w-[280px] text-[11px]">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-black">
                  <td className="p-1.5 border-r border-black font-semibold">Invoice No.</td>
                  <td className="p-1.5 border-r border-black font-bold">{invoice.invoiceNumber}</td>
                  <td className="p-1.5 font-semibold">Dated</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1.5 border-r border-black"></td>
                  <td className="p-1.5 border-r border-black"></td>
                  <td className="p-1.5 font-bold">{formatDate(invoice.date)}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1.5 border-r border-black font-semibold">Delivery Note</td>
                  <td className="p-1.5 border-r border-black"></td>
                  <td className="p-1.5 font-semibold">Mode/Terms</td>
                </tr>
                {invoice.dueDate && (
                  <tr className="border-b border-black">
                    <td className="p-1.5 border-r border-black font-semibold">Due Date</td>
                    <td className="p-1.5 border-r border-black" colSpan={2}>{formatDate(invoice.dueDate)}</td>
                  </tr>
                )}
                {pos && (
                  <tr className="border-b border-black">
                    <td className="p-1.5 border-r border-black font-semibold">Dispatched through</td>
                    <td className="p-1.5 border-r border-black" colSpan={2}>{pos}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="p-4 border-b-2 border-black">
          <p className="text-[11px] font-semibold mb-1">Buyer (Bill to)</p>
          <p className="font-bold text-[14px] uppercase">{invoice.customer.name}</p>
          {invoice.customer.address && <p className="text-[11px]">{invoice.customer.address}{invoice.customer.city ? `, ${invoice.customer.city}` : ""}{invoice.customer.state ? `, ${invoice.customer.state}` : ""}</p>}
          {invoice.customer.gstin && <p className="text-[11px]">GSTIN/UIN: <span className="font-bold">{invoice.customer.gstin}</span></p>}
          {invoice.customer.gstin && invoice.customer.gstin.length >= 12 && <p className="text-[11px]">PAN: <span className="font-bold">{invoice.customer.gstin.substring(2, 12)}</span></p>}
          {invoice.customer.state && <p className="text-[11px]">State Name: {invoice.customer.state}{invoice.customer.stateCode ? `, Code: ${invoice.customer.stateCode}` : ""}</p>}
          {invoice.customer.phone && <p className="text-[11px]">Contact: {invoice.customer.phone}</p>}
          {invoice.customer.email && <p className="text-[11px]">E-Mail: {invoice.customer.email}</p>}

        </div>

        {/* Items Table */}
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-gray-100 font-bold border-b-2 border-black">
              <th className="p-2 border-r border-black text-center w-[35px]">Sl No.</th>
              <th className="p-2 border-r border-black text-left">Description of Goods</th>
              {cv.hsn && <th className="p-2 border-r border-black text-center w-[70px]">HSN/SAC</th>}
              {cv.qty && <th className="p-2 border-r border-black text-center w-[60px]">Quantity</th>}
              {cv.rate && <th className="p-2 border-r border-black text-right w-[80px]">Rate</th>}
              {cv.taxableAmount && <th className="p-2 border-r border-black text-right w-[75px]">Amount</th>}
              {cv.gstRate && (!invoice.isInterState ? (
                <>
                  <th className="p-2 border-r border-black text-center w-[48px]">CGST%</th>
                  <th className="p-2 border-r border-black text-center w-[48px]">SGST%</th>
                </>
              ) : (
                <th className="p-2 border-r border-black text-center w-[48px]">IGST%</th>
              ))}
              <th className="p-2 text-right w-[75px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-black/30">
                <td className="p-2 border-r border-black/30 text-center">{idx + 1}</td>
                <td className="p-2 border-r border-black/30 font-medium">{item.description}</td>
                {cv.hsn && <td className="p-2 border-r border-black/30 text-center font-mono text-[10px]">{item.hsn}</td>}
                {cv.qty && <td className="p-2 border-r border-black/30 text-center">{item.qty}{cv.unit ? ` ${item.unit}` : ""}</td>}
                {cv.rate && <td className="p-2 border-r border-black/30 text-right">{formatCurrency(item.rate)}</td>}
                {cv.taxableAmount && <td className="p-2 border-r border-black/30 text-right">{formatCurrency(item.amount)}</td>}
                {cv.gstRate && (!invoice.isInterState ? (
                  <>
                    <td className="p-2 border-r border-black/30 text-center">{item.gstRate / 2}%</td>
                    <td className="p-2 border-r border-black/30 text-center">{item.gstRate / 2}%</td>
                  </>
                ) : (
                  <td className="p-2 border-r border-black/30 text-center">{item.gstRate}%</td>
                ))}
                <td className="p-2 text-right font-semibold">{formatCurrency(item.amount + item.cgst + item.sgst + item.igst)}</td>
              </tr>
            ))}
            {/* Empty rows for traditional look */}
            {invoice.items.length < 5 && Array.from({ length: 5 - invoice.items.length }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-black/20 h-[28px]">
                <td className="border-r border-black/20"></td>
                <td className="border-r border-black/20"></td>
                {cv.hsn && <td className="border-r border-black/20"></td>}
                {cv.qty && <td className="border-r border-black/20"></td>}
                {cv.rate && <td className="border-r border-black/20"></td>}
                {cv.taxableAmount && <td className="border-r border-black/20"></td>}
                {cv.gstRate && (!invoice.isInterState ? (
                  <><td className="border-r border-black/20"></td><td className="border-r border-black/20"></td></>
                ) : (
                  <td className="border-r border-black/20"></td>
                ))}
                <td></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold bg-gray-50">
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 border-r border-black text-right font-bold">Total</td>
              {cv.hsn && <td className="p-2 border-r border-black"></td>}
              {cv.qty && <td className="p-2 border-r border-black text-center">{invoice.items.reduce((s, i) => s + i.qty, 0)}</td>}
              {cv.rate && <td className="p-2 border-r border-black"></td>}
              {cv.taxableAmount && <td className="p-2 border-r border-black"></td>}
              {cv.gstRate && (!invoice.isInterState ? (
                <><td className="p-2 border-r border-black"></td><td className="p-2 border-r border-black"></td></>
              ) : (
                <td className="p-2 border-r border-black"></td>
              ))}
              <td className="p-2 text-right text-[13px]">{formatCurrency(invoice.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in Words */}
        <div className="px-4 py-2 border-t-2 border-black text-[11px]">
          <p><span className="font-semibold">Amount Chargeable (in words):</span></p>
          <p className="font-bold italic">INR {numberToWords(invoice.grandTotal)} Only</p>
          <p className="text-right text-[10px] text-gray-500">E. &amp; O.E</p>
        </div>

        {/* HSN-wise Tax Summary */}
        <div className="border-t-2 border-black">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="font-bold bg-gray-100 border-b border-black">
                <th className="p-1.5 border-r border-black text-left" rowSpan={2}>HSN/SAC</th>
                <th className="p-1.5 border-r border-black text-right" rowSpan={2}>Taxable Value</th>
                {!invoice.isInterState ? (
                  <>
                    <th className="p-1 border-r border-black text-center border-b" colSpan={2}>CGST</th>
                    <th className="p-1 border-r border-black text-center border-b" colSpan={2}>SGST/UTGST</th>
                  </>
                ) : (
                  <th className="p-1 border-r border-black text-center border-b" colSpan={2}>IGST</th>
                )}
                <th className="p-1.5 text-right" rowSpan={2}>Total Tax Amount</th>
              </tr>
              <tr className="font-bold bg-gray-100 border-b border-black">
                {!invoice.isInterState ? (
                  <>
                    <th className="p-1 border-r border-black text-center">Rate</th>
                    <th className="p-1 border-r border-black text-right">Amount</th>
                    <th className="p-1 border-r border-black text-center">Rate</th>
                    <th className="p-1 border-r border-black text-right">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="p-1 border-r border-black text-center">Rate</th>
                    <th className="p-1 border-r border-black text-right">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {hsn.map((row, i) => (
                <tr key={i} className="border-b border-black/30">
                  <td className="p-1.5 border-r border-black/30 font-mono">{row.hsn}</td>
                  <td className="p-1.5 border-r border-black/30 text-right">{formatCurrency(row.taxableValue)}</td>
                  {!invoice.isInterState ? (
                    <>
                      <td className="p-1.5 border-r border-black/30 text-center">{row.rate / 2}%</td>
                      <td className="p-1.5 border-r border-black/30 text-right">{formatCurrency(row.cgst)}</td>
                      <td className="p-1.5 border-r border-black/30 text-center">{row.rate / 2}%</td>
                      <td className="p-1.5 border-r border-black/30 text-right">{formatCurrency(row.sgst)}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-1.5 border-r border-black/30 text-center">{row.rate}%</td>
                      <td className="p-1.5 border-r border-black/30 text-right">{formatCurrency(row.igst)}</td>
                    </>
                  )}
                  <td className="p-1.5 text-right font-semibold">{formatCurrency(row.totalTax)}</td>
                </tr>
              ))}
              <tr className="font-bold border-t border-black bg-gray-50">
                <td className="p-1.5 border-r border-black text-right">Total</td>
                <td className="p-1.5 border-r border-black text-right">{formatCurrency(hsn.reduce((s, r) => s + r.taxableValue, 0))}</td>
                {!invoice.isInterState ? (
                  <>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black text-right">{formatCurrency(hsn.reduce((s, r) => s + r.cgst, 0))}</td>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black text-right">{formatCurrency(hsn.reduce((s, r) => s + r.sgst, 0))}</td>
                  </>
                ) : (
                  <>
                    <td className="p-1.5 border-r border-black"></td>
                    <td className="p-1.5 border-r border-black text-right">{formatCurrency(hsn.reduce((s, r) => s + r.igst, 0))}</td>
                  </>
                )}
                <td className="p-1.5 text-right">{formatCurrency(hsn.reduce((s, r) => s + r.totalTax, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tax Amount in Words */}
        <div className="px-4 py-2 border-t border-black text-[11px]">
          <p><span className="font-semibold">Tax Amount (in words):</span> <span className="font-bold italic">INR {numberToWords(invoice.totalTax)} Only</span></p>
          {f.pan && <p className="mt-1"><span className="font-semibold">Company&apos;s PAN:</span> <span className="font-bold">{f.pan}</span></p>}
        </div>

        {/* Declaration + Bank + Signature */}
        <div className="flex border-t-2 border-black text-[11px]">
          <div className="flex-1 p-3 border-r border-black">
            <p className="font-bold mb-1">Declaration</p>
            {invoice.terms ? (
              invoice.terms.split("\n").map((line, i) => <p key={i} className="text-[10px]">{i + 1}. {line}</p>)
            ) : (
              <>
                <p className="text-[10px]">1. Goods once sold will not be taken back.</p>
                <p className="text-[10px]">2. Interest @ 18% p.a. on overdue payments.</p>
              </>
            )}
          </div>
          <div className="flex-1 p-3 border-r border-black">
            <p className="font-bold mb-1">Company&apos;s Bank Details</p>
            {(invoice.firm?.bankName || settings?.bankName) ? (
              <div className="text-[10px]">
                <p>A/c Holder&apos;s Name: <span className="font-bold">{f.name}</span></p>
                <p>Bank Name: <span className="font-bold">{invoice.firm?.bankName || settings?.bankName}</span></p>
                <p>A/c No.: <span className="font-bold font-mono">{invoice.firm?.accountNumber || settings?.accountNumber}</span></p>
                <p>IFSC: <span className="font-bold font-mono">{invoice.firm?.ifscCode || settings?.ifscCode}</span></p>
                {(invoice.firm?.branchName || settings?.branchName) && <p>Branch: {invoice.firm?.branchName || settings?.branchName}</p>}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">Not provided</p>
            )}
          </div>
          <div className="w-[180px] p-3 text-center">
            <p className="font-bold text-[10px] mb-1">for {f.name}</p>
            <SignatureBlock invoice={invoice} settings={settings} firmName={f.name} />
          </div>
        </div>

        <QRSection invoice={invoice} currentUserId={currentUserId} />

        {/* Footer */}
        <div className="text-center py-2 text-[10px] border-t border-black bg-gray-100 font-medium">
          This is a Computer Generated Invoice &bull; E. &amp; O.E.
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TEMPLATE 2: MINIMAL (Clean black & white)
// ════════════════════════════════════════════════════════════════
export function MinimalTemplate({ invoice, settings, currentUserId, cv }: InvoiceTemplateProps) {
  const f = firmData(invoice, settings);
  const pos = placeOfSupply(invoice);

  return (
    <div className="bg-white max-w-4xl mx-auto print:shadow-none print:p-0" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "12px" }}>
      {invoice.letterhead && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={invoice.letterhead} alt="" className="w-full h-full object-cover opacity-10" />
        </div>
      )}
      <div className="relative z-10 border border-gray-300">
        {/* Header - minimal */}
        <div className="px-8 py-6 border-b border-gray-300">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {f.logo && (
                <div className="w-14 h-14 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.logo} alt={f.name} className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{f.name}</h1>
                {f.address && <p className="text-gray-500 text-[11px] mt-1">{f.address}{f.city ? `, ${f.city}` : ""}{f.state ? ` - ${f.state}` : ""}</p>}
                {f.gstin && <p className="text-[11px] text-gray-600 mt-0.5">GSTIN: <span className="font-semibold font-mono">{f.gstin}</span></p>}
                {f.phone && <p className="text-[11px] text-gray-500">Phone: {f.phone} {f.email ? `| Email: ${f.email}` : ""}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light text-gray-400 uppercase tracking-[6px]">{INVOICE_TYPE_LABELS[invoice.invoiceType]}</p>
              <p className="mt-3 text-gray-900 font-bold text-lg">#{invoice.invoiceNumber}</p>
              <p className="text-[11px] text-gray-500 mt-1">Date: {formatDate(invoice.date)}</p>
              {invoice.dueDate && <p className="text-[11px] text-gray-500">Due: {formatDate(invoice.dueDate)}</p>}
              {pos && <p className="text-[11px] text-gray-500">Place of Supply: {pos}</p>}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="px-8 py-5 border-b border-gray-300">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
          <p className="font-bold text-gray-900 text-[14px]">{invoice.customer.name}</p>
          {invoice.customer.address && <p className="text-[11px] text-gray-600">{invoice.customer.address}{invoice.customer.city ? `, ${invoice.customer.city}` : ""}{invoice.customer.state ? `, ${invoice.customer.state}` : ""}</p>}
          {invoice.customer.gstin && <p className="text-[11px] text-gray-600">GSTIN: <span className="font-semibold font-mono">{invoice.customer.gstin}</span></p>}
          {invoice.customer.gstin && invoice.customer.gstin.length >= 12 && <p className="text-[11px] text-gray-600">PAN: <span className="font-semibold font-mono">{invoice.customer.gstin.substring(2, 12)}</span></p>}
          {invoice.customer.phone && <p className="text-[11px] text-gray-500">Phone: {invoice.customer.phone}</p>}
          {invoice.customer.email && <p className="text-[11px] text-gray-500">Email: {invoice.customer.email}</p>}
        </div>

        {/* Items */}
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white text-[10px] uppercase tracking-wider">
              <th className="p-3 text-center w-[35px]">#</th>
              <th className="p-3 text-left">Description</th>
              {cv.hsn && <th className="p-3 text-center w-[70px]">HSN</th>}
              {cv.qty && <th className="p-3 text-center w-[60px]">Qty</th>}
              {cv.rate && <th className="p-3 text-right w-[80px]">Rate</th>}
              {cv.taxableAmount && <th className="p-3 text-right w-[80px]">Taxable</th>}
              {cv.gstRate && (!invoice.isInterState ? (
                <>
                  <th className="p-3 text-center w-[48px]">CGST%</th>
                  <th className="p-3 text-center w-[48px]">SGST%</th>
                </>
              ) : (
                <th className="p-3 text-center w-[48px]">IGST%</th>
              ))}
              <th className="p-3 text-right w-[80px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? "" : "bg-gray-50"}`}>
                <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                <td className="p-3 font-medium text-gray-800">{item.description}</td>
                {cv.hsn && <td className="p-3 text-center font-mono text-gray-500 text-[10px]">{item.hsn}</td>}
                {cv.qty && <td className="p-3 text-center text-gray-600">{item.qty}{cv.unit ? ` ${item.unit}` : ""}</td>}
                {cv.rate && <td className="p-3 text-right text-gray-600">{formatCurrency(item.rate)}</td>}
                {cv.taxableAmount && <td className="p-3 text-right text-gray-700">{formatCurrency(item.amount)}</td>}
                {cv.gstRate && (!invoice.isInterState ? (
                  <>
                    <td className="p-3 text-center text-gray-500">{item.gstRate / 2}%</td>
                    <td className="p-3 text-center text-gray-500">{item.gstRate / 2}%</td>
                  </>
                ) : (
                  <td className="p-3 text-center text-gray-500">{item.gstRate}%</td>
                ))}
                <td className="p-3 text-right font-semibold text-gray-900">{formatCurrency(item.amount + item.cgst + item.sgst + item.igst)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="px-8 py-4 border-t border-gray-300">
          <div className="flex justify-end">
            <div className="w-[280px] text-[12px]">
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {!invoice.isInterState ? (
                <>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">CGST</span>
                    <span>{formatCurrency(invoice.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">SGST</span>
                    <span>{formatCurrency(invoice.totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">IGST</span>
                  <span>{formatCurrency(invoice.totalIgst)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 mt-1 border-t-2 border-gray-900">
                <span className="font-bold text-[14px]">Total</span>
                <span className="font-bold text-[16px]">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-3 italic">{numberToWords(invoice.grandTotal)} Only</p>
        </div>

        {/* Bank + Terms + Signature */}
        <div className="grid grid-cols-3 border-t border-gray-300 text-[11px]">
          <div className="p-4 border-r border-gray-300">
            <p className="font-bold text-[10px] uppercase tracking-wider text-gray-400 mb-2">Bank Details</p>
            {(invoice.firm?.bankName || settings?.bankName) ? (
              <div className="text-[10px] text-gray-600 space-y-0.5">
                <p>Bank: {invoice.firm?.bankName || settings?.bankName}</p>
                <p>A/C: {invoice.firm?.accountNumber || settings?.accountNumber}</p>
                <p>IFSC: {invoice.firm?.ifscCode || settings?.ifscCode}</p>
              </div>
            ) : <p className="text-gray-400 italic text-[10px]">Not provided</p>}
          </div>
          <div className="p-4 border-r border-gray-300">
            <p className="font-bold text-[10px] uppercase tracking-wider text-gray-400 mb-2">Terms</p>
            <div className="text-[10px] text-gray-600 space-y-0.5">
              {invoice.terms ? invoice.terms.split("\n").map((l, i) => <p key={i}>{l}</p>) : (
                <>
                  <p>Goods once sold will not be taken back.</p>
                  <p>Payment within due date.</p>
                </>
              )}
            </div>
          </div>
          <div className="p-4">
            <SignatureBlock invoice={invoice} settings={settings} firmName={f.name} />
          </div>
        </div>

        <QRSection invoice={invoice} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TEMPLATE 3: CORPORATE (Slate blue formal)
// ════════════════════════════════════════════════════════════════
export function CorporateTemplate({ invoice, settings, currentUserId, cv }: InvoiceTemplateProps) {
  const f = firmData(invoice, settings);
  const pos = placeOfSupply(invoice);
  const hsn = hsnSummary(invoice);

  return (
    <div className="bg-white max-w-4xl mx-auto print:shadow-none print:p-0" style={{ fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif", fontSize: "12px" }}>
      {invoice.letterhead && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={invoice.letterhead} alt="" className="w-full h-full object-cover opacity-10" />
        </div>
      )}
      <div className="relative z-10 border border-slate-300 shadow-sm">
        {/* Header */}
        <div className="bg-slate-700 text-white px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {f.logo && (
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.logo} alt={f.name} className="w-full h-full object-contain p-1" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-wide uppercase">{f.name}</h1>
              {f.address && <p className="text-slate-300 text-[11px] mt-1">{f.address}{f.city ? `, ${f.city}` : ""}{f.state ? ` - ${f.state}` : ""}</p>}
              {f.gstin && <p className="text-slate-200 text-[11px]">GSTIN: {f.gstin} {f.pan ? `| PAN: ${f.pan}` : ""}</p>}
              {f.phone && <p className="text-slate-300 text-[11px]">{f.phone} {f.email ? `| ${f.email}` : ""}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-light uppercase tracking-[4px] text-slate-300">{INVOICE_TYPE_LABELS[invoice.invoiceType]}</p>
          </div>
        </div>

        {/* Invoice Meta + Bill To */}
        <div className="grid grid-cols-2 border-b border-slate-200">
          <div className="p-5 border-r border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Invoice Details</p>
            <table className="text-[11px]">
              <tbody>
                <tr><td className="pr-3 py-1 text-slate-500 font-medium">Invoice No.</td><td className="py-1 font-bold text-slate-900">{invoice.invoiceNumber}</td></tr>
                <tr><td className="pr-3 py-1 text-slate-500 font-medium">Date</td><td className="py-1 text-slate-700">{formatDate(invoice.date)}</td></tr>
                {invoice.dueDate && <tr><td className="pr-3 py-1 text-slate-500 font-medium">Due Date</td><td className="py-1 text-slate-700">{formatDate(invoice.dueDate)}</td></tr>}
                {pos && <tr><td className="pr-3 py-1 text-slate-500 font-medium">Place of Supply</td><td className="py-1 text-slate-700">{pos}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bill To</p>
            <p className="font-bold text-slate-900 text-[13px]">{invoice.customer.name}</p>
            {invoice.customer.address && <p className="text-[11px] text-slate-600 mt-0.5">{invoice.customer.address}{invoice.customer.city ? `, ${invoice.customer.city}` : ""}{invoice.customer.state ? `, ${invoice.customer.state}` : ""}</p>}
            {invoice.customer.gstin && <p className="text-[11px] text-slate-600">GSTIN: <span className="font-semibold font-mono">{invoice.customer.gstin}</span></p>}
            {invoice.customer.gstin && invoice.customer.gstin.length >= 12 && <p className="text-[11px] text-slate-600">PAN: <span className="font-semibold font-mono">{invoice.customer.gstin.substring(2, 12)}</span></p>}
            {invoice.customer.phone && <p className="text-[11px] text-slate-500">Phone: {invoice.customer.phone}</p>}
            {invoice.customer.email && <p className="text-[11px] text-slate-500">Email: {invoice.customer.email}</p>}
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider border-b border-slate-300">
              <th className="p-2.5 text-center w-[35px] border-r border-slate-200">#</th>
              <th className="p-2.5 text-left border-r border-slate-200">Item Description</th>
              {cv.hsn && <th className="p-2.5 text-center w-[70px] border-r border-slate-200">HSN/SAC</th>}
              {cv.qty && <th className="p-2.5 text-center w-[55px] border-r border-slate-200">Qty</th>}
              {cv.rate && <th className="p-2.5 text-right w-[75px] border-r border-slate-200">Rate</th>}
              {cv.taxableAmount && <th className="p-2.5 text-right w-[80px] border-r border-slate-200">Taxable</th>}
              {cv.gstRate && (!invoice.isInterState ? (
                <>
                  <th className="p-2.5 text-center w-[50px] border-r border-slate-200">CGST</th>
                  <th className="p-2.5 text-center w-[50px] border-r border-slate-200">SGST</th>
                </>
              ) : (
                <th className="p-2.5 text-center w-[50px] border-r border-slate-200">IGST</th>
              ))}
              <th className="p-2.5 text-right w-[90px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const itemTax = item.cgst + item.sgst + item.igst;
              return (
                <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                  <td className="p-2.5 text-center border-r border-slate-100 text-slate-500">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100 font-medium text-slate-800">{item.description}</td>
                  {cv.hsn && <td className="p-2.5 text-center border-r border-slate-100 font-mono text-[10px] text-slate-500">{item.hsn}</td>}
                  {cv.qty && <td className="p-2.5 text-center border-r border-slate-100 text-slate-600">{item.qty}{cv.unit ? ` ${item.unit}` : ""}</td>}
                  {cv.rate && <td className="p-2.5 text-right border-r border-slate-100 text-slate-600">{formatCurrency(item.rate)}</td>}
                  {cv.taxableAmount && <td className="p-2.5 text-right border-r border-slate-100 text-slate-700">{formatCurrency(item.amount)}</td>}
                  {cv.gstRate && (!invoice.isInterState ? (
                    <>
                      <td className="p-2.5 text-center border-r border-slate-100 text-slate-500 text-[10px]">{formatCurrency(item.cgst)}</td>
                      <td className="p-2.5 text-center border-r border-slate-100 text-slate-500 text-[10px]">{formatCurrency(item.sgst)}</td>
                    </>
                  ) : (
                    <td className="p-2.5 text-center border-r border-slate-100 text-slate-500 text-[10px]">{formatCurrency(item.igst)}</td>
                  ))}
                  <td className="p-2.5 text-right font-semibold text-slate-900">{formatCurrency(item.amount + itemTax)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-slate-300 px-6 py-3">
          <div className="flex justify-end">
            <div className="w-[300px] text-[12px]">
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Subtotal</span><span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {!invoice.isInterState ? (
                <>
                  <div className="flex justify-between py-1 text-slate-600"><span>CGST</span><span>{formatCurrency(invoice.totalCgst)}</span></div>
                  <div className="flex justify-between py-1 text-slate-600"><span>SGST</span><span>{formatCurrency(invoice.totalSgst)}</span></div>
                </>
              ) : (
                <div className="flex justify-between py-1 text-slate-600"><span>IGST</span><span>{formatCurrency(invoice.totalIgst)}</span></div>
              )}
              <div className="flex justify-between py-2.5 mt-1 border-t-2 border-slate-700 bg-slate-700 text-white px-3 -mx-3 rounded">
                <span className="font-bold text-[13px]">Grand Total</span>
                <span className="font-bold text-[16px]">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 italic">{numberToWords(invoice.grandTotal)} Only</p>
        </div>

        {/* HSN Summary */}
        <div className="border-t border-slate-200 px-6 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">HSN/SAC Summary</p>
          <table className="w-full text-[10px] border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-100 font-semibold text-slate-600">
                <th className="p-1.5 border border-slate-200 text-left">HSN/SAC</th>
                <th className="p-1.5 border border-slate-200 text-right">Taxable Value</th>
                {!invoice.isInterState ? (
                  <>
                    <th className="p-1.5 border border-slate-200 text-right">CGST</th>
                    <th className="p-1.5 border border-slate-200 text-right">SGST</th>
                  </>
                ) : (
                  <th className="p-1.5 border border-slate-200 text-right">IGST</th>
                )}
                <th className="p-1.5 border border-slate-200 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {hsn.map((row, i) => (
                <tr key={i}>
                  <td className="p-1.5 border border-slate-200 font-mono">{row.hsn}</td>
                  <td className="p-1.5 border border-slate-200 text-right">{formatCurrency(row.taxableValue)}</td>
                  {!invoice.isInterState ? (
                    <>
                      <td className="p-1.5 border border-slate-200 text-right">{formatCurrency(row.cgst)}</td>
                      <td className="p-1.5 border border-slate-200 text-right">{formatCurrency(row.sgst)}</td>
                    </>
                  ) : (
                    <td className="p-1.5 border border-slate-200 text-right">{formatCurrency(row.igst)}</td>
                  )}
                  <td className="p-1.5 border border-slate-200 text-right font-semibold">{formatCurrency(row.totalTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bank + Terms + Signature */}
        <div className="grid grid-cols-3 border-t border-slate-300 text-[11px]">
          <div className="p-4 border-r border-slate-200">
            <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2">Bank Details</p>
            {(invoice.firm?.bankName || settings?.bankName) ? (
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <p>{invoice.firm?.bankName || settings?.bankName}</p>
                <p>A/C: {invoice.firm?.accountNumber || settings?.accountNumber}</p>
                <p>IFSC: {invoice.firm?.ifscCode || settings?.ifscCode}</p>
              </div>
            ) : <p className="text-slate-400 italic text-[10px]">Not provided</p>}
          </div>
          <div className="p-4 border-r border-slate-200">
            <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2">Terms & Conditions</p>
            <div className="text-[10px] text-slate-600 space-y-0.5">
              {invoice.terms ? invoice.terms.split("\n").map((l, i) => <p key={i}>{l}</p>) : (
                <>
                  <p>Goods once sold will not be taken back.</p>
                  <p>Payment within due date.</p>
                  <p>Interest @ 18% p.a. on overdue.</p>
                </>
              )}
            </div>
          </div>
          <div className="p-4 text-center">
            <SignatureBlock invoice={invoice} settings={settings} firmName={f.name} />
          </div>
        </div>

        <QRSection invoice={invoice} currentUserId={currentUserId} />

        <div className="text-center py-2 text-[10px] border-t border-slate-300 bg-slate-700 text-slate-300 font-medium">
          Computer Generated Invoice &bull; E. &amp; O.E.
        </div>
      </div>
    </div>
  );
}
