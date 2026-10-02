#!/usr/bin/env python3
"""Build the article pages under /tips/ from tools/articles/src/*.md.

Shell: tips/index.html (head, header, nav, footer), so the CSP, fonts and
styles match. Each source: line 1 "title: ...", line 2 "description: ...",
a blank line, then Markdown starting with its H1. Run sct-site-qa.mjs after.

    python3 tools/articles/build.py
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).resolve().parent / "src"
SITE = "https://sunshinecoasttrail.app"
PAGES = ["bear-spray", "satellite-messenger"]


def build(slug: str) -> str:
    lines = (SRC / f"{slug}.md").read_text().split("\n")
    title, desc = lines[0][7:].strip(), lines[1][13:].strip()
    md = "\n".join(lines[3:]).strip()
    md = md.split("\n", 1)[1].strip()  # drop the H1; the header shows the title
    body = markdown.markdown(md)
    body = re.sub(r'<a href="(https?://[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', body)
    url = f"{SITE}/tips/{slug}/"
    t = (ROOT / "tips" / "index.html").read_text()
    head, rest = t.split("<main", 1)
    foot = "</main>" + rest.split("</main>", 1)[1]
    e = lambda s: html.escape(s, quote=True)
    head = re.sub(r"<title>.*?</title>", f"<title>{e(title)}</title>", head)
    for prop in ["description", "twitter:description"]:
        head = re.sub(rf'(<meta name="{prop}" content=")[^"]*', rf"\g<1>{e(desc)}", head)
    head = re.sub(r'(<meta property="og:description" content=")[^"]*', rf"\g<1>{e(desc)}", head)
    for prop in ["og:title"]:
        head = re.sub(rf'(<meta property="{prop}" content=")[^"]*', rf"\g<1>{e(title)}", head)
    head = re.sub(r'(<meta name="twitter:title" content=")[^"]*', rf"\g<1>{e(title)}", head)
    head = head.replace(f"{SITE}/tips/", url)
    # English only: no French alternate for these pages yet.
    head = re.sub(r'<link rel="alternate" hreflang="fr"[^>]*>\n', "", head)
    head = re.sub(r'<div class="lang-toggle".*?</div>\n', "", head, flags=re.S)
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": title, "description": desc,
          "author": {"@type": "Person", "name": "Leah Gerber"}, "datePublished": "2026-10-02", "dateModified": "2026-10-02",
          "image": f"{SITE}/og.png", "url": url, "about": {"@type": "Thing", "name": "Sunshine Coast Trail"}}
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
          {"@type": "ListItem", "position": 2, "name": "Trail notes", "item": f"{SITE}/tips/"},
          {"@type": "ListItem", "position": 3, "name": title, "item": url}]}
    head = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"Article".*?</script>',
                  lambda m: f'<script type="application/ld+json">{json.dumps(ld, separators=(",", ":"))}</script>', head, flags=re.S)
    head = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"BreadcrumbList".*?</script>',
                  lambda m: f'<script type="application/ld+json">{json.dumps(bc, separators=(",", ":"))}</script>', head, flags=re.S)
    head = re.sub(r"<h1>.*?</h1>", f"<h1>{e(title)}</h1>", head, flags=re.S)
    head = re.sub(r'<p class="tag">.*?</p>', f'<p class="tag">{e(desc)}</p>', head, flags=re.S)
    head = head.replace('href="../', 'href="../../').replace('<a href="./" aria-current="page">Trail notes</a>', '<a href="../">Trail notes</a>')
    foot = foot.replace('href="../', 'href="../../')
    # One <section> per heading, like tips/index.html: the site spaces and
    # sizes sections, not bare headings.
    parts = [p for p in re.split(r"(?=<h2>)", body) if p.strip()]
    sections = "".join(f"<section>\n{p.strip()}\n</section>\n\n" for p in parts)
    main = f'<main id="main">\n<div class="wrap">\n\n{sections}<section>\n<p><a href="../">More trail notes</a></p>\n</section>\n</div>\n'
    return head + main + foot


for slug in PAGES:
    d = ROOT / "tips" / slug
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(build(slug))
    print("wrote", f"tips/{slug}/index.html")
