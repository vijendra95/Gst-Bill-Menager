import { kv } from "@/lib/kv";
import { getSession } from "@/lib/session";
import type { User, EWayBill } from "@/lib/gst-types";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users: User[] = (await kv.get("gst_users")) || [];
  const allBills: (EWayBill & { clientName: string; clientEmail: string })[] = [];

  for (const user of users) {
    const bills: EWayBill[] = (await kv.get(`gst_eway_bills:${user.id}`)) || [];
    for (const bill of bills) {
      allBills.push({ ...bill, clientName: user.name, clientEmail: user.email });
    }
  }

  allBills.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json({ data: allBills });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, userId } = body;
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  const key = `gst_eway_bills:${userId}`;
  const bills: EWayBill[] = (await kv.get(key)) || [];

  if (action === "cancel") {
    const idx = bills.findIndex((b) => b.id === body.id);
    if (idx >= 0) { bills[idx].status = "cancelled"; await kv.set(key, bills); }
    return Response.json({ success: true });
  }

  if (action === "delete") {
    await kv.set(key, bills.filter((b) => b.id !== body.id));
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
