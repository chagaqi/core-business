/**
 * Agent repl (SWAN SPRINT P1) — run a skill from the terminal, streaming the
 * checklist the way the UI will. Uses the json/demo datastore unless run in a
 * request context, so the seeded demo merchant + personas work out of the box.
 *
 *   npm run agent:repl -- --skill diagnose-page --input "https://example-store.com"
 *   npm run agent:repl -- --skill draft-reassurance --input "draft a reply for the angriest open ticket" --merchant mch_lumen0001
 *
 * Needs LLM_PROVIDER + LLM_API_KEY in .env.local (the LlmDrafter pair).
 */
import { runAgent } from "../lib/agent/runner.ts";
import { isSkillName, SKILLS } from "../lib/agent/skills.ts";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

const skill = arg("skill") ?? "";
const input = arg("input") ?? "";
const merchantId = arg("merchant");

if (!isSkillName(skill) || !input) {
  console.error(`usage: npm run agent:repl -- --skill <${Object.keys(SKILLS).join("|")}> --input "<message>" [--merchant <id>]`);
  process.exit(2);
}

let streamed = false;
const result = await runAgent({
  skill,
  input,
  merchantId,
  onEvent(event) {
    switch (event.type) {
      case "tool_started":
        if (streamed) { process.stdout.write("\n"); streamed = false; }
        console.log(`  · ${event.label}…`);
        break;
      case "tool_done":
        console.log(`  ${event.ok ? "✓" : "✗"} ${event.label}`);
        break;
      case "text_delta":
        streamed = true;
        process.stdout.write(event.text);
        break;
      case "guardrail_rejected":
        if (streamed) { process.stdout.write("\n"); streamed = false; }
        console.log(`\n⛔ guardrail rejected the output (${event.reason}) — nothing shipped`);
        break;
      case "turn_done":
        if (streamed) { process.stdout.write("\n"); streamed = false; }
        console.log(`\n— done (${event.toolCount} tool call${event.toolCount === 1 ? "" : "s"})`);
        break;
      case "agent_error":
        if (streamed) { process.stdout.write("\n"); streamed = false; }
        console.log(`\n✗ agent error: ${event.message}`);
        break;
    }
  },
});

process.exit(result.ok ? 0 : 1);
