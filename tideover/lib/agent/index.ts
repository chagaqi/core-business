/**
 * Agent core (SWAN SPRINT P1, ADR-0023) — runner + skills + enforced guardrails
 * on the existing DeepSeek provider pair. Surfaces import from here.
 */
export { runAgent, type RunAgentOptions, type RunAgentResult } from "./runner";
export { agentConfigured } from "./provider";
export { SKILLS, isSkillName, loadSkillBody, READABLE_DOCS, type SkillName } from "./skills";
export { guardAgentText, type GuardVerdict } from "./guardrails";
export { CORE_TOOLS, TENANT_TOOLS, toolByName } from "./tools";
export type { AgentEvent, AgentTool, AgentContext, AgentAudience } from "./types";
