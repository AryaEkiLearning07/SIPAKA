import requests
import re

url = "https://peraturan.bpk.go.id/Search"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
options = re.findall(r'<option[^>]*value=["\'](\d+)["\'][^>]*>(.*?)</option>', r.text)
print("Total options found:", len(options))
for val, text in options:
    t = text.strip()
    if any(k in t.lower() for k in ["menteri", "permen", "daerah", "gubernur", "bupati", "walikota", "uu", "pp", "perpres"]):
        print(f"  value={val} -> {t}")
