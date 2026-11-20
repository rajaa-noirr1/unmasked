# Turns docs/presentation-script-ckb.md into a designed, right-to-left A4 PDF (Zain font embedded), using
# Microsoft Edge to print. Kurdish digits are drawn with Tahoma, because Zain draws ١٢٣ as Western digits.
# Run from the Why folder after editing the text:  python scripts/script-to-pdf.py
import base64, html, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.join(tempfile.gettempdir(), 'unmasked-script-pdf')
os.makedirs(HERE, exist_ok=True)
SRC = os.path.join(ROOT, 'docs', 'presentation-script-ckb.md')
OUT_HTML = os.path.join(HERE, 'script.html')
OUT_PDF = os.path.join(ROOT, 'docs', 'presentation-script-ckb.pdf')
FONTS = os.path.join(ROOT, 'client', 'node_modules')
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'


def font(rel):
    with open(os.path.join(FONTS, rel), 'rb') as f:
        return 'data:font/woff2;base64,' + base64.b64encode(f.read()).decode()

faces = ''
for w in (400, 700):
    for sub, rng in (('arabic', 'U+0600-065F, U+066A-06EF, U+06FA-06FF, U+0750-077F, U+08A0-08FF, U+200C-200E, U+FB50-FDFF, U+FE70-FEFF'), ('latin', 'U+0000-00FF, U+2000-206F, U+20AC')):
        faces += f"@font-face {{ font-family: 'Zain'; font-weight: {w}; src: url({font(f'@fontsource/zain/files/zain-{sub}-{w}-normal.woff2')}) format('woff2'); unicode-range: {rng}; }}\n"
