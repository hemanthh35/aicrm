from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
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


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf"
OUTPUT.mkdir(parents=True, exist_ok=True)

CREAM = colors.HexColor("#FBFAF2")
IVORY = colors.HexColor("#FFFDF6")
DARK_GREEN = colors.HexColor("#153F2E")
FRESH_GREEN = colors.HexColor("#2F8A4B")
LIME = colors.HexColor("#C6FF1A")
SOFT_GREEN = colors.HexColor("#EAF3E6")
MUTED = colors.HexColor("#617367")
BORDER = colors.HexColor("#D7E3D4")
AMBER = colors.HexColor("#A96A17")


def styles():
    base = getSampleStyleSheet()
    return {
        "eyebrow": ParagraphStyle(
            "eyebrow", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8.5,
            leading=11, textColor=FRESH_GREEN, tracking=1.8, spaceAfter=8,
        ),
        "cover_title": ParagraphStyle(
            "cover_title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=31,
            leading=35, textColor=DARK_GREEN, spaceAfter=12,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle", parent=base["Normal"], fontName="Helvetica", fontSize=12.5,
            leading=18, textColor=MUTED, spaceAfter=18,
        ),
        "h1": ParagraphStyle(
            "h1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=22,
            leading=27, textColor=DARK_GREEN, spaceBefore=3, spaceAfter=12,
        ),
        "h2": ParagraphStyle(
            "h2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=13,
            leading=17, textColor=DARK_GREEN, spaceBefore=8, spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "body", parent=base["BodyText"], fontName="Helvetica", fontSize=10,
            leading=15, textColor=DARK_GREEN, spaceAfter=7,
        ),
        "small": ParagraphStyle(
            "small", parent=base["BodyText"], fontName="Helvetica", fontSize=8.5,
            leading=12, textColor=MUTED, spaceAfter=4,
        ),
        "card_title": ParagraphStyle(
            "card_title", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=11,
            leading=14, textColor=DARK_GREEN, spaceAfter=4,
        ),
        "card_body": ParagraphStyle(
            "card_body", parent=base["BodyText"], fontName="Helvetica", fontSize=8.7,
            leading=12.5, textColor=DARK_GREEN,
        ),
        "table_head": ParagraphStyle(
            "table_head", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8.3,
            leading=11, textColor=IVORY,
        ),
        "table_body": ParagraphStyle(
            "table_body", parent=base["Normal"], fontName="Helvetica", fontSize=8.3,
            leading=11.5, textColor=DARK_GREEN,
        ),
        "quote": ParagraphStyle(
            "quote", parent=base["Normal"], fontName="Helvetica-BoldOblique", fontSize=11,
            leading=16, textColor=DARK_GREEN, alignment=TA_LEFT,
        ),
        "footer": ParagraphStyle(
            "footer", parent=base["Normal"], fontName="Helvetica", fontSize=7.5,
            leading=9, textColor=MUTED,
        ),
    }


def P(text, style):
    return Paragraph(text, style)


def card(title, body, s, accent=SOFT_GREEN):
    table = Table([[P(title, s["card_title"])], [P(body, s["card_body"])]], colWidths=[55 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), IVORY),
        ("BACKGROUND", (0, 0), (-1, 0), accent),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 10),
    ]))
    return table


def callout(label, text, s, background=SOFT_GREEN, label_color=FRESH_GREEN):
    label_style = ParagraphStyle("callout_label", parent=s["eyebrow"], textColor=label_color, spaceAfter=4)
    table = Table([[P(label.upper(), label_style)], [P(text, s["body"])]], colWidths=[171 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 13),
        ("RIGHTPADDING", (0, 0), (-1, -1), 13),
        ("TOPPADDING", (0, 0), (-1, 0), 11),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
        ("TOPPADDING", (0, 1), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 11),
    ]))
    return table


