import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AgentAudience } from "@/lib/agent/types";

/**
 * Skill registry (SWAN SPRINT P1). A skill = a markdown spec (Swan's anatomy:
 * trigger-dense purpose → procedure → Universal rules → Anti-patterns → What
 * good looks like) + an audience (which guardrail gate applies to the final
 * text) + a least-privilege tool allowlist. Bodies load from disk lazily so
 * editing a skill never needs a code change.
 */
export interface SkillMeta {
  audience: AgentAudience;
  /** tool names this skill may call — the runner exposes nothing else */
  tools: readonly string[];
}

export const SKILLS = {
  "diagnose-page": {
    audience: "merchant",
    tools: ["tideover-scrape-page", "tideover-read-skill"],
  },
  "draft-reassurance": {
    audience: "customer",
    tools: ["tideover-read-tickets", "tideover-draft-reply", "tideover-read-skill"],
  },
  "triage-inbox": {
    audience: "merchant",
    tools: ["tideover-read-tickets", "tideover-read-orders", "tideover-read-skill"],
  },
  "health-check": {
    audience: "merchant",
    tools: ["tideover-read-orders", "tideover-read-tickets", "tideover-read-skill"],
  },
  skillify: {
    audience: "merchant",
    tools: ["tideover-read-skill"],
  },
} as const satisfies Record<string, SkillMeta>;
// import-backers is DEFERRED to P2 (SW4): its tools (CSV mapping in the wizard)
// don't exist yet, and a skill may never reference a tool the runner lacks.

export type SkillName = keyof typeof SKILLS;

export function isSkillName(value: string): value is SkillName {
  return Object.prototype.hasOwnProperty.call(SKILLS, value);
}

/** documents readable via tideover-read-skill (skills + the guardrails contract) */
export type ReadableDoc = SkillName | "GUARDRAILS";
export const READABLE_DOCS: readonly ReadableDoc[] = [...(Object.keys(SKILLS) as SkillName[]), "GUARDRAILS"];

export async function loadSkillBody(name: ReadableDoc): Promise<string> {
  // names come from the registry, never from user input — but belt-and-braces anyway
  if (!/^[A-Za-z][A-Za-z-]*$/.test(name)) throw new Error(`invalid skill name: ${name}`);
  const path = join(process.cwd(), "lib", "agent", "skills", `${name}.md`);
  return readFile(path, "utf8");
}