faces += f"@font-face {{ font-family: 'Newsreader'; font-style: italic; font-weight: 200 800; src: url({font('@fontsource-variable/newsreader/files/newsreader-latin-standard-italic.woff2')}) format('woff2'); }}\n"


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'`([^`]+)`', lambda m: f'<bdi dir="ltr" class="ltr">{m.group(1)}</bdi>', s)
    def act(m):
        t = m.group(1).strip()
        if t == 'وەستان':
            return '<span class="pause">وەستان</span>'
        if t == 'کلیک':
            return '<span class="click">کلیک</span>'
        return f'<span class="act">{t}</span>'
    s = re.sub(r'\*\*\[([^\]]+)\]\*\*', act, s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    return s

lines = open(SRC, encoding='utf-8').read().split('\n')
out, para, items, rows = [], [], [], []
list_kind = None
title_done = False
intro = []

def flush():
    global para, items, list_kind, rows
    if para:
        out.append('<p>' + '<br>'.join(inline(x) for x in para) + '</p>')
        para = []
    if items:
        tag = 'ol' if list_kind == 'ol' else 'ul'
        out.append(f'<{tag}>' + ''.join(f'<li>{inline(x)}</li>' for x in items) + f'</{tag}>')
        items = []; list_kind = None
    if rows:
        head, body = rows[0], rows[1:]
        t = '<table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in head) + '</tr></thead><tbody>'
        for r in body:
            t += '<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>'
        out.append(t + '</tbody></table>')
        rows = []

section_count = 0
for raw in lines:
    line = raw.rstrip()
    if not title_done:
        if line.startswith('# '):
            t = line[2:]
            word, rest = t.split(':', 1)
            out.append(f'<header class="cover"><p class="wordmark" dir="ltr"><span class="un">Un</span>masked</p><h1>{inline(rest.strip())}</h1>')
            continue
        if line.startswith('## '):
            title_done = True
            out.append('<p class="names">' + inline(intro[0]) + '</p></header>')
            out.append('<div class="intro">' + ''.join(f'<p>{inline(x)}</p>' for x in intro[1:]) + '</div>')
        elif line:
            intro.append(line)
            continue
        else:
            continue
    if not line:
        flush(); continue
    if line.startswith('|'):
        cells = [c.strip() for c in line.strip('|').split('|')]
        if all(re.fullmatch(r'-+', c) for c in cells if c):
            continue
        rows.append(cells); continue
    if line.startswith('### '):
        flush(); out.append(f'<h3>{inline(line[4:])}</h3>'); continue
    if line.startswith('## '):
        flush()
        t = line[3:]
        m = re.match(r'سلایدی (\S+) — (.+?) \((.+)\)$', t)
        if m:
            out.append(f'<h2 class="slide"><span class="n">{m.group(1)}</span><span class="t">{inline(m.group(2))}</span><span class="time">{m.group(3)}</span></h2>')
        else:
            out.append(f'<h2>{inline(t)}</h2>')
        continue
    if line.startswith('# '):
        flush(); section_count += 1
        out.append(f'<h1 class="part">{inline(line[2:])}</h1>'); continue
    if line.startswith('> '):
        flush(); out.append(f'<blockquote>{inline(line[2:])}</blockquote>'); continue
    m = re.match(r'(\d+)\. (.+)', line)
    if m:
        if list_kind != 'ol': flush(); list_kind = 'ol'
        items.append(m.group(2)); continue
    if line.startswith('- '):
        if list_kind != 'ul': flush(); list_kind = 'ul'
        items.append(line[2:]); continue
    para.append(line)
flush()

css = faces + '''
@page { size: A4; margin: 17mm 17mm 19mm; @bottom-center { content: counter(page, arabic-indic); font-family: Tahoma, sans-serif; font-size: 11pt; color: #9a8b80; } }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; direction: rtl; font-family: 'Zain', Tahoma, sans-serif; font-size: 14pt; line-height: 1.75; color: #2a2124; background: #fff; }
.ltr { white-space: nowrap; font-family: Consolas, 'Cascadia Mono', monospace; font-size: 0.78em; background: #efe6d8; padding: 1px 6px; border-radius: 4px; color: #3b2f2a; unicode-bidi: isolate; }
b { font-weight: 700; color: #1a1214; }
.cover { background: #0b0809; color: #efe6dc; border-radius: 14px; padding: 34px 38px 30px; margin-bottom: 22px; }
.wordmark { font-family: 'Newsreader', Georgia, serif; font-style: italic; font-weight: 300; font-size: 46pt; line-height: 1; margin: 0; text-align: right; letter-spacing: -0.5pt; color: #efe6dc; }
.wordmark .un { color: #f0c25a; }
.cover h1 { font-weight: 700; font-size: 25pt; line-height: 1.4; margin: 16px 0 6px; color: #efe6dc; }
.cover .names { font-size: 14pt; color: #d8cec4; margin: 0; padding-top: 12px; border-top: 1px solid rgba(240, 194, 90, 0.45); }
.cover .ltr { background: rgba(239, 230, 220, 0.12); color: #efe6dc; }
.intro { background: #f3eadc; border-radius: 12px; padding: 14px 20px; margin: 0 0 18px; font-size: 13pt; }
.intro p { margin: 4px 0; }
h1.part { font-size: 24pt; font-weight: 700; margin: 0 0 14px; padding-bottom: 6px; border-bottom: 2px solid #c9962e; color: #1a1214; break-before: page; }
h2 { font-size: 17pt; font-weight: 700; margin: 26px 0 10px; color: #1a1214; break-after: avoid; }
h2.slide { display: flex; align-items: center; gap: 12px; padding-top: 14px; border-top: 1px solid #e3d6c3; }
h2.slide .n { flex: none; width: 34px; height: 34px; border-radius: 50%; background: #0b0809; color: #f0c25a; font-size: 14pt; display: flex; align-items: center; justify-content: center; line-height: 1; }
h2.slide .t { flex: 1; }
h2.slide .time { font-size: 12pt; font-weight: 400; color: #8a6418; background: #f3e6c9; border-radius: 999px; padding: 2px 12px; direction: ltr; }
h3 { font-size: 14.5pt; font-weight: 700; color: #8a6418; margin: 18px 0 6px; break-after: avoid; }
p { margin: 8px 0; }
blockquote { margin: 10px 0; padding: 4px 16px 4px 0; border-right: 3px solid #c9962e; font-size: 15pt; line-height: 1.8; color: #1f1719; break-inside: avoid; }
.act { font-size: 11.5pt; color: #6e4f12; background: #f3e3bd; border-radius: 6px; padding: 1px 8px; white-space: normal; }
.pause { font-size: 11pt; font-weight: 700; color: #a23440; border: 1px solid #e3a3aa; border-radius: 6px; padding: 0 7px; }
.click { font-size: 11pt; font-weight: 700; color: #2f4bb8; border: 1px solid #aebbea; border-radius: 6px; padding: 0 7px; }
table { width: 100%; border-collapse: collapse; font-size: 12pt; margin: 8px 0 14px; break-inside: avoid; }
th { background: #0b0809; color: #f0c25a; font-weight: 700; padding: 6px 8px; text-align: right; }
td { padding: 5px 8px; border-bottom: 1px solid #e6dac8; }
tr:nth-child(even) td { background: #f5eee3; }
ol, ul { margin: 8px 0; padding-right: 24px; }
ol { list-style: arabic-indic; }
li::marker { font-family: Tahoma, sans-serif; }
li { margin: 6px 0; }
'''

page = f'<!doctype html><html lang="ckb" dir="rtl"><head><meta charset="utf-8"><title>Unmasked · دەقی پێشکەشکردن</title><style>{css}</style></head><body>{"".join(out)}</body></html>'
open(OUT_HTML, 'w', encoding='utf-8').write(page)
print('html', len(page))

profile = os.path.join(HERE, 'edge-profile')
subprocess.run([EDGE, '--headless=new', '--disable-gpu', f'--user-data-dir={profile}', '--no-pdf-header-footer', '--print-to-pdf-no-header',
                f'--print-to-pdf={OUT_PDF}', 'file:///' + OUT_HTML.replace('\\', '/')], check=True, timeout=120)
print('pdf', os.path.getsize(OUT_PDF))
