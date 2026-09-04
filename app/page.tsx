import Link from "next/link";

const features = [
  ["◉", "Proof of human", "Domain-scoped, privacy-minimizing credential proofs. No biometrics or global identity graph."],
  ["◇", "Context firewall", "Treat retrieval, webpages, tool output, and instructions according to source authority."],
  ["⌘", "Tool authorization", "Every sensitive action is independently evaluated, constrained, audited, and escalated when needed."],
  ["⚡", "Risk intelligence", "Combine deterministic signals, provenance, behavioral heuristics, and a model-ready analyzer interface."],
  ["≡", "Audit-ready events", "Redacted, hashed events expose security decisions without retaining full sensitive prompts."],
  ["◌", "Local Phi gateway", "Every local Phi prompt first passes through the HumanShield gateway."],
];

export default function LandingPage() {
  return <main className="landing">
    <nav className="landing-nav"><Link href="/" className="brand"><span className="brand-mark">H</span>HumanShield <small style={{ color: "var(--cyan)" }}>AI</small></Link><div className="button-row"><Link href="/login" className="btn btn-ghost">Sign in</Link><Link href="/register" className="btn">Launch Security Console</Link></div></nav>
    <section className="hero"><span className="demo-pill">LOCAL SECURITY RUNTIME</span><h1>Trust Infrastructure<br /><span style={{ color: "var(--cyan)" }}>for the AI Internet</span></h1><p>Validate prompts before they reach your local model, then record each security decision in a live audit stream.</p><div className="button-row"><Link href="/register" className="btn btn-primary">Launch Security Console →</Link><a href="http://localhost:3001" className="btn btn-ghost">Open Protected Phi Chat</a></div><div className="architecture"><span className="arch-node">USER</span><span className="arch-arrow">→</span><span className="arch-node">SECURITY GATEWAY</span><span className="arch-arrow">→</span><span className="arch-node">CONTEXT FIREWALL</span><span className="arch-arrow">→</span><span className="arch-node">RISK ENGINE</span><span className="arch-arrow">→</span><span className="arch-node">LOCAL PHI</span></div></section>
    <section className="hero-grid"><div className="page-head"><div><p className="eyebrow">VERIFY → UNDERSTAND → AUTHORIZE → ACT</p><h1>Built for security-conscious AI teams</h1><p className="muted">HumanShield prevents untrusted context from becoming authority. It is designed as a local security control plane, not a promise of perfect detection.</p></div></div><div className="grid grid-3">{features.map(([icon, title, text]) => <article className="card" key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p className="muted">{text}</p></article>)}</div><div className="card" style={{ marginTop: 18 }}><p className="eyebrow">SECURITY SCOPE</p><p className="muted">The Phi gateway and audit stream run locally. Production cryptographic identity mechanisms and external tool connections require independent security audits, formal threat modeling, and trusted credential issuance.</p></div></section>
  </main>;
}
