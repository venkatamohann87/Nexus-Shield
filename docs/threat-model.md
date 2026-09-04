# HumanShield AI threat model

This MVP reduces risk; it does not establish perfect human uniqueness or guarantee prompt-injection detection.

| Threat | Attack / impact | MVP mitigation | Residual risk |
|---|---|---|---|
| Bot farms / Sybil attacks | Many accounts distort a service | Domain-specific nullifier abstraction and rate limits | Demo credential issuance is not a real proof-of-personhood service. |
| Credential theft | Stolen session or credential is used | HttpOnly session cookie, short-lived server-side session abstraction, no credential exposure | Device/session theft still needs MFA, revocation, anomaly detection. |
| Replay attacks | A proof is reused at another relying party | Nullifier is deterministic per domain | Demo proof is not a nonce-bound ZK proof. |
| Direct jailbreak | User asks to ignore hierarchy or reveal secrets | Rule signals, risk scoring, block decision, no secret store | Novel phrasing and model behavior can evade detection. |
| Malicious retrieval / webpages | Untrusted data issues agent instructions | Source authority and context-poisoning signal; untrusted content remains data | Semantic attacks require model-based and human review layers. |
| Tool abuse / privilege escalation | Agent requests powerful operation | Independent tool gateway, RBAC, approval workflow, simulated tools | Policy mistakes, compromised approvers, and integrations remain risks. |
| Data exfiltration | Secrets or records sent externally | Exfiltration signals, blocked high-risk context, human review | A permitted export can still leak data; add DLP and egress controls. |
| Compromised AI agent | Agent behavior is altered | Least privilege, audit events, no direct tools | Agent identity, attestation, and runtime isolation are not implemented. |
| Malicious user / analyst | Authorized party abuses access | RBAC and approval events | Insider controls need segregation of duties and immutable audit storage. |
| Compromised credentials / keys | API token exposed | One-time display and SHA-256 storage in demo | Use keyed hashing, scopes, rotation, KMS, and anomaly monitoring in production. |

## Trust assumptions

The deployment operator is trusted to configure policies and retention. The credential issuer and cryptographic implementation must be independently audited. Human approvers are trusted but should be separated from requesters for critical actions.
