"""Turn brand type into SVG path data, so a reel can draw letters stroke by stroke.

    py -3.11 scripts/glyph-paths.py <out.json> "<text>[|italic]" ...

Reads the self-hosted Bodoni Moda (apps/web/public/fonts, OFL) at the display optical size
(opsz 96, wght 400, as the headlines are set), lays each text out on one line by advance widths,
and writes {text: {glyphs: [{d, x}], width, unitsPerEm, ascender}} in font units (y down).
Needs fontTools + brotli (py -3.11 -m pip install fonttools brotli).
"""

import json
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "apps/web/public/fonts"


def load(style: str) -> TTFont:
    f = TTFont(FONTS / f"bodoni-moda-{style}-latin.woff2")
    return instantiateVariableFont(f, {"wght": 400, "opsz": 96})


def layout(font: TTFont, text: str):
    cmap, gs = font.getBestCmap(), font.getGlyphSet()
    upm, asc = font["head"].unitsPerEm, font["hhea"].ascent
    x, out = 0, []
    for ch in text:
        name = cmap.get(ord(ch))
        if not name:
            continue
        g = gs[name]
        pen = SVGPathPen(gs)
        # flip y (font units are y up) and move the baseline to the ascender
        g.draw(TransformPen(pen, (1, 0, 0, -1, x, asc)))
        d = pen.getCommands()
        if d:
            out.append({"ch": ch, "d": d, "x": x, "w": g.width})
        x += g.width
    return {"glyphs": out, "width": x, "unitsPerEm": upm, "ascender": asc}


def main():
    out = Path(sys.argv[1])
    fonts = {}
    res = {}
    for spec in sys.argv[2:]:
        text, _, style = spec.partition("|")
        style = style or "normal"
        fonts.setdefault(style, load(style))
        res[spec] = layout(fonts[style], text)
        print(f"{spec!r}: {len(res[spec]['glyphs'])} glyphs, {res[spec]['width']} units wide")
    out.write_text(json.dumps(res), encoding="utf-8")


if __name__ == "__main__":
    main()
