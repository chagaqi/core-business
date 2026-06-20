"""Extract the 72 AI UGC scripts from WF4 output into a readable library markdown."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\w29fu1omq.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\19-creative-scripts.md")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "scripts" not in res:
    res = res.get("result", {})
scripts = res["scripts"]

BRAND = {"MYCO": "MycoMornings (mushroom coffee, $39)",
         "ZEN": "ZenChews (ashwagandha + L-theanine gummies, $34)",
         "DAILY": "DailyGreens24 (greens powder, $59)",
         "DG": "DailyGreens24 (greens powder, $59)"}

def brand_of(sid):
    tok = sid.split("_")[0].upper()
    return BRAND.get(tok, tok)

# group
groups = {}
for s in scripts:
    b = brand_of(s.get("id", "?"))
    groups.setdefault(b, []).append(s)

lines = []
lines.append("# AI UGC Script Library — 4×24 Framework Applied")
lines.append("")
lines.append("**Built:** 2026-05-29 (WF4 creative-kit workflow, 12 brand×angle agents)")
lines.append(f"**Total ready-to-shoot scripts:** {len(scripts)} across {len(groups)} sample brands × 4 angles")
lines.append("")
lines.append("Companion docs (same folder): `4x24-framework-spec.md` (the method), `production-sop.md` (the assembly line).")
lines.append("")
lines.append("**Sample brands are fictional** portfolio demos (not real companies) — used to build a portfolio before landing the first client. "
             "Each script's `script_beats` are written to paste directly into Arcads/Creatify. Naming: `BRAND_ANGLE_HOOK_FORMAT_LEN_vNN`.")
lines.append("")
lines.append("---")
lines.append("")

for b in sorted(groups):
    rows = groups[b]
    lines.append(f"## {b} — {len(rows)} scripts")
    lines.append("")
    # sub-group by angle
    by_angle = {}
    for s in rows:
        by_angle.setdefault(s.get("angle", "?"), []).append(s)
    for angle in sorted(by_angle):
        lines.append(f"### Angle: {angle}")
        lines.append("")
        for s in by_angle[angle]:
            lines.append(f"#### `{s.get('id','')}`  ·  {s.get('format','')}  ·  {s.get('length_sec','')}s  ·  {s.get('placement','')}")
            lines.append(f"**Hook:** {s.get('hook','')}")
            lines.append("")
            lines.append(f"**On-screen text:** {s.get('on_screen_text','')}")
            lines.append("")
            lines.append("**Script (paste into Arcads):**")
            for i, beat in enumerate(s.get("script_beats", []), 1):
                lines.append(f"> {i}. {beat}")
            lines.append("")
            lines.append(f"**Shot directions:** {s.get('shot_directions','')}")
            lines.append("")
            lines.append(f"**CTA:** {s.get('cta','')}  ·  **Avatar:** {s.get('avatar_persona','')}")
            lines.append("")
            lines.append(f"**Hypothesis tested:** {s.get('hypothesis','')}")
            lines.append("")
            lines.append("---")
            lines.append("")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {OUT.name}: {len(scripts)} scripts, {len(groups)} brands")
for b in sorted(groups):
    print(f"  {b}: {len(groups[b])}")
