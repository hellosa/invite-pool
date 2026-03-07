"use client";

import { useEffect, useMemo, useState } from "react";

type Invite = {
  id: string;
  code: string;
  note: string | null;
  status: "available" | "claimed" | "used" | "expired";
  claimed_by: string | null;
  claimed_by_self?: boolean;
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

function maskCode(code: string) {
  if (code.length <= 2) return "••••••";
  return `${"•".repeat(Math.max(4, code.length - 2))}${code.slice(-2)}`;
}

export default function Home() {
  const [actor, setActor] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const mine = useMemo(
    () => invites.filter((x) => x.claimed_by_self && x.status === "claimed"),
    [invites],
  );

  async function refresh() {
    const q = actor ? `?actor=${encodeURIComponent(actor)}` : "";
    const res = await fetch(`/api/invites${q}`, { cache: "no-store" });
    const json = await res.json();
    setInvites(json.invites ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = actor ? `?actor=${encodeURIComponent(actor)}` : "";
      const res = await fetch(`/api/invites${q}`, { cache: "no-store" });
      const json = await res.json();
      if (!cancelled) setInvites(json.invites ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [actor]);

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
          <p>邀请码默认隐藏：先领取，再查看完整邀请码。</p>
        </div>
        <button className="btn ghost" onClick={refresh}>刷新</button>
      </section>

      <section className="card">
        <h2>使用说明</h2>
        <div className="list muted">
          <p>1) 输入你的名字（用于标记领取人）</p>
          <p>2) 在邀请码池里点击「领取」</p>
          <p>3) 到「我领取的」复制完整邀请码</p>
          <p>4) 用完后点「标记已用」；不需要了点「释放」</p>
        </div>
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
        <h2>我领取的（显示完整邀请码）</h2>
        {mine.length === 0 ? (
          <p className="muted">你还没有已领取的邀请码。</p>
        ) : (
          <div className="list">
            {mine.map((x) => (
              <div className="item" key={x.id}>
                <div className="left">
                  <code>{x.code}</code>
                  <span className={`tag ${x.status}`}>{STATUS_LABEL[x.status]}</span>
                  {x.note ? <span className="note">#{x.note}</span> : null}
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
        <h2>邀请码池（隐藏显示）</h2>
        {invites.length === 0 ? (
          <p className="muted">暂无数据。先在 Supabase 执行 schema.sql。</p>
        ) : (
          <div className="list">
            {invites.map((x) => {
              const isOwner = !!x.claimed_by_self;
              const visibleCode = isOwner && x.status === "claimed" ? x.code : maskCode(x.code);

              return (
                <div className="item" key={x.id}>
                  <div className="left">
                    <code>{visibleCode}</code>
                    <span className={`tag ${x.status}`}>{STATUS_LABEL[x.status]}</span>
                    {x.note ? <span className="note">#{x.note}</span> : null}
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
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