def guide_header_footer(canvas, doc, brand, descriptor):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(LIME)
    canvas.rect(0, height - 8 * mm, width, 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(DARK_GREEN)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(18 * mm, height - 5.4 * mm, brand)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(width - 18 * mm, height - 5.4 * mm, descriptor)
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(18 * mm, 8.5 * mm, "Prepared for the in-product assistant knowledge base")
    canvas.drawRightString(width - 18 * mm, 8.5 * mm, f"{doc.page:02d}")
    canvas.restoreState()


def build_pdf(path, brand, descriptor, title, subtitle, cover_note, sections, table_rows, closing):
    s = styles()
    doc = BaseDocTemplate(
        str(path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=23 * mm, bottomMargin=22 * mm, title=title, author=brand,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="guide", frames=frame, onPage=lambda c, d: guide_header_footer(c, d, brand, descriptor))])

    story = [
        Spacer(1, 18 * mm),
        P(descriptor.upper(), s["eyebrow"]),
        P(title, s["cover_title"]),
        P(subtitle, s["cover_subtitle"]),
        callout("A practical reference", cover_note, s, background=LIME, label_color=DARK_GREEN),
        Spacer(1, 12 * mm),
        P("Inside this guide", s["h2"]),
        Table([
            [card(a, b, s, accent=SOFT_GREEN if index % 2 == 0 else colors.HexColor("#F1F5DD")) for index, (a, b, _) in enumerate(sections[:3])],
            [card(a, b, s, accent=SOFT_GREEN if index % 2 == 0 else colors.HexColor("#F1F5DD")) for index, (a, b, _) in enumerate(sections[3:6])],
        ], colWidths=[57 * mm, 57 * mm, 57 * mm], hAlign="LEFT", style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])),
        Spacer(1, 8 * mm),
        callout("How to use it", "Ask the assistant a focused question. It should use this guide as supporting context, explain uncertainty when information is missing, and direct you to the relevant support or field expert when a decision needs verification.", s),
        PageBreak(),
    ]

    for section_index, (heading, intro, bullets) in enumerate(sections):
        story.append(P(f"{section_index + 1:02d}  {heading}", s["h1"]))
        story.append(P(intro, s["body"]))
        bullet_rows = []
        for item in bullets:
            bullet_rows.append([P("•", s["h2"]), P(item, s["body"])])
        bullet_table = Table(bullet_rows, colWidths=[8 * mm, 163 * mm], hAlign="LEFT")
        bullet_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(bullet_table)
        if section_index == 2:
            story.append(Spacer(1, 5 * mm))
            story.append(P("Quick reference", s["h2"]))
            data = [[P("TOPIC", s["table_head"]), P("GUIDANCE", s["table_head"])] ]
            data += [[P(topic, s["table_body"]), P(guidance, s["table_body"])] for topic, guidance in table_rows]
            table = Table(data, colWidths=[45 * mm, 126 * mm], repeatRows=1)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), DARK_GREEN),
                ("BACKGROUND", (0, 1), (-1, -1), IVORY),
                ("GRID", (0, 0), (-1, -1), 0.45, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]))
            story.append(table)
        if section_index in (1, 3):
            story.append(Spacer(1, 5 * mm))
            story.append(callout("Assistant note", closing[section_index // 2], s, background=SOFT_GREEN))
        if section_index == 2:
            story.append(PageBreak())

    story.append(Spacer(1, 5 * mm))
    story.append(callout("Important", closing[-1], s, background=colors.HexColor("#FFF2D8"), label_color=AMBER))
    doc.build(story)


def main():
    techkart_sections = [
        ("Choose with confidence", "Use the customer’s workflow, budget, and priorities as the starting point—not only the headline specification.", [
            "For laptops, compare processor generation, memory, storage, display, battery expectations, and warranty coverage together.",
            "For phones and tablets, ask about the operating system, screen size, camera needs, storage, charging, and long-term software support.",
            "For audio and accessories, check device compatibility, connection type, included items, and return or warranty information shown on the product page.",
        ]),
        ("Orders and delivery", "Keep order questions grounded in the signed-in customer’s order history and the latest order status.", [
            "For an order-status question, confirm the order number when there is more than one recent order and report only the status shown in the account.",
            "If an order is delayed, explain the current status and recommend opening a support ticket with the order number rather than promising a new delivery date.",
            "For damaged, missing, or incorrect items, ask the customer to keep the packaging and provide clear photos if support requests them.",
        ]),
        ("Warranty and support", "Product pages are the source of truth for model-specific warranty information; the assistant should not invent coverage.", [
            "Seeded TechKart laptops list a 1 Year Manufacturer Warranty. Manufacturer warranty normally covers eligible hardware defects, subject to the brand terms.",
            "Accidental damage, liquid damage, normal wear, and unauthorized repair may be excluded. The exact brand warranty terms control.",
            "For a warranty claim, keep the invoice and order number ready and create a support ticket with a clear description of the issue.",
        ]),
        ("Compare before buying", "A useful comparison explains trade-offs in plain language and recommends the better fit for the stated use case.", [
            "For creative work, prioritize sustained performance, display quality, memory, storage, and reliable ports over a single benchmark number.",
            "For study and everyday work, battery life, keyboard comfort, weight, service access, and total cost may matter more than peak performance.",
            "If the user has not given a budget or use case, ask one concise follow-up question before making a narrow recommendation.",
        ]),
        ("Payments, returns, and safety", "Keep payment and account guidance clear, cautious, and limited to supported product flows.", [
            "Never ask for a password, full card number, one-time password, or private authentication code in chat.",
            "If payment was deducted but an order is missing, advise checking the order history and opening support with the payment reference; do not claim a refund is complete without system confirmation.",
            "Return or cancellation eligibility depends on the order and policy shown in the product or support flow. Escalate when the policy is unclear.",
        ]),
        ("A better assistant answer", "Every answer should be specific, transparent, and useful for the next action.", [
            "State what is known from the account, product record, or guide; separate it from a general suggestion.",
            "Offer one or two relevant next steps instead of a long generic list.",
            "When a fact is missing or the issue is account-sensitive, say so and guide the customer to support.",
        ]),
    ]
    build_pdf(
        OUTPUT / "TechKart-Customer-Guide.pdf",
        "TechKart", "SIGNAL / CUSTOMER GUIDE", "A calmer way to choose tech", "Buying guidance, order support, and warranty context for the TechKart assistant.",
        "This guide gives the assistant reliable, customer-friendly context for product discovery, comparisons, orders, and support. It is designed to complement live account and product data.",
        techkart_sections,
        [("Laptop choice", "Start with workflow, budget, memory, storage, display, and warranty—not only the processor."), ("Order help", "Use the signed-in order record and order number; never invent a delivery update."), ("Warranty", "Use the product page and manufacturer terms; seeded laptops list a 1 Year Manufacturer Warranty."), ("Privacy", "Never request passwords, card numbers, OTPs, or private authentication codes."), ("Escalation", "Create a support ticket when account data, policy, or eligibility needs verification.")],
        ["For product recommendations, ask about the user’s actual workflow before narrowing to one model.", "For warranty questions, explain the likely coverage and clearly point back to the manufacturer terms.", "A confident answer is not the same as a guaranteed outcome. Keep live order and policy facts separate from general guidance.", "This is an assistant reference, not a legal warranty statement. Current product, order, and manufacturer terms always take priority."],
    )

    agrimart_sections = [
        ("Plan the crop", "Good field decisions begin with the crop, variety, soil, season, water access, and local conditions.", [
            "Before buying seed, confirm the crop, intended sowing window, local suitability, pack size, and the variety shown on the product listing.",
            "Record sowing date, plot or area, variety, irrigation source, and recent weather so later guidance has useful context.",
            "A product recommendation should explain why the item fits the stated crop need and should not replace local agronomist advice.",
        ]),
        ("Water and irrigation", "Irrigation should respond to soil moisture, weather, crop stage, soil type, and drainage—not to a fixed schedule alone.", [
            "Check soil moisture before watering. Water near the soil line and prefer early morning when practical.",
            "After heavy rain, inspect drainage and avoid repeated watering while the root zone is saturated.",
            "Avoid keeping foliage wet overnight. Drip irrigation can help deliver water near the root zone while reducing leaf wetness.",
        ]),
        ("Pests and disease", "Photos can support observation, but they do not confirm a diagnosis by themselves.", [
            "Inspect both sides of leaves, note when symptoms started, and record whether the pattern is spreading across the plot.",
            "Remove severely affected plant material where practical and dispose of it safely to reduce spread.",
            "If symptoms spread quickly, the crop is declining, or the diagnosis is uncertain, contact a local agronomist or extension officer before treatment.",
        ]),
        ("Inputs and safe use", "Fertilizers and crop-protection products must be selected and used according to the local label and crop registration.", [
            "Use only products registered for the named crop and problem in the local jurisdiction.",
            "Follow the product label exactly. Do not invent a dose, mix chemicals, or apply a product off-label based only on AI advice.",
            "Wear the protective equipment listed on the label, keep products away from children and animals, and follow storage and disposal instructions.",
        ]),
        ("Shop and order support", "AgriMart product and order help should stay connected to the farmer’s selected domain and account data.", [
            "For seeds, fertilizers, tools, irrigation, or pest-control products, use the current product record for price, stock, and description.",
            "For a delayed, damaged, or incorrect delivery, keep the package and order details ready and open a support ticket.",
            "If a product is unavailable, explain the constraint and offer a comparable category-level alternative only when the farmer’s crop need is clear.",
        ]),
        ("When to get help", "The assistant should be helpful without presenting itself as a licensed agronomist or prescriber.", [
            "Ask a local agronomist when the crop is rapidly declining, the diagnosis is uncertain, or treatment could affect food safety or neighboring fields.",
            "Keep notes on symptoms, dates, weather, irrigation, and any products already applied to help an expert review the situation.",
            "Use the assistant for structured observations, safe next steps, and product context—not for made-up chemical recipes.",
        ]),
    ]
    build_pdf(
        OUTPUT / "AgriMart-Field-Guide.pdf",
        "AgriMart", "FIELD / FARMER GUIDE", "Practical guidance for better field decisions", "Crop planning, irrigation, crop-health observations, and safer input choices for the AgriMart assistant.",
        "This guide gives the assistant grounded, safety-first agriculture context. It supports farmer questions while keeping diagnosis, dosage, and treatment decisions with local experts and product labels.",
        agrimart_sections,
        [("Irrigation", "Check soil moisture, water near the soil line, prefer early morning, and adjust for rain, soil, and crop stage."), ("Disease", "Observe both leaf sides, record timing and spread, and do not treat a photo as a confirmed diagnosis."), ("Inputs", "Use locally registered products and follow the label; never invent a dose or mix chemicals."), ("Orders", "Use current stock, price, and order records; escalate delivery or eligibility issues through support."), ("Expert help", "Escalate fast-spreading or uncertain problems to a local agronomist or extension officer.")],
        ["For crop guidance, ask for crop, growth stage, symptoms, timing, weather, and irrigation context when available.", "For input questions, give safety-first information and direct the farmer to the locally registered label.", "For disease questions, describe observations and uncertainty instead of presenting an unconfirmed diagnosis.", "This guide is informational only. It is not a diagnosis, pesticide or fertilizer prescription, or substitute for local agronomist advice."],
    )


if __name__ == "__main__":
    main()
