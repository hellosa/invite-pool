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

const STATUS_LABEL: Record<Invite["status"], string> = {
  available: "可领取",
  claimed: "已领取",
  used: "已使用",
  expired: "已过期",
};

export default function Home() {
  const [actor, setActor] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const mine = useMemo(
    () => invites.filter((x) => x.claimed_by === actor && x.status === "claimed"),
    [invites, actor],
  );

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
    <main className="page">
      <section className="hero">
        <div>
          <h1>Invite Pool</h1>
          <p>像 Todo 一样发邀请码：领取 → 使用 → 释放。</p>
        </div>
        <button className="btn ghost" onClick={refresh}>刷新</button>
      </section>

      <section className="card">
        <label className="label" htmlFor="actor">你的名字</label>
        <div className="row">
          <input
            id="actor"
            className="input"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="例如：chong"
          />
        </div>
      </section>

      <section className="card">
        <h2>我领取的</h2>
        {mine.length === 0 ? (
          <p className="muted">你还没有已领取的邀请码。</p>
        ) : (
          <div className="list">
            {mine.map((x) => (
              <div className="item" key={x.id}>
                <div className="left">
                  <code>{x.code}</code>
                  <span className={`tag ${x.status}`}>{STATUS_LABEL[x.status]}</span>
                </div>
                <div className="actions">
                  <button className="btn primary" disabled={busyId === x.id} onClick={() => post("/api/use", x.id)}>
                    标记已用
                  </button>
                  <button className="btn" disabled={busyId === x.id} onClick={() => post("/api/release", x.id)}>
                    释放
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>邀请码池</h2>
        {invites.length === 0 ? (
          <p className="muted">暂无数据。先在 Supabase 执行 schema.sql。</p>
        ) : (
          <div className="list">
            {invites.map((x) => (
              <div className="item" key={x.id}>
                <div className="left">
                  <code>{x.code}</code>
                  <span className={`tag ${x.status}`}>{STATUS_LABEL[x.status]}</span>
                  {x.note ? <span className="note">{x.note}</span> : null}
                  {x.claimed_by ? <span className="muted">by {x.claimed_by}</span> : null}
                </div>
                <div className="actions">
                  {x.status === "available" ? (
                    <button className="btn success" disabled={busyId === x.id} onClick={() => post("/api/claim", x.id)}>
                      领取
                    </button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
