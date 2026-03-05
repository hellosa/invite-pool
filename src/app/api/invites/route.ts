import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await db
    .from("invites")
    .select("id, code, note, status, claimed_by, claimed_at, used_at, expires_at, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: data ?? [] });
}
