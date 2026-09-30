#!/usr/bin/env python3
"""Generate PWA icons from cudd-logo.png (CUDD brand)."""
from PIL import Image, ImageDraw

APP_DIR = "/home/jason_guynes/preventive-maintenance-app"
SRC = f"{APP_DIR}/cudd-logo.png"
CUDD = (129, 47, 47)   # #812F2F brand maroon
BG = (129, 47, 47)
WHITE = (255, 255, 255)


def make(size, path, maskable=False):
    # base: solid brand background
    canvas = Image.new("RGBA", (size, size), BG + (255,))
    try:
        logo = Image.open(SRC).convert("RGBA")
        # fit logo within inner area (maskable needs ~80% safe zone)
        pad = int(size * (0.30 if maskable else 0.22))
        inner = size - pad * 2
        logo.thumbnail((inner, inner), Image.LANCZOS)
        # knock out transparency -> ensure on brand bg (logo already opaque)
        x = (size - logo.width) // 2
        y = (size - logo.height) // 2
        canvas.paste(logo, (x, y), logo)
    except Exception as e:
        # fallback: draw a bold "TMV" monogram
        d = ImageDraw.Draw(canvas)
        try:
            from PIL import ImageFont
            f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(size * 0.4))
        except Exception:
            f = ImageFont.load_default()
        txt = "TMV"
        bbox = d.textbbox((0, 0), txt, font=f)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text(((size - w) // 2 - bbox[0], (size - h) // 2 - bbox[1]), txt, font=f, fill=WHITE)
    canvas.save(path)
    print("wrote", path, canvas.size)


make(192, f"{APP_DIR}/icon-192.png")
make(512, f"{APP_DIR}/icon-512.png")
make(180, f"{APP_DIR}/apple-touch-icon.png")
# favicon as ico (multi-res)
try:
    fav = Image.open(SRC).convert("RGBA")
    fav.save(f"{APP_DIR}/favicon.ico", sizes=[(32, 32), (48, 48), (64, 64)])
    print("wrote favicon.ico")
except Exception as e:
    print("favicon skip", e)
