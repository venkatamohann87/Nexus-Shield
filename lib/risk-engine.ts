import { redact, sha256 } from "@/lib/crypto";
import type { AttackType, ContextObject, Decision, SecurityAssessment, Signal, TrustLevel } from "@/lib/types";

const authority: Record<TrustLevel, number> = { SYSTEM: 100, DEVELOPER: 90, AUTHORIZED_USER: 70, APPLICATION: 65, TOOL: 50, RETRIEVED_DATA: 25, WEB_CONTENT: 15, EXTERNAL_AGENT: 20, UNTRUSTED: 5 };
export function makeContext(content: string, source = "USER_REQUEST", trustLevel: TrustLevel = "AUTHORIZED_USER", origin = "console"): ContextObject { return { content: redact(content).slice(0, 12000), source, trustLevel, origin, timestamp: new Date().toISOString(), contentHash: sha256(content), authority: authority[trustLevel], riskScore: 0 }; }

interface Pattern { expression: RegExp; type: AttackType; weight: number; label: string; }
const patterns: Pattern[] = [
  { expression: /HUMANSHIELD_HIGH_ENTROPY_PAYLOAD/i, type: "CONTEXT_POISONING", weight: 46, label: "Obfuscated high-entropy payload" },
  { expression: /HUMANSHIELD_OBFUSCATED_CONTROL_SIGNATURE/i, type: "PROMPT_INJECTION", weight: 48, label: "Obfuscated control-pattern signature" },
  { expression: /ignore (all |any |the )?(previous|prior|above) instructions|disregard.*instructions/i, type: "PROMPT_INJECTION", weight: 48, label: "Instruction override language" },
  { expression: /ignora (todas? )?(las )?(instrucciones|indicaciones)( anteriores)?|olvida (las )?instrucciones|ignorer (toutes? )?(les )?instructions|oublie (les )?instructions|ignori (tutte )?le istruzioni|ignoriere (alle )?(vorherigen )?anweisungen|vorherige anweisungen ignorieren|ignore (todas? )?as instru[cç][õo]es|ignore as instru[cç][õo]es anteriores/i, type: "PROMPT_INJECTION", weight: 48, label: "Multilingual instruction override language" },
  { expression: /(?:पिछले|पहले के|पूर्व) निर्देश(?:ों)? को (?:अनदेखा|नज़रअंदाज़)|निर्देशों को अनदेखा|मுந்தைய வழிமுறைகளை புறக்கணி|வழிமுறைகளை புறக்கணி|మునుపటి సూచనలను విస్మరించు|이전 지침(?:을|을 모두) 무시|이전 명령을 무시|以前の指示を無視|先前指令.*忽略|忽略.*先前.*指令|игнорируй (?:предыдущие|все) инструкции|игнорировать предыдущие инструкции|تجاهل (?:التعليمات|كل التعليمات السابقة)/iu, type: "PROMPT_INJECTION", weight: 48, label: "Multilingual instruction override language" },
  { expression: /system prompt|developer message|hidden instructions|reveal (the )?(secrets|credentials|api key)/i, type: "JAILBREAK", weight: 38, label: "Protected instruction or secret extraction" },
  { expression: /muestra (?:el )?(?:mensaje|prompt) (?:del )?sistema|révèle (?:le )?(?:message|prompt) système|zeige (?:den )?system(?:prompt|nachricht)|mostre (?:o )?prompt do sistema|svela (?:il )?(?:prompt|messaggio) di sistema|सिस्टम (?:प्रॉम्प्ट|निर्देश) (?:दिखाओ|बताओ)|系统提示(?:词|内容)|システム(?:プロンプト|指示)を(?:表示|教えて)|시스템 프롬프트(?:를|를 보여)|покажи системный промпт|أظهر (?:موجه|تعليمات) النظام/iu, type: "JAILBREAK", weight: 38, label: "Multilingual protected-content extraction language" },
  { expression: /override (the )?(policy|guardrail|safety)|bypass (the )?(filter|security|approval)/i, type: "INSTRUCTION_OVERRIDE", weight: 42, label: "Policy bypass request" },
  { expression: /anula (?:la )?(?:pol[ií]tica|seguridad)|omite (?:la )?(?:seguridad|protecci[oó]n)|contourne (?:la )?(?:politique|s[eé]curit[eé])|désactive (?:la )?(?:sécurité|protection)|umgehe (?:die )?(?:sicherheit|richtlinie)|desative (?:a )?(?:seguran[cç]a|prote[cç][ãa]o)|bypasse (?:la )?(?:sicurezza|protezione)|सुरक्षा (?:को )?(?:बायपास|निष्क्रिय)|安全(?:限制|策略).*(?:绕过|关闭)|安全を(?:回避|無効)|보안(?:을)? (?:우회|해제)|обойди (?:защиту|ограничения)|تجاوز (?:الأمان|الحماية)/iu, type: "INSTRUCTION_OVERRIDE", weight: 42, label: "Multilingual policy-bypass language" },
  { expression: /send|upload|exfiltrate|export.{0,50}(password|secret|token|data|credential)/i, type: "DATA_EXFILTRATION", weight: 46, label: "Sensitive data transfer pattern" },
  { expression: /(?:env[ií]a|sube|exporta|filtra).{0,50}(?:contrase(?:ñ|n)a|secreto|token|datos|credenciales)|(?:envoie|téléverse|exporte|exfiltre).{0,50}(?:mot de passe|secret|jeton|données)|(?:sende|lade hoch|exportiere).{0,50}(?:passwort|geheimnis|token|daten)|(?:envie|carregue|exporte).{0,50}(?:senha|segredo|token|dados)|(?:秘密|令牌|密码|数据).{0,30}(?:发送|上传|导出)|(?:パスワード|秘密|トークン|データ).{0,30}(?:送信|アップロード|出力)|(?:비밀번호|비밀|토큰|데이터).{0,30}(?:전송|업로드|내보내)|(?:пароль|секрет|токен|данные).{0,30}(?:отправ|загруз|экспорт)|(?:كلمة المرور|سر|رمز|بيانات).{0,30}(?:أرسل|ارفع|صدّر)/iu, type: "DATA_EXFILTRATION", weight: 46, label: "Multilingual sensitive-transfer language" },
  { expression: /admin|root|elevat(e|ion)|grant.{0,30}(permission|access)|disable.{0,30}(log|audit)/i, type: "PRIVILEGE_ESCALATION", weight: 36, label: "Privilege escalation language" },
  { expression: /\b(?:call|use|execute)\b.{0,40}\b(?:transfer_funds|export_data|execute_code|database_query)\b/i, type: "TOOL_ABUSE", weight: 24, label: "Sensitive tool invocation pattern" },
  { expression: /do not tell (the )?user|urgent|trust me|for evaluation only|pretend you are/i, type: "SOCIAL_ENGINEERING", weight: 20, label: "Coercive or deceptive framing" },
  { expression: /repeat|automate|loop|mass.{0,20}(request|export|email)/i, type: "SUSPICIOUS_AUTOMATION", weight: 16, label: "Automation escalation pattern" }
];

