import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/supabase";

const schema = z.object({
  id: z.string().uuid(),
  actor: z.string().min(1).max(80),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, actor } = parsed.data;

  const { data: current } = await db
    .from("invites")
    .select("id, claimed_by, status")
    .eq("id", id)
    .maybeSingle();

  if (!current) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (current.status !== "claimed") return NextResponse.json({ error: "Invite not claimed" }, { status: 409 });
  if (current.claimed_by !== actor) return NextResponse.json({ error: "Only claimer can mark used" }, { status: 403 });

  const { data, error } = await db
    .from("invites")
    .update({ status: "used", used_at: new Date().toISOString(), expires_at: null })
    .eq("id", id)
    .eq("status", "claimed")
    .eq("claimed_by", actor)
    .select("id, code, status, used_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Concurrent update conflict" }, { status: 409 });

  await db.from("audit_logs").insert({ invite_id: id, actor, action: "use" });

  return NextResponse.json({ ok: true, invite: data });
}
