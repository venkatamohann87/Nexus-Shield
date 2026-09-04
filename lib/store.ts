import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomId, sha256 } from "@/lib/crypto";
import type { HumanCredential, Role, SecurityApproval, SecurityEvent, ToolDefinition, User } from "@/lib/types";

interface Session { tokenHash: string; userId: string; expiresAt: string; }
interface ApiKeyRecord { id: string; userId: string; label: string; prefix: string; keyHash: string; createdAt: string; revokedAt?: string; }
interface RuntimeState { users: User[]; sessions: Session[]; credentials: HumanCredential[]; events: SecurityEvent[]; approvals: SecurityApproval[]; apiKeys: ApiKeyRecord[]; }

const tools: ToolDefinition[] = [
  { name: "search_web", description: "Search public web sources", riskLevel: "LOW", requiredPermissions: ["USER"], allowedRoles: ["USER", "SECURITY_ANALYST", "ADMIN"], requiresHumanApproval: false, enabled: true },
  { name: "read_document", description: "Read a supplied document through the context firewall", riskLevel: "MEDIUM", requiredPermissions: ["USER"], allowedRoles: ["USER", "SECURITY_ANALYST", "ADMIN"], requiresHumanApproval: false, enabled: true },
  { name: "send_email", description: "Send a user-approved email", riskLevel: "MEDIUM", requiredPermissions: ["SECURITY_ANALYST"], allowedRoles: ["SECURITY_ANALYST", "ADMIN"], requiresHumanApproval: true, enabled: true },
  { name: "database_query", description: "Read scoped application records", riskLevel: "HIGH", requiredPermissions: ["SECURITY_ANALYST"], allowedRoles: ["SECURITY_ANALYST", "ADMIN"], requiresHumanApproval: true, enabled: true },
  { name: "export_data", description: "Export minimized security data", riskLevel: "HIGH", requiredPermissions: ["SECURITY_ANALYST"], allowedRoles: ["SECURITY_ANALYST", "ADMIN"], requiresHumanApproval: true, enabled: true },
  { name: "execute_code", description: "Request isolated code execution", riskLevel: "CRITICAL", requiredPermissions: ["ADMIN"], allowedRoles: ["ADMIN"], requiresHumanApproval: true, enabled: true },
  { name: "transfer_funds", description: "Request a restricted financial transfer", riskLevel: "CRITICAL", requiredPermissions: ["ADMIN"], allowedRoles: ["ADMIN"], requiresHumanApproval: true, enabled: true },
];

const runtimeStorePath = process.env.HUMANSHIELD_DATA_PATH || join(process.cwd(), "data", "runtime-store.json");
const persistenceEnabled = process.env.NODE_ENV !== "test";
const emptyState = (): RuntimeState => ({ users: [], sessions: [], credentials: [], events: [], approvals: [], apiKeys: [] });

function arrayOf<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }

function loadState(): RuntimeState {
  if (!persistenceEnabled || !existsSync(runtimeStorePath)) return emptyState();
  try {
    const parsed: unknown = JSON.parse(readFileSync(runtimeStorePath, "utf8"));
    if (!parsed || typeof parsed !== "object") return emptyState();
    const data = parsed as Partial<RuntimeState>;
    return { users: arrayOf<User>(data.users), sessions: arrayOf<Session>(data.sessions), credentials: arrayOf<HumanCredential>(data.credentials), events: arrayOf<SecurityEvent>(data.events), approvals: arrayOf<SecurityApproval>(data.approvals), apiKeys: arrayOf<ApiKeyRecord>(data.apiKeys) };
  } catch {
    return emptyState();
  }
}

function persistState(state: RuntimeState): void {
  if (!persistenceEnabled) return;
  mkdirSync(dirname(runtimeStorePath), { recursive: true });
  writeFileSync(runtimeStorePath, JSON.stringify(state), { encoding: "utf8", mode: 0o600 });
}

/** Local single-node runtime store. It persists real accounts and audit metadata across restarts. */
class LocalRuntimeStore {
  private state = loadState();

  get users(): User[] { return this.state.users; }
  get sessions(): Session[] { return this.state.sessions; }
  get credentials(): HumanCredential[] { return this.state.credentials; }
  get events(): SecurityEvent[] { return this.state.events; }
  get approvals(): SecurityApproval[] { return this.state.approvals; }
  get apiKeys(): ApiKeyRecord[] { return this.state.apiKeys; }
  private commit(): void { persistState(this.state); }

  createUser(email: string, passwordHash: string, role: Role = "USER"): User { const user = { id: randomId(), email: email.toLowerCase(), passwordHash, role, createdAt: new Date().toISOString() }; this.state.users.push(user); this.commit(); return user; }
  getUserByEmail(email: string): User | undefined { return this.state.users.find((u) => u.email === email.toLowerCase()); }
  getUser(id: string): User | undefined { return this.state.users.find((u) => u.id === id); }
  createSession(userId: string): string { const token = randomId(32); this.state.sessions.push({ tokenHash: sha256(token), userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() }); this.commit(); return token; }
  getSession(token: string): User | undefined { const found = this.state.sessions.find((s) => s.tokenHash === sha256(token) && new Date(s.expiresAt) > new Date()); return found ? this.getUser(found.userId) : undefined; }
  deleteSession(token: string): void { this.state.sessions = this.state.sessions.filter((s) => s.tokenHash !== sha256(token)); this.commit(); }
  credentialFor(userId: string): HumanCredential | undefined { return this.state.credentials.find((c) => c.userId === userId); }
  createCredential(userId: string): HumanCredential { const existing = this.credentialFor(userId); if (existing) return existing; const credential = { id: `cred_${randomId(12)}`, userId, commitment: sha256(`${randomId(32)}:${userId}`), createdAt: new Date().toISOString(), status: "NOT_VERIFIED" as const }; this.state.credentials.push(credential); this.commit(); return credential; }
  verifyCredential(userId: string): HumanCredential { const credential = this.createCredential(userId); credential.status = "VERIFIED"; credential.verifiedAt = new Date().toISOString(); this.commit(); return credential; }
  addEvent(event: SecurityEvent): SecurityEvent { this.state.events.unshift(event); this.commit(); return event; }
  addApproval(approval: SecurityApproval): SecurityApproval { this.state.approvals.unshift(approval); this.commit(); return approval; }
  resolveApproval(id: string, status: "APPROVED" | "DENIED", approverId: string): SecurityApproval | undefined { const approval = this.state.approvals.find((a) => a.id === id); if (!approval || approval.status !== "REQUIRE_HUMAN_APPROVAL") return undefined; approval.status = status; approval.approverId = approverId; approval.resolvedAt = new Date().toISOString(); this.commit(); return approval; }
  createApiKey(userId: string, label: string): { record: ApiKeyRecord; raw: string } { const raw = `hs_live_${randomId(24)}`; const record = { id: randomId(), userId, label, prefix: raw.slice(0, 13), keyHash: sha256(raw), createdAt: new Date().toISOString() }; this.state.apiKeys.unshift(record); this.commit(); return { record, raw }; }
  revokeApiKey(id: string, userId: string): boolean { const key = this.state.apiKeys.find((k) => k.id === id && k.userId === userId && !k.revokedAt); if (!key) return false; key.revokedAt = new Date().toISOString(); this.commit(); return true; }
}

declare global { var humanshieldStore: LocalRuntimeStore | undefined; }
export const store = global.humanshieldStore ?? new LocalRuntimeStore();
if (process.env.NODE_ENV !== "production") global.humanshieldStore = store;
export { tools };
