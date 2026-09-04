import { randomId, sha256 } from "@/lib/crypto";
import { store, tools } from "@/lib/store";
import type { Decision, Role, SecurityApproval, SecurityAssessment, ToolDefinition } from "@/lib/types";

export interface ToolAuthorizationResult { decision: Decision; reason: string; tool?: ToolDefinition; approval?: SecurityApproval; }
export function authorizeTool(userId: string, role: Role, toolName: string, reason: string, assessment: SecurityAssessment, origin: string): ToolAuthorizationResult {
  const tool = tools.find((item) => item.name === toolName);
  if (!tool || !tool.enabled) return { decision: "BLOCK", reason: "Tool is unavailable." };
  if (!tool.allowedRoles.includes(role)) return { decision: "BLOCK", reason: `Role ${role} is not authorized for ${toolName}.`, tool };
  if (assessment.recommendedAction === "BLOCK") return { decision: "BLOCK", reason: "Request was blocked by the context firewall before tool authorization.", tool };
  if (tool.requiresHumanApproval || assessment.recommendedAction === "REQUIRE_HUMAN_APPROVAL") {
    const approval = store.addApproval({ id: `apr_${randomId(10)}`, requesterId: userId, toolName, reason: reason.slice(0, 500), riskScore: assessment.riskScore, origin, affectedResource: "demo protected resource", status: "REQUIRE_HUMAN_APPROVAL", createdAt: new Date().toISOString() });
    return { decision: "REQUIRE_HUMAN_APPROVAL", reason: "Policy requires an authorized human approval before this protected action.", tool, approval };
  }
  return { decision: "ALLOW", reason: "Request satisfies context and least-privilege policy.", tool };
}
export function recordToolEvent(userId: string, result: ToolAuthorizationResult, assessment: SecurityAssessment, source: string): void {
  store.addEvent({ id: `evt_${randomId(10)}`, userId, eventType: "TOOL_AUTHORIZATION", severity: result.decision === "BLOCK" ? "HIGH" : result.decision === "REQUIRE_HUMAN_APPROVAL" ? "MEDIUM" : "LOW", riskScore: assessment.riskScore, source, contentHash: sha256(`${result.tool?.name}:${assessment.riskScore}`), decision: result.decision, attackType: assessment.attackTypes[0], toolName: result.tool?.name, createdAt: new Date().toISOString(), metadata: { reason: result.reason, demo: true } });
}
