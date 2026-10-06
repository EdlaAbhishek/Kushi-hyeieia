from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math


OUT = Path(__file__).resolve().parents[1] / "docs" / "images" / "KHUSHI_HYGIEIA_Technical_Approach.png"
OUT.parent.mkdir(parents=True, exist_ok=True)
W, H, S = 1920, 1080, 2
NAVY = "#0B1F33"
TEXT = "#172B3A"
MUTED = "#42566A"
LINE = "#243B53"
BOUNDARY = "#718096"
BLUE = "#EAF3FA"
FRONT = "#EEF2F5"
GREEN = "#EAF5EE"
YELLOW = "#FFF6DD"
PURPLE = "#F1ECF8"
PINK = "#F9EDEF"
WHITE = "#FFFFFF"
BORDER = "#243B53"

REGULAR = r"C:\Windows\Fonts\arial.ttf"
BOLD = r"C:\Windows\Fonts\arialbd.ttf"

canvas = Image.new("RGB", (W * S, H * S), WHITE)
draw = ImageDraw.Draw(canvas)


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REGULAR, size * S)


def line(points, fill=LINE, width=2, dash=False):
    pts = [(int(x * S), int(y * S)) for x, y in points]
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy)
        if not dash:
            draw.line((x1, y1, x2, y2), fill=fill, width=width * S)
            continue
        ux, uy = dx / max(length, 1), dy / max(length, 1)
        step, pos = 11 * S, 0
        while pos < length:
            end = min(pos + 6 * S, length)
            draw.line((x1 + ux * pos, y1 + uy * pos,
                       x1 + ux * end, y1 + uy * end), fill=fill, width=width * S)
            pos += step


def arrowhead(tip, previous, fill=LINE, size=11):
    tx, ty = tip[0] * S, tip[1] * S
    px, py = previous[0] * S, previous[1] * S
    vx, vy = tx - px, ty - py
    length = math.hypot(vx, vy) or 1
    ux, uy = vx / length, vy / length
    bx, by = tx - ux * size * S, ty - uy * size * S
    perp_x, perp_y = -uy, ux
    points = [
        (tx, ty),
        (bx + perp_x * size * 0.50 * S, by + perp_y * size * 0.50 * S),
        (bx - perp_x * size * 0.50 * S, by - perp_y * size * 0.50 * S),
    ]
    draw.polygon(points, fill=fill)


def arrow(points, fill=LINE, width=3, dash=False, start=False):
    line(points, fill=fill, width=width, dash=dash)
    arrowhead(points[-1], points[-2], fill=fill)
    if start:
        arrowhead(points[0], points[1], fill=fill)


def text(x, y, value, size=18, fill=TEXT, bold=False, anchor=None):
    draw.text((int(x * S), int(y * S)), value, font=font(size, bold), fill=fill, anchor=anchor)


def text_width(value, fnt):
    return draw.textlength(value, font=fnt) / S


def wrap(value, fnt, max_width):
    words = value.split()
    result, row = [], ""
    for word in words:
        trial = word if not row else row + " " + word
        if row and text_width(trial, fnt) > max_width:
            result.append(row)
            row = word
        else:
            row = trial
    if row:
        result.append(row)
    return result


def bullet_list(x, y, width, items, size=17, gap=13, color=TEXT):
    fnt = font(size)
    row_y = y
    for item in items:
        rows = wrap(item, fnt, width - 19)
        draw.ellipse((int(x * S), int((row_y + 8) * S), int((x + 6) * S), int((row_y + 14) * S)), fill=LINE)
        for i, row in enumerate(rows):
            text(x + 16, row_y + i * (size + 6), row, size=size, fill=color)
        row_y += max(size + 16, len(rows) * (size + 6) + 11) + gap
    return row_y


def section_box(x, y, w, h, title, fill, items, body_size=17, title_size=20):
    draw.rounded_rectangle((x * S, y * S, (x + w) * S, (y + h) * S), radius=4 * S,
                           fill=fill, outline=BORDER, width=2 * S)
    text(x + 18, y + 16, title, size=title_size, fill=NAVY, bold=True)
    draw.line(((x + 18) * S, (y + 51) * S, (x + w - 18) * S, (y + 51) * S), fill="#9AAABD", width=1 * S)
    bullet_list(x + 19, y + 69, w - 38, items, size=body_size, gap=7)


def database_box(x, y, w, h, title, items):
    e = 28
    # A single recognizable database cylinder with a flat, lightly tinted fill.
    draw.rectangle((x * S, (y + e / 2) * S, (x + w) * S, (y + h - e / 2) * S), fill=PURPLE)
    draw.rectangle((x * S, (y + e / 2) * S, (x + w) * S, (y + h - e / 2) * S), outline=BORDER, width=2 * S)
    draw.ellipse((x * S, y * S, (x + w) * S, (y + e) * S), fill=PURPLE, outline=BORDER, width=2 * S)
    draw.arc((x * S, (y + h - e) * S, (x + w) * S, (y + h) * S), 0, 180, fill=BORDER, width=2 * S)
    draw.line((x * S, (y + h - e / 2) * S, x * S, (y + e / 2) * S), fill=BORDER, width=2 * S)
    draw.line(((x + w) * S, (y + h - e / 2) * S, (x + w) * S, (y + e / 2) * S), fill=BORDER, width=2 * S)
    text(x + 22, y + 43, title, size=20, fill=NAVY, bold=True)
    draw.line(((x + 22) * S, (y + 77) * S, (x + w - 22) * S, (y + 77) * S), fill="#9AAABD", width=1 * S)
    bullet_list(x + 23, y + 94, w - 46, items, size=17, gap=5)


