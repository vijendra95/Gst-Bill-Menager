import { kv } from "@/lib/kv";
import { getSession } from "@/lib/session";
import type { Product } from "@/lib/gst-types";
import { generateId } from "@/lib/gst-utils";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const adminUserId = searchParams.get("adminUserId");
  const lookupUserId = (adminUserId && session.role === "admin") ? adminUserId : session.id;

  const key = `gst_products:${lookupUserId}`;
  const products: Product[] = (await kv.get(key)) || [];
  return Response.json({ data: products });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body;
    const key = `gst_products:${session.id}`;
    const products: Product[] = (await kv.get(key)) || [];

    if (action === "create") {
      const product: Product = {
        id: generateId(),
        userId: session.id,
        name: body.name,
        hsn: body.hsn || "",
        unit: body.unit || "PCS",
        rate: body.rate || 0,
        gstRate: body.gstRate ?? 18,
        type: body.type || "goods",
        description: body.description || "",
      };
      products.push(product);
      await kv.set(key, products);
      return Response.json({ success: true, data: product });
    }

    if (action === "update") {
      const idx = products.findIndex((p) => p.id === body.id);
      if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });
      products[idx] = { ...products[idx], ...body, id: products[idx].id, userId: session.id };
      await kv.set(key, products);
      return Response.json({ success: true, data: products[idx] });
    }

    if (action === "delete") {
      const filtered = products.filter((p) => p.id !== body.id);
      await kv.set(key, filtered);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
