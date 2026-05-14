import { kv } from "@/lib/kv";
import { getSession } from "@/lib/session";
import type { User, InventoryItem } from "@/lib/gst-types";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users: User[] = (await kv.get("gst_users")) || [];
  const allItems: (InventoryItem & { clientName: string; clientEmail: string })[] = [];

  for (const user of users) {
    const items: InventoryItem[] = (await kv.get(`gst_inventory:${user.id}`)) || [];
    for (const item of items) {
      allItems.push({ ...item, clientName: user.name, clientEmail: user.email });
    }
  }

  const lowStock = allItems.filter((i) => i.currentStock <= i.lowStockAlert);
  return Response.json({ data: { items: allItems, lowStock } });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, userId } = body;
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  const key = `gst_inventory:${userId}`;
  const items: InventoryItem[] = (await kv.get(key)) || [];

  if (action === "delete_item") {
    await kv.set(key, items.filter((i) => i.id !== body.id));
    return Response.json({ success: true });
  }

  if (action === "upsert_item") {
    const idx = items.findIndex((i) => i.id === body.item.id);
    const now = new Date().toISOString();
    if (idx >= 0) items[idx] = { ...items[idx], ...body.item, lastUpdated: now };
    else items.push({ ...body.item, userId, lastUpdated: now });
    await kv.set(key, items);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
