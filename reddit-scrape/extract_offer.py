"""Extract WF1 (offer-lock) JSON output into markdown files."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\w58vlr2fo.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business")

data = json.loads(SRC.read_text(encoding="utf-8"))
# unwrap to the dict that holds offer_doc_markdown
res = data
while isinstance(res, dict) and "offer_doc_markdown" not in res:
    res = res.get("result", {})

offer = res["offer_doc_markdown"]
pos = res["positioning_doc_markdown"]
session = res.get("session_update_markdown", "")
decisions = res.get("key_decisions", [])

(OUT / "12-offer-locked.md").write_text(offer, encoding="utf-8")
(OUT / "13-positioning-acp.md").write_text(pos, encoding="utf-8")

# Save the session update + decisions to a temp scratch so we can fold them in
scratch = OUT / "reddit-scrape" / "_wf1_session_and_decisions.md"
scratch.write_text("## SESSION UPDATE\n\n" + session + "\n\n## KEY DECISIONS\n\n" +
                   "\n".join(f"- {d}" for d in decisions), encoding="utf-8")

print(f"12-offer-locked.md: {len(offer)} chars")
print(f"13-positioning-acp.md: {len(pos)} chars")
print(f"session_update: {len(session)} chars; decisions: {len(decisions)}")
print("\n--- KEY DECISIONS ---")
for d in decisions:
    print(f"- {d}")
print("\n--- SESSION UPDATE ---")
print(session)
