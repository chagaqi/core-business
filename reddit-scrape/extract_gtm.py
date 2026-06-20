"""Extract WF2 GTM markdown fields into their files (landing page handled separately)."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\w718fu11m.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "cold_email_md" not in res:
    res = res.get("result", {})

def clean(md):
    if not md:
        return ""
    lines = md.split("\n")
    for i, ln in enumerate(lines):
        s = ln.strip()
        if s.startswith("#") or s.startswith("---"):
            return "\n".join(lines[i:]).strip()
    return md.strip()

targets = {
    "14-cold-email-sequence.md": clean(res.get("cold_email_md", "")),
    "16-lead-magnet.md": clean(res.get("lead_magnet_md", "")),
    "18-sales-playbook.md": clean(res.get("sales_playbook_md", "")),
}
for name, content in targets.items():
    (OUT / name).write_text(content, encoding="utf-8")
    print(f"Wrote {name}: {len(content):,} chars")
