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

  const { data, error } = await db
    .from("invites")
    .update({ status: "available", claimed_by: null, claimed_at: null, expires_at: null })
    .eq("id", id)
    .eq("status", "claimed")
    .eq("claimed_by", actor)
    .select("id, code, status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Only claimer can release claimed invite" }, { status: 409 });

  await db.from("audit_logs").insert({ invite_id: id, actor, action: "release" });

  return NextResponse.json({ ok: true, invite: data });
}
