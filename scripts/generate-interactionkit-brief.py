from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "research-packs" / "interactionkit-advisor-brief.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

INK = colors.HexColor("#1D2A35")
DIM = colors.HexColor("#53626E")
TEAL = colors.HexColor("#0E6B66")
PALE = colors.HexColor("#EAF4F2")
WARM = colors.HexColor("#F7F3EB")
RULE = colors.HexColor("#D8DDD9")

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="Kicker",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=TEAL,
        spaceAfter=5,
        uppercase=True,
    )
)
styles.add(
    ParagraphStyle(
        name="TitleX",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=23,
        leading=27,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="Deck",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=DIM,
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="H2X",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        leading=15,
        textColor=INK,
        spaceBefore=8,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyX",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=12.4,
        textColor=DIM,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyBold",
        parent=styles["BodyX"],
        fontName="Helvetica-Bold",
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="Small", parent=styles["BodyX"], fontSize=7.5, leading=10, textColor=DIM
    )
)
styles.add(
    ParagraphStyle(
        name="Question",
        parent=styles["BodyX"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=INK,
        leftIndent=4 * mm,
        rightIndent=4 * mm,
        spaceBefore=3 * mm,
        spaceAfter=3 * mm,
    )
)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(DIM)
    canvas.drawString(
        18 * mm, 9 * mm, "Baixin Guo | InteractionKit research brief | 2 Aug 2026"
    )
    canvas.drawRightString(188 * mm, 9 * mm, f"{doc.page} / 2")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=18 * mm,
    rightMargin=18 * mm,
    topMargin=16 * mm,
    bottomMargin=18 * mm,
    title="InteractionKit research brief",
    author="Baixin Guo",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates(PageTemplate(id="brief", frames=[frame], onPage=footer))

story = [
    Paragraph("FLAGSHIP RESEARCH DIRECTION", styles["Kicker"]),
    Paragraph("InteractionKit", styles["TitleX"]),
    Paragraph(
        "Testing whether corrective interfaces must match how AI communication fails",
        styles["Deck"],
    ),
]

question = Table(
    [
        [
            Paragraph(
                "Does matching an evidence-based corrective interface to an AI answer's communication-failure family improve appropriate reliance relative to an equally formatted, truthful but failure-mismatched correction?",
                styles["Question"],
            )
        ]
    ],
    colWidths=[doc.width],
)
question.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, -1), PALE),
            ("BOX", (0, 0), (-1, -1), 0.8, TEAL),
            ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
        ]
    )
)
story += [question, Spacer(1, 4 * mm)]

story += [
    Paragraph("Why this project", styles["H2X"]),
    Paragraph(
        "AI advice can fail while sounding numerically precise or while omitting the conditions under which a recommendation applies. Existing uncertainty interfaces often ask whether adding confidence, evidence, or explanations helps on average. This project tests a narrower causal principle: corrective information should expose the information missing from the specific communication failure.",
        styles["BodyX"],
    ),
]

design_data = [
    [
        Paragraph("Failure family", styles["BodyBold"]),
        Paragraph("Unsupported numerical precision", styles["Small"]),
        Paragraph("Omitted decision boundary", styles["Small"]),
    ],
    [
        Paragraph("Corrective card", styles["BodyBold"]),
        Paragraph("Numerical warrant", styles["Small"]),
        Paragraph("Boundary condition", styles["Small"]),
    ],
    [
        Paragraph("Key contrast", styles["BodyBold"]),
        Paragraph("Failure-matched card", styles["Small"]),
        Paragraph("Truthful but failure-mismatched card", styles["Small"]),
    ],
]
design_table = Table(design_data, colWidths=[38 * mm, 67 * mm, 67 * mm])
design_table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (0, -1), WARM),
            ("GRID", (0, 0), (-1, -1), 0.5, RULE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ]
    )
)
story += [Paragraph("Causal structure", styles["H2X"]), design_table, Spacer(1, 3 * mm)]

story += [
    KeepTogether(
        [
            Paragraph("Planned design", styles["H2X"]),
            Paragraph(
                "Within participant: failure family x answer accuracy x displayed confidence x intervention type. Across scenarios: objective evidence support. Each participant completes 16 trials, including eight matched and eight mismatched corrections. The planned pool contains 24 independently grounded exercise-and-health scenarios.",
                styles["BodyX"],
            ),
            Paragraph(
                "Primary outcome: probability movement toward the correct final decision. Secondary confirmatory outcome: final decision accuracy. Participants and scenarios are treated as crossed sources of variation.",
                styles["BodyX"],
            ),
        ]
    )
]

story += [
    PageBreak(),
    Paragraph("EVIDENCE, GATES, AND FALSIFICATION", styles["Kicker"]),
    Paragraph("What exists - and what does not", styles["TitleX"]),
]

status_data = [
    [
        Paragraph("Verified now", styles["BodyBold"]),
        Paragraph("Not yet evidence", styles["BodyBold"]),
    ],
    [
        Paragraph(
            "Public v1.0.0 tag at commit 91bda82; three typed primitives; composition checks; generated schemas; structured JSONL; seven contract tests; TypeScript and production build; clean-install reproduction; frozen Study 2 design and simulation code.",
            styles["Small"],
        ),
        Paragraph(
            "No completed Study 2 scenarios or cards; no independent material ratings; no ethics approval or public registration; no participant data; no causal, construct-validity, cross-domain, or cross-lab result.",
            styles["Small"],
        ),
    ],
]
status_table = Table(status_data, colWidths=[86 * mm, 86 * mm])
status_table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), PALE),
            ("GRID", (0, 0), (-1, -1), 0.5, RULE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ]
    )
)
story += [
    status_table,
    Spacer(1, 3 * mm),
    Paragraph("Recruitment gates", styles["H2X"]),
]

for item in [
    "1. Independently adjudicate 24 scenarios and objective evidence support.",
    "2. Blind-code failure-family purity; remove mixed-failure variants.",
    "3. Pretest card relevance, leakage, length, credibility, and comprehension.",
    "4. Verify the seeded allocation, full-rank matrix, logging, and recovery path.",
    "5. Pass exact-schedule simulation: >=80% power plus Type I error, coverage, and wrong-sign gates.",
    "6. Obtain institutional ethics approval and freeze a public preregistration.",
]:
    story.append(Paragraph(item, styles["BodyX"]))

story += [
    Paragraph("Sample-size boundary", styles["H2X"]),
    Paragraph(
        "The frozen document uses 240 analyzable participants as a provisional target, not a licensed recruitment claim. It becomes binding only if the exact-schedule post-pilot simulation passes. If scenario heterogeneity is the binding constraint, adding participants alone is rejected; the scenario pool or manipulation must be redesigned.",
        styles["BodyX"],
    ),
]

falsification = Table(
    [
        [
            Paragraph(
                "FALSIFICATION: If failure-matched cards do not improve probability movement toward the correct decision relative to mismatched cards, the proposed failure-contingent interaction principle is not supported.",
                styles["Question"],
            )
        ]
    ],
    colWidths=[doc.width],
)
falsification.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, -1), WARM),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#A76A23")),
            ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
        ]
    )
)
story += [
    Spacer(1, 2 * mm),
    falsification,
    Spacer(1, 4 * mm),
    Paragraph(
        "Review path: maxguo.dev/research/building-trustworthy-ai/interactionkit/research-brief/  |  Code: github.com/GBX-Max1220/InteractionKit  |  Contact: gbx1220max@gmail.com",
        styles["Small"],
    ),
]

doc.build(story)
print(OUTPUT)