# Page frame and restrained title block
draw.rectangle((5 * S, 5 * S, (W - 5) * S, (H - 5) * S), outline="#52779C", width=3 * S)
text(58, 45, "KHUSHI HYGIEIA", size=34, fill=NAVY, bold=True)
text(58, 91, "Technical Approach", size=27, fill=NAVY, bold=True)
text(58, 128, "High-Level System Architecture", size=18, fill=MUTED)
draw.line((58 * S, 174 * S, 1860 * S, 174 * S), fill="#CAD5DF", width=2 * S)

# Deployment boundary: the SPA, API routes, and processing modules are deployed together on Vercel.
line([(315, 253), (1432, 253), (1432, 700), (315, 700), (315, 253)], fill=BOUNDARY, width=1, dash=True)
draw.rectangle((338 * S, 239 * S, 695 * S, 262 * S), fill=WHITE)
text(345, 238, "KHUSHI HYGIEIA  |  VERCEL DEPLOYMENT", size=14, fill=MUTED, bold=True)

# Direct client-to-data-platform access is drawn above the main component row.
fe_center, db_center = 472, 1675
line([(fe_center, 337), (fe_center, 296), (db_center, 296), (db_center, 337)], fill=LINE, width=2)
arrowhead((fe_center, 337), (fe_center, 296), fill=LINE, size=10)
arrowhead((db_center, 337), (db_center, 296), fill=LINE, size=10)
label = "SUPABASE CLIENT: AUTH  •  HEALTH DATA  •  FILES  •  REALTIME"
f_label = font(14, True)
label_w = text_width(label, f_label)
draw.rectangle(((960 - label_w / 2 - 8) * S, 278 * S, (960 + label_w / 2 + 8) * S, 298 * S), fill=WHITE)
text(960, 278, label, size=14, fill=LINE, bold=True, anchor="mt")

# Primary system components
section_box(55, 337, 225, 280, "USERS", BLUE, [
    "Patients & families",
    "Healthcare professionals",
    "Administrators",
], body_size=17, title_size=20)

section_box(335, 337, 275, 280, "WEB FRONTEND", FRONT, [
    "React single-page app (Vite)",
    "Patient, doctor & admin portals",
    "Care, search & appointments",
    "Health records and services",
    "AI + quantum features",
], body_size=16, title_size=20)

section_box(690, 337, 315, 280, "APPLICATION SERVER", GREEN, [
    "Vercel serverless /api functions",
    "Request and health-service logic",
    "Hospital & prescription routes",
    "Quantum analysis pipeline",
], body_size=16, title_size=19)

section_box(1080, 337, 335, 280, "AI & PROCESSING", YELLOW, [
    "AI symptom triage & chat",
    "Prescription OCR + translation",
    "Hybrid quantum/classical ML",
    "Hospital recommendations",
], body_size=17, title_size=20)

database_box(1480, 337, 390, 280, "DATA & STORAGE", [
    "Supabase authentication",
    "Health & appointment records",
    "Storage for health documents",
    "Realtime sessions & updates",
])

# Main user/API flow. The API and processing boxes are separate logical modules within the Vercel deployment.
arrow([(280, 477), (335, 477)], width=3)
arrow([(610, 477), (690, 477)], width=3)
arrow([(1005, 477), (1080, 477)], width=3)

# External integration panel and request paths
draw.rounded_rectangle((330 * S, 795 * S, 1432 * S, 985 * S), radius=4 * S,
                       fill=PINK, outline=BORDER, width=2 * S)
text(352, 812, "EXTERNAL SERVICES", size=20, fill=NAVY, bold=True)
draw.line((352 * S, 847 * S, 1410 * S, 847 * S), fill="#9AAABD", width=1 * S)
draw.line((875 * S, 860 * S, 875 * S, 965 * S), fill="#D3C2C8", width=1 * S)
text(360, 865, "WEB CLIENT", size=14, fill=MUTED, bold=True)
text(360, 895, "PeerJS video calls", size=18, fill=TEXT)
text(360, 925, "Browser geolocation for hospital search", size=16, fill=TEXT)
text(905, 865, "AI PROVIDERS", size=14, fill=MUTED, bold=True)
text(905, 895, "OpenRouter", size=18, fill=TEXT)
text(905, 925, "Google Gemini fallback", size=16, fill=TEXT)

# Dashed dependency arrows rise from external providers to the relevant application modules.
arrow([(575, 795), (575, 675), (472, 675), (472, 617)], fill=LINE, width=2, dash=True)
arrow([(1125, 795), (1125, 675), (1247, 675), (1247, 617)], fill=LINE, width=2, dash=True)
text(481, 650, "video / location", size=13, fill=MUTED)
text(1134, 650, "model requests", size=13, fill=MUTED)

# Small legend clarifies the two connector styles.
line([(60, 1031), (115, 1031)], fill=LINE, width=3)
arrowhead((115, 1031), (105, 1031), fill=LINE, size=9)
text(126, 1020, "Application request / data flow", size=15, fill=MUTED)
line([(420, 1031), (475, 1031)], fill=LINE, width=2, dash=True)
arrowhead((475, 1031), (465, 1031), fill=LINE, size=9)
text(487, 1020, "External service dependency", size=15, fill=MUTED)

# Downsample for crisp antialiased output at the requested presentation resolution.
canvas = canvas.resize((W, H), Image.Resampling.LANCZOS)
canvas.save(OUT, format="PNG", optimize=True)
print(OUT)
