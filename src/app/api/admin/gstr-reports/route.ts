import { kv } from "@/lib/kv";
import { getSession } from "@/lib/session";
import type { User, Invoice } from "@/lib/gst-types";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || new Date().toISOString().substring(0, 7);

  const users: User[] = (await kv.get("gst_users")) || [];
  const allInvoices: (Invoice & { clientName: string })[] = [];

  for (const user of users) {
    const invoices: Invoice[] = (await kv.get(`gst_invoices:${user.id}`)) || [];
    for (const inv of invoices) {
      allInvoices.push({ ...inv, clientName: user.name });
    }
  }

  const monthInvoices = allInvoices.filter((inv) => inv.date.startsWith(month));
  const taxInvoices = monthInvoices.filter((inv) => inv.invoiceType === "tax_invoice");

  const totalTaxable = taxInvoices.reduce((s, i) => s + i.subtotal, 0);
  const totalCgst = taxInvoices.reduce((s, i) => s + i.totalCgst, 0);
  const totalSgst = taxInvoices.reduce((s, i) => s + i.totalSgst, 0);
  const totalIgst = taxInvoices.reduce((s, i) => s + i.totalIgst, 0);
  const totalValue = taxInvoices.reduce((s, i) => s + i.grandTotal, 0);

  const creditNotes = monthInvoices.filter((inv) => inv.invoiceType === "credit_note");
  const debitNotes = monthInvoices.filter((inv) => inv.invoiceType === "debit_note");

  const cnTax = creditNotes.reduce((s, i) => s + i.totalCgst + i.totalSgst + i.totalIgst, 0);
  const dnTax = debitNotes.reduce((s, i) => s + i.totalCgst + i.totalSgst + i.totalIgst, 0);

  const byClient = new Map<string, { name: string; invoices: number; taxable: number; tax: number; total: number }>();
  taxInvoices.forEach((inv) => {
    const e = byClient.get(inv.clientName) || { name: inv.clientName, invoices: 0, taxable: 0, tax: 0, total: 0 };
    e.invoices++;
    e.taxable += inv.subtotal;
    e.tax += inv.totalTax;
    e.total += inv.grandTotal;
    byClient.set(inv.clientName, e);
  });

  return Response.json({
    data: {
      month,
      totalInvoices: taxInvoices.length,
      totalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      totalValue,
      creditNotes: { count: creditNotes.length, tax: cnTax },
      debitNotes: { count: debitNotes.length, tax: dnTax },
      netTax: totalCgst + totalSgst + totalIgst - cnTax + dnTax,
      byClient: Array.from(byClient.values()).sort((a, b) => b.total - a.total),
    },
  });
}