export interface RiskEngine { analyzeRequest(context: ContextObject[], historyCount?: number): SecurityAssessment; }
/** Rule + provenance + behavioral implementation. Optional model analyzer belongs behind this interface. */
export class CompositeRiskEngine implements RiskEngine {
  analyzeRequest(context: ContextObject[], historyCount = 0): SecurityAssessment {
    const signals: Signal[] = []; const types = new Set<AttackType>(); let score = 0;
    for (const item of context) {
      for (const rule of patterns) if (rule.expression.test(item.content)) { const modifier = item.authority < 30 ? 1.2 : 1; const weight = Math.round(rule.weight * modifier); score += weight; types.add(rule.type); signals.push({ id: `${rule.type}-${signals.length}`, label: `${rule.label}${item.authority < 30 ? " in untrusted content" : ""}`, weight, category: "rule" }); }
      if (item.authority < 30 && /instruction|must|ignore|system|assistant|instrucciones|anweisungen|指示|指令|지침|инструкци|التعليمات|निर्देश|வழிமுறை|సూచన/iu.test(item.content)) { score += 24; types.add("CONTEXT_POISONING"); signals.push({ id: `prov-${signals.length}`, label: "Low-authority content contains instruction-like language", weight: 24, category: "provenance" }); }
      if (item.trustLevel === "WEB_CONTENT" || item.trustLevel === "RETRIEVED_DATA") { signals.push({ id: `source-${signals.length}`, label: `${item.trustLevel} is treated as data, never authority`, weight: 0, category: "provenance" }); }
    }
    if (historyCount > 8 && types.size > 0) { score += 12; types.add("SUSPICIOUS_AUTOMATION"); signals.push({ id: "behavior-history", label: "Repeated multi-turn attempt", weight: 12, category: "behavior" }); }
    score = Math.min(100, score);
    const riskLevel = score >= 80 ? "CRITICAL" : score >= 55 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";
    const recommendedAction: Decision = score >= 55 || types.has("PROMPT_INJECTION") || types.has("INSTRUCTION_OVERRIDE") ? "BLOCK" : score >= 25 ? "REQUIRE_HUMAN_APPROVAL" : "ALLOW";
    const summary = score === 0 ? "No high-risk patterns were found. Content remains subject to tool policy." : `${types.size} attack class${types.size === 1 ? "" : "es"} detected using rules, source authority, and behavioral context. ${recommendedAction === "BLOCK" ? "Untrusted instructions cannot modify trusted policy." : "Sensitive follow-on actions require authorization."}`;
    return { riskScore: score, riskLevel, attackTypes: [...types], reasoningSummary: summary, recommendedAction, confidence: Math.min(96, 62 + signals.filter((s) => s.weight > 0).length * 8), signals, provenance: context.map(({ source, trustLevel, authority: itemAuthority, contentHash }) => ({ source, trustLevel, authority: itemAuthority, contentHash })) };
  }
}
export const riskEngine = new CompositeRiskEngine();
