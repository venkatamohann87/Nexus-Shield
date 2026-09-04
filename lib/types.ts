export type Role = "USER" | "SECURITY_ANALYST" | "ADMIN";
export type TrustLevel = "SYSTEM" | "DEVELOPER" | "AUTHORIZED_USER" | "APPLICATION" | "TOOL" | "RETRIEVED_DATA" | "WEB_CONTENT" | "EXTERNAL_AGENT" | "UNTRUSTED";
export type AttackType = "PROMPT_INJECTION" | "JAILBREAK" | "GOAL_HIJACK" | "INSTRUCTION_OVERRIDE" | "DATA_EXFILTRATION" | "PRIVILEGE_ESCALATION" | "TOOL_ABUSE" | "CONTEXT_POISONING" | "SOCIAL_ENGINEERING" | "SUSPICIOUS_AUTOMATION";
export type Decision = "ALLOW" | "BLOCK" | "REQUIRE_HUMAN_APPROVAL" | "APPROVED" | "DENIED";
export type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ContextObject {
  content: string;
  source: string;
  trustLevel: TrustLevel;
  origin: string;
  timestamp: string;
  contentHash: string;
  authority: number;
  riskScore: number;
}
export interface Signal { id: string; label: string; weight: number; category: "rule" | "provenance" | "behavior" | "semantic"; }
export interface SecurityAssessment {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  attackTypes: AttackType[];
  reasoningSummary: string;
  recommendedAction: Decision;
  confidence: number;
  signals: Signal[];
  provenance: { source: string; trustLevel: TrustLevel; authority: number; contentHash: string }[];
}
export interface SecurityEvent {
  id: string; userId?: string; sessionId?: string; eventType: string; severity: Severity; riskScore: number;
  source: string; contentHash: string; decision: Decision; attackType?: AttackType; toolName?: string;
  createdAt: string; metadata?: Record<string, unknown>;
}
export interface ToolDefinition { name: string; description: string; riskLevel: Severity; requiredPermissions: Role[]; allowedRoles: Role[]; requiresHumanApproval: boolean; enabled: boolean; }
export interface SecurityApproval { id: string; requesterId: string; toolName: string; reason: string; riskScore: number; origin: string; affectedResource?: string; status: "REQUIRE_HUMAN_APPROVAL" | "APPROVED" | "DENIED"; createdAt: string; resolvedAt?: string; approverId?: string; }
export interface User { id: string; email: string; passwordHash: string; role: Role; createdAt: string; }
export interface PublicUser { id: string; email: string; role: Role; createdAt: string; }
export interface HumanCredential { id: string; userId: string; commitment: string; createdAt: string; verifiedAt?: string; status: "NOT_VERIFIED" | "VERIFIED"; }
