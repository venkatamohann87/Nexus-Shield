"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/badge";
import { fetchJson } from "@/lib/client";
import type { SecurityApproval, SecurityEvent } from "@/lib/types";

interface Stats {
  source: "live-runtime";
  metrics: { verifiedHumans: number; blockedAttacks: number; allowedRequests: number; highRiskRequests: number; blockedToolCalls: number; pendingApprovals: number; activeAgents: number; securityEvents: number };
  categories: Record<string, number>;
  riskDistribution: Record<string, number>;
  events: SecurityEvent[];
  approvals: SecurityApproval[];
}

export default function DashboardPage() {
  const [data, setData] = useState<Stats>();
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date>();

  useEffect(() => {
    let active = true;
    const load = (): void => { fetchJson<Stats>("/api/security/stats").then((next) => { if (active) { setData(next); setUpdatedAt(new Date()); setError(""); } }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load dashboard"); }); };
    load(); const timer = window.setInterval(load, 3_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const metrics = data?.metrics;
  const cards = [
    ["Verified humans", metrics?.verifiedHumans ?? 0, "issued local credentials"],
    ["Blocked attacks", metrics?.blockedAttacks ?? 0, "runtime decisions"],
    ["High-risk requests", metrics?.highRiskRequests ?? 0, "need investigation"],
    ["Pending approvals", metrics?.pendingApprovals ?? 0, "protected actions"],
  ];
  const activity = [...(data?.events ?? [])].reverse();

  return <section className="page">
    <div className="page-head"><div><p className="eyebrow">COMMAND CENTER</p><h1>Security dashboard</h1><p className="muted">Live events created by requests processed through this security runtime. No seeded telemetry is displayed.</p></div><span className="demo-pill">LIVE · {updatedAt ? updatedAt.toLocaleTimeString() : "CONNECTING"}</span></div>
    {error && <p className="notice danger">{error}</p>}
    <div className="grid grid-4">{cards.map(([label, value, detail]) => <article className="card metric" key={label}><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-trend">● {detail}</span></article>)}</div>
    <div className="grid grid-2" style={{ marginTop: 16 }}>
      <article className="card"><div style={{ display: "flex", justifyContent: "space-between" }}><div><p className="eyebrow">RECENT RISK ACTIVITY</p><h3>Recorded risk scores</h3></div><Badge value="LIVE" /></div>{activity.length ? <><div className="chart">{activity.map((event) => <span className="bar" style={{ height: `${Math.max(8, event.riskScore)}%` }} title={`${event.riskScore}/100 · ${event.decision}`} key={event.id} />)}</div><div className="legend"><span><i />Each bar is one recorded security event</span></div></> : <p className="empty">No security activity yet. Send a message from the local Phi chat to create a real gateway event.</p>}</article>
      <article className="card"><p className="eyebrow">RISK DISTRIBUTION</p><h3>Evaluated contexts</h3>{Object.entries(data?.riskDistribution ?? {}).map(([level, count]) => <div className="monitor-row" key={level}><span style={{ textTransform: "capitalize" }}>{level}</span><span><Badge value={level.toUpperCase()} /> <strong style={{ marginLeft: 9 }}>{count}</strong></span></div>)}{!data && <p className="empty">Loading telemetry…</p>}</article>
    </div>
    <div className="grid grid-2" style={{ marginTop: 16 }}>
      <article className="card"><p className="eyebrow">RECENT SECURITY EVENTS</p><h3>Decision stream</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>TYPE</th><th>RISK</th><th>DECISION</th><th>TIME</th></tr></thead><tbody>{(data?.events ?? []).map((event) => <tr key={event.id}><td>{event.eventType === "LLM_GATEWAY" ? "Prompt security check" : "Security event"}</td><td><Badge value={event.severity} /> {event.riskScore}</td><td><Badge value={event.decision} /></td><td>{new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td></tr>)}</tbody></table></div>{data && !data.events.length && <p className="empty">No live events yet.</p>}</article>
      <article className="card"><p className="eyebrow">PENDING HUMAN REVIEW</p><h3>Protected action queue</h3>{data?.approvals.length ? data.approvals.map((approval) => <div className="monitor-row" key={approval.id}><span><strong>{approval.toolName}</strong><small style={{ display: "block", color: "var(--muted)", marginTop: 3 }}>{approval.reason}</small></span><Badge value="APPROVAL" /></div>) : <p className="empty">No actions await review.</p>}</article>
    </div>
  </section>;
}
