"""Intip parameter filter pencarian BPK."""
import re
import requests

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}

r = requests.get("https://peraturan.bpk.go.id/Search?keywords=&jenis=uu", headers=UA, timeout=45)
print("status:", r.status_code, "| bytes:", len(r.text))
for m in re.finditer(r'<select[^>]*name="([^"]+)"', r.text):
    print("select param:", m.group(1))
for m in re.finditer(r'<option[^>]*value="([^"]*)"[^>]*>', r.text):
    v = m.group(1)
    if v and len(v) < 30:
        print("  option:", v)
print("Details links:", len(re.findall(r"/Details/\d+/", r.text)))
