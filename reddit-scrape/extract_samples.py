"""Extract WF7 per-prospect sample scripts into 26-prospect-sample-scripts.md."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\w703r12ee.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\26-prospect-sample-scripts.md")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "scripts" not in res:
    res = res.get("result", {})
scripts = res["scripts"]

L = []
L.append("# Per-Prospect Sample Scripts — Top A-Tier Brands")
L.append("")
L.append("**Built:** 2026-05-29 (WF7). One fully-shootable AI UGC sample script per top A-tier prospect.")
L.append("")
L.append("**Purpose:** the \"made-for-them sample\" that leads each cold email (highest-reply-rate action). "
         "Each script matches the angle + hero SKU already chosen for that brand in `22-prospect-personalization.md`, "
         "so the rendered sample and the email opener tell one story. Paste `script_beats` into Arcads, render, host unlisted, "
         "drop the link into `{{sampleLink}}` in `14-cold-email-sequence.md`.")
L.append("")
L.append("> These are sample ads made to earn a reply (\"I made you this\") — standard practice. "
         "No fabricated metrics/claims; efficacy language kept honest and FTC/Meta-safe (no disease/cure claims).")
L.append("")
L.append("---")
L.append("")

for i, s in enumerate(scripts, 1):
    L.append(f"## {i}. {s.get('brand','')}")
    L.append(f"**Product:** {s.get('product','')}")
    L.append("")
    L.append(f"**Angle:** {s.get('angle','')}")
    L.append("")
    L.append(f"**ID:** `{s.get('id','')}`  ·  **Length:** {s.get('length_sec','')}s")
    L.append("")
    L.append(f"**Hook:** {s.get('hook','')}")
    L.append("")
    L.append(f"**On-screen text:** {s.get('on_screen_text','')}")
    L.append("")
    L.append("**Script (paste into Arcads):**")
    for j, beat in enumerate(s.get("script_beats", []), 1):
        L.append(f"> {j}. {beat}")
    L.append("")
    L.append(f"**Shot directions:** {s.get('shot_directions','')}")
    L.append("")
    L.append(f"**CTA:** {s.get('cta','')}")
    L.append("")
    L.append(f"**Avatar:** {s.get('avatar_persona','')}")
    L.append("")
    L.append(f"**Why this for them:** {s.get('why_this_for_them','')}")
    L.append("")
    L.append("---")
    L.append("")

OUT.write_text("\n".join(L), encoding="utf-8")
print(f"Wrote {OUT.name}: {len(scripts)} scripts, {OUT.stat().st_size:,} bytes")
for s in scripts:
    print(f"  - {s.get('brand','')}: {s.get('id','')}")
