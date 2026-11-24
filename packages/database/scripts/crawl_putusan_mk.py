import requests
import re
import json
import pymysql
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

def inspect_detail():
    url = "https://peraturan.go.id/putusan/putusan-mahkamah-konstitusi-no-168-puu-xxi-2023-tahun-2024"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    text = resp.text
    m_title = re.search(r"<title>(.*?)</title>", text, re.I)
    print("Page Title:", m_title.group(1).strip() if m_title else "None")
    
    # Check for metadata divs or text blocks
    labels = re.findall(r'<div[^>]*class=["\'][^"\']*(?:label|title|field)[^"\']*["\'][^>]*>(.*?)</div>', text, re.I)
    print("Labels:", [re.sub(r'<[^>]+>', '', l).strip() for l in labels[:6]])
    
    # Check for links or buttons
    pdfs = re.findall(r'href=["\']([^"\']+\.pdf[^"\']*)["\']', text, re.I)
    print("PDF links:", pdfs)
    
    # Print sample text chunks
    paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', text, re.I)
    print("Paragraphs count:", len(paragraphs))
    for p in paragraphs[:5]:
        p_clean = re.sub(r'<[^>]+>', '', p).strip()
        if p_clean:
            print("  P:", p_clean[:120])

if __name__ == "__main__":
    inspect_detail()
