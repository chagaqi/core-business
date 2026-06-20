"""Extract WF6 launch-ops fields into files 22-25."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\wqkqagqj6.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "personalization_md" not in res:
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
    "22-prospect-personalization.md": clean(res.get("personalization_md", "")),
    "23-launch-setup-guides.md": clean(res.get("setup_guides_md", "")),
    "24-pilot-agreement-and-intake.md": clean(res.get("agreement_intake_md", "")),
    "25-path-to-20k-model.md": clean(res.get("path_to_20k_md", "")),
}
for name, content in targets.items():
    (OUT / name).write_text(content, encoding="utf-8")
    print(f"Wrote {name}: {len(content):,} chars")
