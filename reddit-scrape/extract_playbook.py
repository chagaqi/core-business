"""Write WF8 credibility playbook -> 27-credibility-and-trust.md; print per-file change reports."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\wjqmfobl0.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\27-credibility-and-trust.md")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "playbook_md" not in res:
    res = res.get("result", {})

OUT.write_text(res["playbook_md"], encoding="utf-8")
print(f"Wrote {OUT.name}: {len(res['playbook_md']):,} chars\n")
print("=== PER-FILE CHANGE REPORTS ===")
for ft in res.get("files_touched", []):
    rep = ft.get("report", "")
    # trim each report to a readable head
    head = rep if len(rep) < 700 else rep[:700] + " …"
    print(f"\n--- {ft.get('file')} ---\n{head}")
