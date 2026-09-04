const endpoints = [
  ["POST", "/api/identity/credential", "Create a minimal local credential commitment."], ["POST", "/api/identity/prove", "Generate a domain-scoped demo proof for a verified credential."], ["POST", "/api/identity/verify", "Validate the shape/status of a demo proof."], ["POST", "/api/security/analyze", "Assess request and context provenance; record a minimized event."], ["POST", "/api/security/classify", "Alias of the security analysis endpoint."], ["POST", "/api/security/tool-request", "Authorize a proposed protected tool action."], ["GET", "/api/security/events", "List event metadata with severity/decision filters."], ["GET", "/api/security/stats", "Retrieve analyst-only security analytics."], ["GET | POST", "/api/api-keys", "List or create a one-time-view API key."], ["DELETE", "/api/api-keys/:id", "Revoke a stored key hash."],
];
export default function ApiDocsPage() { return <section className="page"><div className="page-head"><div><p className="eyebrow">DEVELOPER API</p><h1>Security gateway API</h1><p className="muted">All endpoints validate inputs with Zod, apply rate limits, and require a secure session in the local MVP.</p></div><span className="demo-pill">LOCAL SESSION AUTH</span></div><article className="card"><p className="eyebrow">EXAMPLE · SECURITY ANALYSIS</p><pre style={{ margin: 0, overflow: "auto", color: "#bfefff", fontSize: 12 }}>{`curl -X POST http://localhost:3000/api/security/analyze \\
  -H "Content-Type: application/json" \\
  -H "Cookie: humanshield_session=<session-token>" \\
  -d '{
    "content": "Summarize this report",
    "source": "APPLICATION",
    "trustLevel": "AUTHORIZED_USER",
    "context": [{
      "content": "Untrusted retrieved text",
      "source": "DOCUMENT",
      "trustLevel": "RETRIEVED_DATA",
      "origin": "knowledge-base"
    }]
  }'`}</pre></article><article className="card table-wrap" style={{ marginTop: 16 }}><table className="data-table"><thead><tr><th>METHOD</th><th>ENDPOINT</th><th>DESCRIPTION</th></tr></thead><tbody>{endpoints.map(([method, path, description]) => <tr key={path}><td><code>{method}</code></td><td><code>{path}</code></td><td>{description}</td></tr>)}</tbody></table></article><div className="grid grid-2" style={{ marginTop: 16 }}><article className="card"><p className="eyebrow">RESPONSE SHAPE</p><pre style={{ color: "#bfefff", fontSize: 12, overflow: "auto" }}>{`{
  "assessment": {
    "riskScore": 78,
    "riskLevel": "HIGH",
    "securityIndicators": "detected",
    "recommendedAction": "BLOCK",
    "signals": []
  }
}`}</pre></article><article className="card"><p className="eyebrow">SECURITY NOTES</p><p className="muted">Do not place provider keys in browser code. API keys are returned once and stored as SHA-256 hashes in this demo adapter. Production APIs should use a database-backed key verifier, key scopes, rotation, and a distributed rate limiter.</p></article></div></section>; }
