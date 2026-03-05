import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CLAIM_TTL_MINUTES, db } from "@/lib/supabase";

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
  const expiresAt = new Date(Date.now() + CLAIM_TTL_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("invites")
    .update({
      status: "claimed",
      claimed_by: actor,
      claimed_at: new Date().toISOString(),
      expires_at: expiresAt,
    })
    .eq("id", id)
    .eq("status", "available")
    .select("id, code, status, claimed_by, expires_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Invite not available" }, { status: 409 });

  await db.from("audit_logs").insert({ invite_id: id, actor, action: "claim" });

  return NextResponse.json({ ok: true, invite: data });
}
