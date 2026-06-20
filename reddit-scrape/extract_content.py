"""Combine WF5 content-engine output (6 fields) into one structured markdown file."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\wr2yovhez.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\20-content-engine.md")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "profiles_md" not in res:
    res = res.get("result", {})

def clean(md):
    """Drop any leading agent narration before the first markdown heading."""
    if not md:
        return ""
    lines = md.split("\n")
    for i, ln in enumerate(lines):
        s = ln.strip()
        if s.startswith("#") or s.startswith("---"):
            return "\n".join(lines[i:]).strip()
    return md.strip()

# The SOP agent wrote its full output to a standalone file; prefer it over the summary field.
sop_path = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\14-content-operating-system.md")
sop_full = sop_path.read_text(encoding="utf-8") if sop_path.exists() else res.get("sop_md", "")

sections = [
    ("1. Profiles + Founder Origin", res.get("profiles_md", "")),
    ("2. 30-Day Content Calendar", res.get("calendar_md", "")),
    ("3. Week 1 — X Posts (drafted, ready to post)", res.get("x_week1_md", "")),
    ("4. Week 1 — LinkedIn Posts (drafted, ready to post)", res.get("li_week1_md", "")),
    ("5. Newsletter + Lead-Gen Pack", res.get("newsletter_md", "")),
    ("6. Content Operating System (daily SOP + launch checklist)", sop_full),
]

out = []
out.append("# Content Engine — Founder-Led Distribution")
out.append("")
out.append("**Built:** 2026-05-29 (WF5 content workflow, 6 agents). Voice + offer pulled from `12-offer-locked.md` + `13-positioning-acp.md`.")
out.append("")
out.append("Engine model: Dan Koe write-once/repurpose + Dakota Robertson G-A-P split, 5 pillars, X (primary) + LinkedIn (secondary) + Beehiiv newsletter. "
           "All proof marked `[CASE STUDY PLACEHOLDER]`; founder specifics marked `[FILL: ...]` — fill before posting.")
out.append("")
out.append("## Contents")
for title, _ in sections:
    out.append(f"- {title}")
out.append("")
out.append("---")
out.append("")
for title, md in sections:
    out.append(f"# {title}")
    out.append("")
    out.append(clean(md))
    out.append("")
    out.append("\n---\n")

OUT.write_text("\n".join(out), encoding="utf-8")
print(f"Wrote {OUT.name}: {OUT.stat().st_size:,} bytes")
for title, md in sections:
    print(f"  {title}: {len(clean(md)):,} chars")
