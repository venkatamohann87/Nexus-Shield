"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  ["/dashboard", "◈", "Dashboard"], ["/identity", "◉", "Human Verification"], ["/ai-security", "◇", "Security Runtime"], ["/attacks", "⚠", "Security Validation"], ["/tools", "⌘", "Tool Permissions"], ["/events", "≡", "Security Events"], ["/settings", "⚙", "Settings"]
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  async function logout(): Promise<void> { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }
  return <div className="app-shell"><aside className="sidebar"><Link href="/" className="brand"><span className="brand-mark">H</span>HumanShield <small style={{ color: "var(--cyan)" }}>AI</small></Link><nav><p className="nav-label">SECURITY CONSOLE</p>{items.map(([href, icon, label]) => <Link key={href} href={href} className={`nav-item ${pathname === href ? "active" : ""}`}><span className="nav-icon">{icon}</span>{label}</Link>)}<p className="nav-label">DEVELOPER</p><Link href="/api-docs" className={`nav-item ${pathname === "/api-docs" ? "active" : ""}`}><span className="nav-icon">&lt;/&gt;</span>API Documentation</Link></nav><div className="sidebar-footer"><button className="btn btn-ghost" style={{ width: "100%" }} onClick={logout}>Sign out</button></div></aside><main className="main"><header className="topbar"><span className="topbar-title"><span className="status-dot" />Security runtime online</span><span className="demo-pill">LOCAL SECURITY RUNTIME</span></header>{children}</main></div>;
}
