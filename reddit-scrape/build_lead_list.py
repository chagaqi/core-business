"""Transform the lead-list workflow JSON output into a clean CSV + markdown.

Reads the WF3 task output (array of brand dicts), dedupes/merges near-duplicates,
sorts by priority then confidence, and writes:
  - 17-lead-list.csv   (import-ready: quoted fields, email column flagged 'enrich')
  - 17-lead-list.md    (scannable, grouped by priority tier)
"""
import csv
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\wi7ulzvol.output")
OUT_DIR = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business")
CSV_PATH = OUT_DIR / "17-lead-list.csv"
MD_PATH = OUT_DIR / "17-lead-list.md"

data = json.loads(SRC.read_text(encoding="utf-8"))
brands = data["result"]["brands"]

# Dedup/merge: normalize key = lowercase, drop parenthetical suffix
def norm(name):
    return name.lower().split(" (")[0].strip()

seen = {}
deduped = []
dropped = []
for b in brands:
    k = norm(b.get("brand", ""))
    if not k:
        continue
    if k in seen:
        dropped.append(b.get("brand"))
        continue
    seen[k] = True
    deduped.append(b)

# Sort by priority (A<B<C) then confidence (high<medium<low)
prio_rank = {"A": 0, "B": 1, "C": 2}
conf_rank = {"high": 0, "medium": 1, "low": 2}
deduped.sort(key=lambda b: (prio_rank.get(b.get("priority", "C"), 3),
                            conf_rank.get(b.get("confidence", "low"), 3),
                            b.get("brand", "").lower()))

COLS = ["priority", "confidence", "brand", "sub_segment", "url",
        "founder_name", "founder_linkedin", "founder_x", "instagram",
        "email", "fit_signal", "personalization_hook"]

with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, quoting=csv.QUOTE_ALL)
    w.writerow([c.upper() for c in COLS])
    for b in deduped:
        row = []
        for c in COLS:
            if c == "email":
                row.append("enrich")
            else:
                row.append(b.get(c, ""))
        w.writerow(row)

# Counts
by_prio = {"A": 0, "B": 0, "C": 0}
for b in deduped:
    by_prio[b.get("priority", "C")] = by_prio.get(b.get("priority", "C"), 0) + 1

# Markdown
lines = []
lines.append("# Prospect Lead List — Functional Consumables DTC Brands")
lines.append("")
lines.append("**Built:** 2026-05-29 (WF3 research workflow, 5 sub-vertical research agents)")
lines.append(f"**Total unique brands:** {len(deduped)} "
             f"(A-tier: {by_prio['A']}, B-tier: {by_prio['B']}, C-tier: {by_prio['C']})")
lines.append("")
lines.append("**How to use:** A-tier = hit first (clear fit + strong personalization hook). "
             "Emails are NOT included — every row's email is flagged `enrich` (do NOT fabricate). "
             "Run founder names + domains through an enrichment tool (e.g. a verified-email finder) "
             "before loading into the cold-email sequence. Personalization hook = the cold-email opener line.")
lines.append("")
lines.append("**CSV:** `17-lead-list.csv` (import-ready, all fields quoted).")
lines.append("")
lines.append("> ⚠️ **Accuracy note:** fit signals are research estimates of the $20-100K/mo spend tier, "
             "not confirmed ad-spend figures. C-tier rows include brands flagged as possibly above the "
             "$100K/mo ceiling (e.g. TRIP, Culture Pop, DIRTEA) or below the floor — qualify on the call. "
             "A few celebrity-owned brands (Barker Wellness, De Soi) need outreach to a marketing lead, not the founder.")
lines.append("")
if dropped:
    lines.append(f"_Merged duplicates: {', '.join(dropped)}._")
    lines.append("")
lines.append("---")
lines.append("")

tier_titles = {"A": "🅰️ A-Tier — Hit First", "B": "🅱️ B-Tier — Strong Second Wave", "C": "🅲 C-Tier — Qualify / Enrich Before Outreach"}
for tier in ["A", "B", "C"]:
    rows = [b for b in deduped if b.get("priority") == tier]
    if not rows:
        continue
    lines.append(f"## {tier_titles[tier]} ({len(rows)})")
    lines.append("")
    for b in rows:
        fn = b.get("founder_name", "unknown")
        lines.append(f"### {b.get('brand')}  ·  _{b.get('sub_segment','')}_")
        lines.append(f"- **Site:** {b.get('url','unknown')}  ·  **IG:** {b.get('instagram','unknown')}  ·  **Confidence:** {b.get('confidence','')}")
        lines.append(f"- **Founder:** {fn}")
        li = b.get("founder_linkedin", "unknown")
        fx = b.get("founder_x", "unknown")
        if li and li != "unknown":
            lines.append(f"- **LinkedIn:** {li}")
        if fx and fx != "unknown":
            lines.append(f"- **X:** {fx}")
        lines.append(f"- **Why they fit:** {b.get('fit_signal','')}")
        lines.append(f"- **🎯 Cold-email hook:** {b.get('personalization_hook','')}")
        lines.append("")
    lines.append("---")
    lines.append("")

MD_PATH.write_text("\n".join(lines), encoding="utf-8")

print(f"Wrote {CSV_PATH.name}: {len(deduped)} rows")
print(f"Wrote {MD_PATH.name}")
print(f"Priority split -> A:{by_prio['A']} B:{by_prio['B']} C:{by_prio['C']}")
print(f"Merged/dropped duplicates: {dropped}")
