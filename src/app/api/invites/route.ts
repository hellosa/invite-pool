import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";

function maskName(name: string) {
  const n = name.trim();
  if (n.length <= 1) return "*";
  if (n.length === 2) return `${n[0]}*`;
  return `${n[0]}${"*".repeat(Math.min(4, n.length - 2))}${n[n.length - 1]}`;
}

export async function GET(req: Request) {
  const actor = new URL(req.url).searchParams.get("actor")?.trim() ?? "";

  const db = getDb();
  const { data, error } = await db
    .from("invites")
    .select("id, code, note, status, claimed_by, claimed_at, used_at, expires_at, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const invites = (data ?? []).map((x) => ({
    ...x,
    claimed_by_self: !!actor && x.claimed_by === actor,
    claimed_by: x.claimed_by ? maskName(x.claimed_by) : null,
  }));

  return NextResponse.json({ invites });
}
