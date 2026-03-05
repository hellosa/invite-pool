"use client";

import { useEffect, useMemo, useState } from "react";

type Invite = {
  id: string;
  code: string;
  note: string | null;
  status: "available" | "claimed" | "used" | "expired";
  claimed_by: string | null;
  claimed_at: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export default function Home() {
  const [actor, setActor] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const mine = useMemo(() => invites.filter((x) => x.claimed_by === actor && x.status === "claimed"), [invites, actor]);

  async function refresh() {
    const res = await fetch("/api/invites", { cache: "no-store" });
    const json = await res.json();
    setInvites(json.invites ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/invites", { cache: "no-store" });
      const json = await res.json();
      if (!cancelled) setInvites(json.invites ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function post(path: string, id: string) {
    if (!actor) {
      alert("先输入你的名字/昵称");
      return;
    }
    setBusyId(id);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actor }),
    });
    const json = await res.json();
    if (!res.ok) alert(json.error ?? "操作失败");
    await refresh();
    setBusyId(null);
  }

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", fontFamily: "system-ui, sans-serif", padding: "0 16px" }}>
      <h1>Invite Pool</h1>
      <p>像 todo 一样分发邀请码：领取（claim）→ 使用（used）→ 释放（release）。</p>

      <div style={{ margin: "16px 0 24px" }}>
        <label>
          你的名字：
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="chong"
            style={{ marginLeft: 8, padding: "6px 8px", minWidth: 220 }}
          />
        </label>
        <button style={{ marginLeft: 8 }} onClick={refresh}>刷新</button>
      </div>

      <h3>我领取的</h3>
      {mine.length === 0 ? <p>暂无</p> : (
        <ul>
          {mine.map((x) => (
            <li key={x.id}>
              <code>{x.code}</code>
              <button style={{ marginLeft: 8 }} disabled={busyId === x.id} onClick={() => post("/api/use", x.id)}>标记已用</button>
              <button style={{ marginLeft: 8 }} disabled={busyId === x.id} onClick={() => post("/api/release", x.id)}>释放</button>
            </li>
          ))}
        </ul>
      )}

      <h3>邀请码列表</h3>
      {invites.length === 0 ? <p>暂无数据（先在 Supabase 运行 schema.sql）</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Code</th>
              <th align="left">Note</th>
              <th align="left">Status</th>
              <th align="left">Claimed By</th>
              <th align="left">Action</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((x) => (
              <tr key={x.id} style={{ borderTop: "1px solid #ddd" }}>
                <td><code>{x.code}</code></td>
                <td>{x.note ?? "-"}</td>
                <td>{x.status}</td>
                <td>{x.claimed_by ?? "-"}</td>
                <td>
                  {x.status === "available" ? (
                    <button disabled={busyId === x.id} onClick={() => post("/api/claim", x.id)}>领取</button>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
