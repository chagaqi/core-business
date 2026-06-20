"""Write WF offer-expansion output -> 29-offer-expansion-dfy-dwy-system.md; print ladder + decisions."""
import json
from pathlib import Path

SRC = Path(r"C:\Users\dylan\AppData\Local\Temp\claude\C--Users-dylan-Documents-axiom-balloon-Core-Business\1cf5622e-0303-4b66-ae6a-9bd6e70a5da8\tasks\wrqothjg1.output")
OUT = Path(r"C:\Users\dylan\Documents\axiom-balloon\Core Business\29-offer-expansion-dfy-dwy-system.md")

data = json.loads(SRC.read_text(encoding="utf-8"))
res = data
while isinstance(res, dict) and "expansion_doc_markdown" not in res:
    res = res.get("result", {})

OUT.write_text(res["expansion_doc_markdown"], encoding="utf-8")
print(f"Wrote {OUT.name}: {len(res['expansion_doc_markdown']):,} chars\n")
print("LADDER ONE-LINER:\n" + res.get("ladder_one_liner", "") + "\n")
print("KEY DECISIONS:")
for d in res.get("key_decisions", []):
    print(f"- {d}")
