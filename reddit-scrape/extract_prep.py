"""Extract first-cash prep pack (3 fields) into docs 30, 31, 32."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\wcoxpdwpl.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "practice_curriculum_md" not in res:
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
    "30-get-good-fast-practice-plan.md": clean(res.get("practice_curriculum_md", "")),
    "31-sample-brand-shoot-sheets.md": clean(res.get("shoot_sheets_md", "")),
    "32-first-cash-runbook.md": clean(res.get("first_cash_runbook_md", "")),
}
for name, content in targets.items():
    (OUT / name).write_text(content, encoding="utf-8")
    print(f"Wrote {name}: {len(content):,} chars")
