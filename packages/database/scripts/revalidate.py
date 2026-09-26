"""Validasi ulang JSON parse yang belum punya field validation (perbaikan batch lama)."""
import glob
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate import validate  # noqa: E402

STRUCT = Path(__file__).resolve().parent.parent / "seed" / "structured"

diperbaiki = 0
for f in sorted(glob.glob(str(STRUCT / "*.json"))):
    if "/_" in f.replace("\\", "/"):
        continue
    doc = json.loads(Path(f).read_text(encoding="utf-8"))
    if not isinstance(doc, dict) or "nodes" not in doc:
        continue
    r = validate(doc)
    doc["validation"] = {"skor": r["skor"], "keputusan": r["keputusan"],
                         "issues": r["issues"],
                         "publishMode": "AUTO_PUBLISH" if r["keputusan"] == "PASS" else "QUARANTINE"}
    Path(f).write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    diperbaiki += 1
    print(f"  {doc.get('slug')}: skor {r['skor']} {r['keputusan']}")
print(f"Selesai: {diperbaiki} JSON diperkaya validasi")
