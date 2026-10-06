from PIL import Image, ImageDraw, ImageFont
from pathlib import Path


OUT = Path(__file__).resolve().parents[1] / "docs" / "images" / "KHUSHI_HYGIEIA_Key_Features.png"
OUT.parent.mkdir(parents=True, exist_ok=True)
W, H, S = 1920, 1080, 2
NAVY = "#0B1F33"
TEXT = "#172B3A"
MUTED = "#526474"
BLUE = "#1267A5"
BLUE_DARK = "#0D548D"
ROW_BLUE = "#EAF3FA"
ROW_WHITE = "#FFFFFF"
CHECK = "#2E8B68"
GRID = "#C6D6E2"
BG = "#F7FAFC"
WHITE = "#FFFFFF"
REGULAR = r"C:\Windows\Fonts\arial.ttf"
BOLD = r"C:\Windows\Fonts\arialbd.ttf"

canvas = Image.new("RGB", (W * S, H * S), BG)
draw = ImageDraw.Draw(canvas)


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REGULAR, size * S)


def text(x, y, value, size, fill=TEXT, bold=False, anchor=None):
    draw.text((x * S, y * S), value, font=font(size, bold), fill=fill, anchor=anchor)


def check(cx, cy, size=22):
    # Draw a crisp vector-style check so it is consistent at presentation scale.
    pts = [((cx - size * 0.45) * S, (cy + size * 0.00) * S),
           ((cx - size * 0.12) * S, (cy + size * 0.32) * S),
           ((cx + size * 0.52) * S, (cy - size * 0.42) * S)]
    draw.line(pts, fill=CHECK, width=6 * S, joint="curve")


def wrapped_lines(value, fnt, max_width):
    words, rows, row = value.split(), [], ""
    for word in words:
        trial = word if not row else row + " " + word
        if row and draw.textlength(trial, font=fnt) > max_width * S:
            rows.append(row)
            row = word
        else:
            row = trial
    if row:
        rows.append(row)
    return rows


rows = [
    ("AI Health Assistant & Symptom Triage", "Chat-based health guidance with a dedicated symptom checker."),
    ("Quantum Disease Intelligence", "Hybrid quantum/classical machine-learning risk analysis."),
    ("Hospital & Specialist Discovery", "Find hospitals, doctors and care recommendations."),
    ("Appointments & OPD Queues", "Book care, join digital queues and track visit status."),
    ("Teleconsultation", "Video consultations connect patients and clinicians."),
    ("Health Vault & Patient Records", "Access health documents, prescriptions and records."),
    ("Prescription OCR & Translation", "Scan prescriptions and get support in Hindi or Telugu."),
    ("Medication & Insurance Tools", "Organize medication plans, insurance policies and claims."),
    ("Community & Care Coordination", "Care Circle, patient community and clinical/admin portals."),
]

# Minimal title block for a standalone image, not a slide header.
text(60, 42, "KHUSHI HYGIEIA", 30, NAVY, True)
text(60, 83, "Key Website Features", 27, NAVY, True)
text(60, 122, "Patient, provider and administrator capabilities", 17, MUTED)

# Comparison-table structure inspired by the reference, using only project-specific facts.
x0, x1, x2, x3 = 60, 710, 1040, 1860
y0, header_h, row_h = 202, 82, 78
table_bottom = y0 + header_h + len(rows) * row_h

draw.rectangle((x0 * S, y0 * S, x3 * S, (y0 + header_h) * S), fill=BLUE)
text(x0 + 20, y0 + 28, "FEATURE / ASPECT", 20, WHITE, True)
text((x1 + x2) / 2, y0 + 41, "KHUSHI HYGIEIA", 20, WHITE, True, anchor="mm")
text(x2 + 20, y0 + 28, "WHAT THE WEBSITE PROVIDES", 20, WHITE, True)

for i, (feature, description) in enumerate(rows):
    top = y0 + header_h + i * row_h
    bottom = top + row_h
    fill = ROW_BLUE if i % 2 == 0 else ROW_WHITE
    draw.rectangle((x0 * S, top * S, x3 * S, bottom * S), fill=fill)
    text(x0 + 20, top + 25, feature, 19, NAVY, True)
    check((x1 + x2) / 2, top + row_h / 2, 22)
    desc_font = font(17)
    desc_rows = wrapped_lines(description, desc_font, x3 - x2 - 38)
    line_height = 23
    total_height = len(desc_rows) * line_height
    start_y = top + (row_h - total_height) / 2 + 1
    for j, line in enumerate(desc_rows):
        text(x2 + 20, start_y + j * line_height, line, 17, TEXT)
    draw.line((x0 * S, bottom * S, x3 * S, bottom * S), fill=GRID, width=1 * S)

# Thin technical table rules; no rounded cards or decorative badges.
draw.rectangle((x0 * S, y0 * S, x3 * S, table_bottom * S), outline=GRID, width=2 * S)
for x in (x1, x2):
    draw.line((x * S, y0 * S, x * S, table_bottom * S), fill=GRID, width=2 * S)

canvas = canvas.resize((W, H), Image.Resampling.LANCZOS)
canvas.save(OUT, format="PNG", optimize=True)
print(OUT)
