# Generates og-image.png (1200x630) for social sharing — brand gradient + leaf + AR/EN wordmark.
# Rendered at 2x then downscaled for crisp anti-aliasing.
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

S = 2  # supersampling
W, H = 1200 * S, 630 * S
GREEN_500 = (22, 179, 119)
GREEN_700 = (10, 122, 82)
GREEN_900 = (6, 78, 59)
WHITE = (255, 255, 255)
MINT = (228, 247, 238)

def ar(text):
    return get_display(arabic_reshaper.reshape(text))

def font(path, size):
    return ImageFont.truetype(path, size * S)

SEGOE_B = "C:/Windows/Fonts/segoeuib.ttf"
SEGOE   = "C:/Windows/Fonts/segoeui.ttf"

img = Image.new("RGB", (W, H), GREEN_700)
d = ImageDraw.Draw(img)

# diagonal gradient background
for y in range(H):
    t = y / H
    r = int(GREEN_500[0] * (1 - t) + GREEN_900[0] * t)
    g = int(GREEN_500[1] * (1 - t) + GREEN_900[1] * t)
    b = int(GREEN_500[2] * (1 - t) + GREEN_900[2] * t)
    d.line([(0, y), (W, y)], fill=(r, g, b))

# soft decorative circles
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.ellipse([W - 420 * S, -180 * S, W + 120 * S, 360 * S], fill=(255, 255, 255, 18))
od.ellipse([-160 * S, H - 320 * S, 280 * S, H + 120 * S], fill=(255, 255, 255, 14))
img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
d = ImageDraw.Draw(img)

# white badge with a leaf
cx, cy, R = 600 * S, 200 * S, 96 * S
d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=WHITE)
# leaf = rotated ellipse on its own layer
leaf = Image.new("RGBA", (200 * S, 200 * S), (0, 0, 0, 0))
ld = ImageDraw.Draw(leaf)
ld.ellipse([60 * S, 30 * S, 150 * S, 170 * S], fill=GREEN_500)
ld.line([(105 * S, 45 * S), (105 * S, 158 * S)], fill=GREEN_900, width=4 * S)
leaf = leaf.rotate(-45, resample=Image.BICUBIC, center=(105 * S, 100 * S))
img.paste(leaf, (int(cx - 105 * S), int(cy - 100 * S)), leaf)

# wordmarks
f_ar = font(SEGOE_B, 92)
f_en = font(SEGOE_B, 64)
f_sub = font(SEGOE, 34)

def center_text(y, text, fnt, fill):
    bb = d.textbbox((0, 0), text, font=fnt)
    w = bb[2] - bb[0]
    d.text(((W - w) / 2, y), text, font=fnt, fill=fill)

center_text(330 * S, ar("صِيام") + "   Siam", f_ar, WHITE)
center_text(450 * S, ar("رفيقك الذكي للصيام المتقطع"), f_sub, MINT)
center_text(505 * S, "Smart Intermittent Fasting · Plan · Meals · Workouts", f_sub, MINT)

img = img.resize((1200, 630), Image.LANCZOS)
img.save("og-image.png", "PNG", optimize=True)
print("wrote og-image.png", img.size)
