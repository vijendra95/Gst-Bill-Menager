"use client";

import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/gst-utils";

interface GstrData {
  month: string;
  totalInvoices: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalValue: number;
  creditNotes: { count: number; tax: number };
  debitNotes: { count: number; tax: number };
  netTax: number;
  byClient: { name: string; invoices: number; taxable: number; tax: number; total: number }[];
}

export default function AdminGstrReportsPage() {
  const [data, setData] = useState<GstrData | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);

  const didFetch = useRef(false);
  const load = (m: string) => {
    setLoading(true);
    fetch(`/api/admin/gstr-reports?month=${m}`).then((r) => r.json())
      .then((res) => setData(res.data || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (didFetch.current) return; didFetch.current = true; load(month); }, []);

  const handleMonthChange = (m: string) => { setMonth(m); load(m); };

  const exportCSV = () => {
    if (!data) return;
    let csv = "Client,Invoices,Taxable,Tax,Total\n";
    data.byClient.forEach((c) => { csv += `"${c.name}",${c.invoices},${c.taxable},${c.tax},${c.total}\n`; });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gstr_admin_${month}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">GSTR Reports (All Clients)</h1>
        <div className="flex gap-2 items-center">
          <input type="month" value={month} onChange={(e) => handleMonthChange(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold">{data.totalInvoices}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Taxable Value</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalTaxable)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Total Tax</p>
              <p className="text-2xl font-bold text-violet-600">{formatCurrency(data.totalCgst + data.totalSgst + data.totalIgst)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Net Tax Payable</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.netTax)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
              <p className="text-sm text-blue-700 font-medium">CGST</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(data.totalCgst)}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
              <p className="text-sm text-green-700 font-medium">SGST</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(data.totalSgst)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 text-center">
              <p className="text-sm text-purple-700 font-medium">IGST</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(data.totalIgst)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <p className="text-sm font-medium text-red-700">Credit Notes</p>
              <p className="text-lg font-bold text-red-600">{data.creditNotes.count} ({formatCurrency(data.creditNotes.tax)} tax)</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm font-medium text-amber-700">Debit Notes</p>
              <p className="text-lg font-bold text-amber-600">{data.debitNotes.count} ({formatCurrency(data.debitNotes.tax)} tax)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b"><h2 className="font-semibold">Revenue by Client</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-right p-3 font-medium">Invoices</th>
                    <th className="text-right p-3 font-medium">Taxable</th>
                    <th className="text-right p-3 font-medium">Tax</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byClient.map((c, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-right">{c.invoices}</td>
                      <td className="p-3 text-right">{formatCurrency(c.taxable)}</td>
                      <td className="p-3 text-right text-violet-600">{formatCurrency(c.tax)}</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(c.total)}</td>
                    </tr>
                  ))}
                  {data.byClient.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No data for this month</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center py-12">No data</p>
      )}
    </div>
  );
}
