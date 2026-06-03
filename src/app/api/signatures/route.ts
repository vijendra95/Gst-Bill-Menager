import { kv } from "@/lib/kv";
import { getSession } from "@/lib/session";
import type { Signature } from "@/lib/gst-types";
import { generateId } from "@/lib/gst-utils";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const firmId = searchParams.get("firmId");

  const sigs: Signature[] = (await kv.get(`signatures_${session.id}`)) || [];
  const filtered = firmId ? sigs.filter((s) => s.firmId === firmId) : sigs;
  return Response.json({ data: filtered });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body;
    const sigs: Signature[] = (await kv.get(`signatures_${session.id}`)) || [];

    if (action === "create") {
      if (!body.firmId || !body.directorName || !body.imageData) {
        return Response.json({ error: "Firm, director name, and signature image required" }, { status: 400 });
      }
      const sig: Signature = {
        id: generateId(),
        userId: session.id,
        firmId: body.firmId,
        directorName: body.directorName,
        imageData: body.imageData,
        createdAt: new Date().toISOString(),
      };
      sigs.push(sig);
      await kv.set(`signatures_${session.id}`, sigs);
      return Response.json({ success: true, data: sig });
    }

    if (action === "update") {
      const idx = sigs.findIndex((s) => s.id === body.id);
      if (idx === -1) return Response.json({ error: "Signature not found" }, { status: 404 });
      if (body.directorName) sigs[idx].directorName = body.directorName;
      if (body.imageData) sigs[idx].imageData = body.imageData;
      await kv.set(`signatures_${session.id}`, sigs);
      return Response.json({ success: true, data: sigs[idx] });
    }

    if (action === "delete") {
      const filtered = sigs.filter((s) => s.id !== body.id);
      await kv.set(`signatures_${session.id}`, filtered);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
