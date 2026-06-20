"""Write the PPV migration map -> 33-ppv-migration-map.md."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\wtnwd2ig4.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\33-ppv-migration-map.md")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "migration_map_md" not in res:
    res = res.get("result", {})
md = res["migration_map_md"]

# strip any leading agent narration before the first markdown heading
lines = md.split("\n")
for i, ln in enumerate(lines):
    if ln.strip().startswith("#"):
        md = "\n".join(lines[i:]).strip()
        break

OUT.write_text(md, encoding="utf-8")
print(f"Wrote {OUT.name}: {len(md):,} chars")
# show the agent-offload register section + project headers for the summary
import re
for m in re.finditer(r"^#{1,3} .*(AGENT|Agent|Offload|PROJECT [A-Z]).*$", md, re.MULTILINE):
    print("  " + m.group(0)[:90])
