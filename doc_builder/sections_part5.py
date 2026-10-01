from docx import Document
from docx.shared import Inches, Pt, RGBColor
from .styles import (
    add_heading_1, add_heading_2, add_heading_3,
    add_bullet, add_callout, format_table
)

def build_part5(doc: Document):
    # ---------------------------------------------------------
    # PHASE 21: COMPLETE 10-MINUTE SPOKEN PRESENTATION SCRIPT
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 21 — COMPLETE 10-MINUTE SPOKEN PRESENTATION SCRIPT")

    add_callout(
        doc,
        "This script is engineered for maximum judge impact, narrative momentum, and technical substance. "
        "Pay special attention to [EMPHASIZE] for deliberate vocal stress, [SHOW] for live UI demonstration, "
        "and [PAUSE] for rhythmic breathing and comprehension pauses.",
        title="10-MINUTE PRESENTATION DIRECTIVE",
        alert_type="info"
    )

    script_segments = [
        ("0:00 - 0:45 | HOOK & THE HIDDEN HEALTHCARE CRISIS",
         "Good morning, esteemed judges and the GE HealthCare Precision Care Challenge panel. [PAUSE]\n\n"
         "Imagine a family in Bengaluru rushing their elderly father to an emergency room for cardiac surgery. "
         "They believe they are financially safe because they have a ₹5 Lakh health insurance policy in their pocket. "
         "Three days later, at the discharge counter, they receive a catastrophic shock: the hospital bill is ₹4,20,000, "
         "but the insurer approves only ₹2,10,000. [EMPHASIZE] The family is forced to pay ₹2,10,000 out-of-pocket on the spot. [PAUSE]\n\n"
         "Why did this happen? It happened because of a single hidden clause: [EMPHASIZE] Proportionate Deduction triggered by exceeding a ₹3,000 daily room rent limit. "
         "In India today, over 65% of all out-of-pocket health expenditures are not caused by a lack of insurance, but by [EMPHASIZE] information asymmetry at the moment of admission."),

        ("0:45 - 1:30 | WHY EXISTING PLATFORMS FAIL",
         "When patients search for hospitals today, they use platforms like Google Maps or Practo. "
         "These are great directories, but they are [EMPHASIZE] completely blind to insurance. [PAUSE] "
         "They show hospital ratings and addresses, but they cannot tell you whether your insurer has an active cashless network tie-up, "
         "whether your room rent cap will disallow doctor fees, or what your true out-of-pocket expense will be. [PAUSE]\n\n"
         "On the other hand, insurer portals are static PDF lists of 10,000 empanelled facilities with zero cost transparency or clinical guidance."),

        ("1:30 - 2:15 | INTRODUCING SEHATSURE",
         "To solve this systemic healthcare challenge, we built [EMPHASIZE] SehatSure: "
         "an AI-powered, insurance-aware healthcare decision-support engine. [SHOW: Homepage on screen]\n\n"
         "SehatSure converts complex, 40-page insurance policy fine print into structured, computable constraints. "
         "It indexes over 54,000 healthcare facilities across India, pairs them with empirical procedure cost benchmarks, "
         "and computes a multi-attribute [EMPHASIZE] Policy Fit Score. "
         "Most importantly, it provides active lifecycle guidance throughout hospitalization to eliminate surprise deductions."),

        ("2:15 - 3:15 | END-TO-END PATIENT WORKFLOW",
         "Let's trace how a patient interacts with SehatSure. [SHOW: UploadPage]\n\n"
         "The user begins by uploading their health insurance policy PDF or selecting a reference scheme. "
         "Our dual-model extraction pipeline immediately decodes the document into structured parameters: "
         "Sum Insured, Room Rent Limits, Co-pays, Sub-limits, and Excluded Departments. [SHOW: CoverageSummaryPage]\n\n"
         "Notice our commitment to patient safety: [EMPHASIZE] every single extracted value has a Data Provenance badge. "
         "Clicking a badge reveals the exact source sentence from the PDF. [SHOW: Snippet modal] "
         "We require a human-in-the-loop confirmation before running our recommendation algorithms."),

        ("3:15 - 4:30 | TECHNICAL ARCHITECTURE & DATA ENGINE",
         "Under the hood, SehatSure is built on a high-performance full-stack architecture. [PAUSE]\n\n"
         "Our backend runs Node.js and Express in TypeScript. "
         "Our dataset indexes over [EMPHASIZE] 54,000 hospitals and thousands of procedure cost records. "
         "To run efficiently on resource-constrained cloud servers without out-of-memory crashes, "
         "we engineered a custom readline streaming parser with a string interning pool. "
         "This collapses duplicate city and insurer strings, keeping our heap memory strictly under 150MB while executing complex multi-filter searches in [EMPHASIZE] under 5 milliseconds.\n\n"
         "For database resilience, if remote MongoDB Atlas is unreachable, the server automatically boots an embedded in-memory MongoDB instance to ensure 100% demo uptime."),

        ("4:30 - 5:45 | MULTI-ATTRIBUTE DECISION RADAR & RANKING",
         "How do we rank hospitals? We refuse to simply sort by the cheapest price. [SHOW: HospitalDiscoveryPage]\n\n"
         "A cheap hospital with no cashless tie-up or an incompetent clinical department is a disaster for a patient. "
         "Instead, SehatSure computes the [EMPHASIZE] Policy Fit Score based on four distinct pillars: [SHOW: ScoreBreakdownModal]\n\n"
         "1. [EMPHASIZE] Coverage Fit (50% weight): Measures how much of the bill is absorbed by insurance, penalizing non-network status and room rent breaches.\n"
         "2. [EMPHASIZE] Patient Cost Fit (25% weight): Bounds out-of-pocket expense against policy Sum Insured.\n"
         "3. [EMPHASIZE] Hospital Type & Stature (15% weight): Evaluates institutional trust and empanelment depth.\n"
         "4. [EMPHASIZE] Clinical Capability & Co-pay Predictability (10% weight).\n\n"
         "This Decision Radar gives the patient an objective, explainable score of true compatibility."),

        ("5:45 - 6:45 | THE FINANCIAL BILLING & DOWNGRADE ADVISOR",
         "Let's look at the financial impact. [SHOW: BillBreakdownModal]\n\n"
         "When a patient selects a hospital and procedure, our engine calculates the itemized bill: "
         "procedure charges, doctor fees at 20%, medicines at 10%, room tariff, and 5% non-medical consumables. [PAUSE]\n\n"
         "Watch what happens when the patient selects a Single Private Room that exceeds their ₹3,000 policy cap. "
         "The engine instantly calculates the ₹30,000 [EMPHASIZE] Proportionate Disallowance penalty. "
         "And right here, our AI Advisor offers actionable intelligence: [EMPHASIZE] 'Switching to Twin Sharing saves ₹36,000 out-of-pocket!' "
         "That single insight can protect a family's life savings."),

        ("6:45 - 7:45 | LIFECYCLE INPATIENT GUIDANCE",
         "The patient journey doesn't end at hospital selection. [SHOW: CareJourneyPage]\n\n"
         "Our Care Journey Guidance Engine tracks admission through discharge. "
         "Using our simulator, we can model real-world events: a room upgrade, a pre-auth delay, or interim billing. [SHOW: Event in simulator]\n\n"
         "The engine recalculates financial exposure in real time, generates alerts, and provides a 'Why Am I Seeing This?' breakdown explaining the exact policy clause governing the event."),

        ("7:45 - 8:45 | LOCALIZATION & PRECISION HEALTHCARE IN INDIA",
         "Because precision care must be inclusive, SehatSure features complete multilingual localization in English, Hindi, and [EMPHASIZE] Kannada, honoring the local linguistic community of Bengaluru and Karnataka where GE HealthCare's engineering hub thrives. [SHOW: Language switch]\n\n"
         "We also support statutory government schemes: Ayushman Bharat PM-JAY and ESI, automatically enforcing 100% cashless treatment rules without requiring private policy complexity."),

        ("8:45 - 9:30 | CYBERSECURITY, ETHICS & BOUNDARIES",
         "Let us be completely transparent about our ethical boundaries. [PAUSE]\n\n"
         "SehatSure is a clinical and financial decision-support tool. It does not replace a doctor, nor does it guarantee insurer claims adjudication. "
         "We protect patient data with scrypt password cryptography, isolated document stores, and strict Zod validation. "
         "Our cost numbers are explicitly disclosed as indicative benchmarks, and hospital network status is categorized with verified, unverified, and freshness metadata."),

        ("9:30 - 10:00 | CONCLUSION & CLOSING",
         "In conclusion, SehatSure transforms health insurance from a confusing, adversarial contract into a transparent, actionable compass for patients during their most vulnerable moments. [PAUSE]\n\n"
         "We combine precision AI extraction with deterministic, explainable healthcare mathematics to deliver true precision in patient admission. "
         "Thank you, and we welcome your questions. [PAUSE]")
    ]

    for title, text in script_segments:
        add_heading_2(doc, title)
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(8)
        # Parse runs for [EMPHASIZE], [SHOW], [PAUSE]
        parts = text.split("\n\n")
        for part in parts:
            p_para = doc.add_paragraph()
            p_para.paragraph_format.line_spacing = 1.15
            p_para.paragraph_format.space_after = Pt(6)
            tokens = part.split("[")
            for t_idx, token in enumerate(tokens):
                if t_idx == 0:
                    p_para.add_run(token)
                else:
                    sub = token.split("]")
                    tag = sub[0]
                    content = sub[1] if len(sub) > 1 else ""
                    if tag == "EMPHASIZE":
                        r = p_para.add_run("[EMPHASIZE] ")
                        r.bold = True
                        r.font.color.rgb = RGBColor(180, 83, 9)
                    elif tag.startswith("SHOW"):
                        r = p_para.add_run(f"[{tag}] ")
                        r.bold = True
                        r.font.color.rgb = RGBColor(29, 104, 189)
                    elif tag == "PAUSE":
                        r = p_para.add_run("[PAUSE] ")
                        r.bold = True
                        r.font.color.rgb = RGBColor(21, 128, 61)
                    p_para.add_run(content)

    # ---------------------------------------------------------
    # PHASE 22: MULTIPLE PITCH LENGTHS
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 22 — MULTI-LENGTH PITCH SUITE (20s TO 5m)")

    pitches = [
        ("20-Second Pitch (Elevator)",
         "SehatSure is an insurance-aware decision engine that turns 40-page health insurance policies into structured data, matches patients with optimal cashless hospitals across 54,000 facilities, and calculates true out-of-pocket costs to eliminate surprise bills at hospital discharge."),

        ("30-Second Pitch (Executive)",
         "In India, hospital admission is fraught with financial traps like room rent caps and proportionate deductions that leave families with huge unexpected bills. SehatSure solves this by using AI to decode policy constraints, searching 54,000 hospitals with a 4-pillar Policy Fit Score, and guiding patients through hospitalization with proactive alerts before financial disallowances occur."),

        ("1-Minute Pitch (Technical Panel)",
         "SehatSure bridges the gap between health insurance contracts and hospital admission. We use Gemini 3.1 Flash Lite with zero temperature and Zod validation to extract 25+ policy parameters into structured constraints. Our Node.js streaming engine queries 54,000 hospitals in under 5 milliseconds in RAM. We apply IRDAI billing mathematics to compute true out-of-pocket costs, evaluate proportionate deductions, verify 4-state network empanelment, and guide patients through a 5-stage care journey with deterministic policy auditing."),

        ("3-Minute Explanation (Booth Demonstration)",
         "Welcome to SehatSure. Let me demonstrate how we solve the greatest friction in Indian healthcare: the surprise hospital bill. Today, when a family needs surgery, they have no easy way to know if a hospital will accept their insurer cashless, or whether their ₹3,000 room cap will trigger a ₹30,000 deduction across doctor fees. Here on screen, we upload a policy or pick a demo contract like Star Health. Our AI extracts sum insured, room limits, and copays, complete with source snippets from the document. Once confirmed, we search over 54,000 hospitals in seconds. Notice our Policy Fit Score: it evaluates coverage fit, cost fit, institutional stature, and copay predictability. When we click 'Bill Breakdown', our engine shows the itemized procedure cost, room tariff, and warns the patient that a Single AC room will trigger a proportionate deduction penalty, advising them that switching to Twin Sharing saves ₹36,000. Finally, our Care Journey guidance follows them into the ward, alerting them to pre-auth windows and discharge checklists. It's comprehensive, transparent decision support for precision healthcare."),

        ("5-Minute Demo Narration",
         "Refer to Phase 19 for the exact 5-minute click-by-click booth demonstration sequence.")
    ]

    for p_title, p_content in pitches:
        add_heading_2(doc, p_title)
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(p_content)
        r.font.name = "Calibri"

    # ---------------------------------------------------------
    # PHASE 23: THE "WHY?" DEFENSE GUIDE
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 23 — THE 'WHY?' ARCHITECTURAL DEFENSE GUIDE")

    whys = [
        ("Why SehatSure?", "Because healthcare decision-making without insurance awareness is blind. Medical care and financial coverage are inextricably linked in India."),
        ("Why this architecture (Node/Express + React)?", "It delivers sub-5ms in-memory query performance, rapid prototyping agility, full TypeScript safety, and zero deployment friction on free cloud containers."),
        ("Why MongoDB with MongoMemoryServer fallback?", "Mongoose provides flexible document schemas for diverse insurance policies, while MongoMemoryServer ensures 100% demo resilience during network dropouts."),
        ("Why rule-based decision logic instead of an LLM for ranking?", "Because healthcare billing and claim calculations require 100% mathematical auditability, repeatability, and legal explainability."),
        ("Why PDF parsing instead of asking users to type numbers?", "Policyholders do not know their proportionate deduction clauses or sub-limits. Extracting directly from legal PDFs removes human error."),
        ("Why require user confirmation?", "Because in medical and financial applications, fully autonomous AI without human verification creates unacceptable liability risks.")
    ]

    for w_q, w_a in whys:
        add_heading_2(doc, w_q)
        add_bullet(doc, "Defensive Reasoning", w_a)

    # ---------------------------------------------------------
    # PHASE 24: TECHNICAL TRADE-OFFS MATRIX
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 24 — TECHNICAL TRADE-OFFS MATRIX")

    headers_trade = ["Decision Area", "Option A vs Option B", "What SehatSure Chose", "What We Gained", "What Was Sacrificed", "Production Path"]
    rows_trade = [
        ["Hospital Search", "Live DB queries vs In-memory streaming index", "In-memory streaming index", "Sub-5ms query latency, zero DB network lag", "Initial ~1.2s boot startup delay", "Redis distributed cache"],
        ["Scoring Engine", "Trained ML model vs Deterministic MCDA formula", "Deterministic MCDA formula (50/25/15/10)", "100% explainability, auditability, zero hallucinations", "Self-learning adaptive weight optimization", "Empirical regression tuning"],
        ["Cost Estimation", "Generative LLM price vs Dataset cost bounds", "Dataset cost bounds with deterministic hash jitter", "Realistic clinical cost bounds strictly between low and high benchmarks", "Dynamic hospital-specific negotiated rates", "Direct hospital TPA rate cards"],
        ["PDF Ingestion", "Autonomous one-click vs Human-in-the-loop confirmation", "Mandatory human confirmation", "Clinical safety, patient trust, legal protection", "One additional user click in onboarding", "Side-by-side interactive PDF viewer"]
    ]
    tbl_trade = doc.add_table(rows=1, cols=6)
    format_table(tbl_trade, [1.1, 1.3, 1.2, 1.2, 1.2, 1.0], headers_trade, rows_trade)

    # ---------------------------------------------------------
    # PHASE 25: HEALTHCARE & INSURANCE DEFENSIBILITY
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 25 — HEALTHCARE & INSURANCE DEFENSIBILITY")

    add_callout(
        doc,
        "Judges often probe ethical and clinical liability: 'Can patients rely on this?' 'Does this replace doctors?' "
        "Use these grounded, responsible answers. Never make reckless claims of medical advice.",
        title="ETHICAL & CLINICAL DEFENSE",
        alert_type="warning"
    )

    add_bullet(doc, "Can patients rely on this?", "Patients can rely on SehatSure as an informative decision-support guide to navigate policy limits and cost benchmarks. However, it does not issue binding legal guarantees or replace official TPA pre-authorization.")
    add_bullet(doc, "Can this replace a doctor or medical professional?", "Never. SehatSure provides zero diagnostic or clinical treatment recommendations. It advises purely on administrative, insurance, and billing optimization for treatments prescribed by licensed doctors.")
    add_bullet(doc, "Who is responsible if the policy parser makes an error?", "The platform features a prominent disclaimer and enforces a human-in-the-loop verification step where users review extracted terms before running hospital matching.")
    add_bullet(doc, "How do you handle medical emergencies?", "Our Care Journey Page features an explicit Emergency Mode toggle that instantly suppresses pre-auth warnings with clear clinical stabilization directives: 'Clinical stabilization supersedes financial optimization; intimate insurer within 24 hours.'")
