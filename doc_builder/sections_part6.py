from docx import Document
from docx.shared import Inches, Pt, RGBColor
from .styles import (
    add_heading_1, add_heading_2, add_heading_3,
    add_bullet, add_callout, format_table
)

def build_part6(doc: Document):
    # ---------------------------------------------------------
    # PHASE 26: DATA PROVENANCE & TRUST MATRIX
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 26 — DATA PROVENANCE & TRUST MATRIX")

    headers_prov = ["Displayed Value", "Underlying Source", "Mathematical Transformation", "Trust / Confidence", "Exact Phrasing to Use"]
    rows_prov = [
        ["Sum Insured", "Uploaded PDF via Gemini extraction or Demo JSON", "Sanitized integer in rupees via Zod", "AI-EXTRACTED or USER-CONFIRMED", "'Extracted from your policy schedule, confirmed by user.'"],
        ["Room Rent Limit", "Policy PDF clause (Table or text)", "Converted to daily rupee cap or % of SI", "AI-EXTRACTED with snippet", "'Daily room rent entitlement per policy clause.'"],
        ["Proportionate Deduction Active", "Policy terms document clause", "Boolean flag evaluated in Zod schema", "AI-EXTRACTED or STATUTORY", "'Mandatory IRDAI proportionate deduction clause.'"],
        ["Estimated Total Bill", "pvt_costs.csv / govt_costs.csv", "Procedure + 20% Doctor + 10% Meds + Room tariff", "MODELLED BENCHMARK", "'Indicative clinical cost benchmark for this tier and segment.'"],
        ["Hospital Out-of-Pocket", "Canonical financial impact engine", "Room Excess + Proportionate Disallowance + Sublimits + Deductible + Copay + Consumables", "CALCULATED DERIVATIVE", "'Calculated patient financial liability based on policy rules.'"],
        ["Network Status Badge", "hospitals.csv insurers column vs CANONICAL_INSURER_REGISTRY", "Exact / canonical alias matching", "VERIFIED REFERENCE MATCH", "'Verified network match based on reference empanelment records.'"],
        ["Policy Fit Score (0-100)", "Four-pillar MCDA formula", "0.50 Coverage + 0.25 Cost + 0.15 Type + 0.10 Copay", "DERIVED COMPATIBILITY INDEX", "'Objective composite compatibility index balancing coverage, cost, and stature.'"]
    ]
    tbl_prov = doc.add_table(rows=1, cols=5)
    format_table(tbl_prov, [1.4, 1.4, 1.6, 1.3, 1.7], headers_prov, rows_prov)

    # ---------------------------------------------------------
    # PHASE 27: FORMULA & ALGORITHM CHEAT SHEET
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 27 — FORMULA & ALGORITHM CHEAT SHEET")

    add_heading_2(doc, "27.1 Decision Radar: Policy Fit Score Formula")
    add_bullet(doc, "Formula", "FinalScore = Round(0.50 * CoverageFit + 0.25 * PatientCostFit + 0.15 * HospitalTypeScore + 0.10 * CoPayFit)")
    add_bullet(doc, "Granular Continuous Score", "GranularScore = Round(((0.50 * continuousCoverage) + (0.25 * continuousCost) + (0.15 * continuousType) + (0.10 * continuousCopay)) * 10) / 10 (Used to cleanly resolve ranking ties).")

    add_heading_2(doc, "27.2 Proportionate Deduction Formula")
    add_bullet(doc, "Formula", "AllowedRatio = Min(1.0, RoomLimitEligiblePerDay / RoomRatePerDay)\n"
               "AssociatedMedicalExpenses = ProcedureCharges (less sublimit excess) + DoctorFees\n"
               "ProportionateDisallowance = Round(AssociatedMedicalExpenses * (1.0 - AllowedRatio))")

    add_heading_2(doc, "27.3 Itemized Treatment Bill Construction")
    add_bullet(doc, "Formula", "TotalBill = ProcedureCharges + DoctorFees(20%) + MedicinesAndLabs(10%) + RoomCharges(RoomRate * StayDays)\n"
               "ModelledNonMedicalAllowance = Round(TotalBill * 0.05)")

    add_heading_2(doc, "27.4 Out-of-Pocket Patient Liability Formula")
    add_bullet(doc, "Formula", "PatientPayable = TotalRoomRentExcess + ProportionateDisallowance + SublimitExcess + DeductibleApplied + CopayAmount + SumInsuredExcess + ModelledNonMedicalAllowance")

    # ---------------------------------------------------------
    # PHASE 28: ARCHITECTURE EXPLANATION & TEXT DIAGRAM
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 28 — ARCHITECTURE EXPLANATIONS (10s TO DEEP DIVE)")

    add_bullet(doc, "10-Second Explanation", "SehatSure is a full-stack Node/Express and React application that transforms complex insurance PDFs into structured constraints, filters 54,000 hospitals in RAM in under 5ms, and calculates true out-of-pocket costs with an explainable Decision Radar.")
    add_bullet(doc, "30-Second Explanation", "SehatSure uses Gemini 3.1 Flash Lite to extract 25+ policy parameters into a validated Zod schema with automated retry healing. The backend stream-parses 54,000 hospital records and cost benchmarks into an in-memory Map, evaluating 4-state network empanelment and computing a 4-pillar Policy Fit Score. An event-driven Care Journey Engine audits patient hospitalization milestones in real time.")
    add_bullet(doc, "Deep Technical Architecture",
               "1. Client Layer: React 18 SPA with Vite, custom Vanilla CSS design tokens, and i18next (EN, HI, KN).\n"
               "2. API Layer: Node.js Express REST API with Zod validation, CORS whitelist, and multer buffer ingestion.\n"
               "3. Intelligence Layer: Gemini 3.1 Flash Lite (temperature 0) + pdf-parse hybrid vision fallback.\n"
               "4. Data Layer: In-memory streaming index of hospitals.csv (54k records) + MongoDB Atlas with MongoMemoryServer fallback.\n"
               "5. Guidance Layer: Deterministic journeyGuidanceEngine + client-side twin in frontend/src/utils/.")

    # ---------------------------------------------------------
    # PHASE 29: TECHNICAL STRENGTHS GROUPING
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 29 — GENUINE ENGINEERING STRENGTHS")
    add_bullet(doc, "Data Engineering", "Stream-parsing 11MB CSV with string interning keeping memory under 150MB against 450MB node ceiling.")
    add_bullet(doc, "Operational Resilience", "Automated MongoMemoryServer fallback and client-side guidance twin guaranteeing 100% demo uptime.")
    add_bullet(doc, "Healthcare Domain Precision", "True mathematical implementation of IRDAI proportionate deductions and statutory overrides for PM-JAY and ESI.")
    add_bullet(doc, "Patient Transparency", "Explicit Data Provenance badges on every value and 4 distinct audit counts in hospital discovery.")
    add_bullet(doc, "Ethical Grounding", "Honest 4-state network matching and clear disclosures of benchmark freshness.")

    # ---------------------------------------------------------
    # PHASE 30 & 31: LIMITATIONS & FUTURE ROADMAP
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 30 & 31 — LIMITATIONS & PRODUCTION ROADMAP")

    headers_road = ["Development Horizon", "Strategic Objective", "Key Technical Deliverables"]
    rows_road = [
        ["Immediate Next Step (Post-Hackathon)", "OCR & Real-Time Claims Testing", "Tesseract / Document AI integration for low-quality mobile phone photos of insurance policy cards."],
        ["Production Step (6 Months)", "National Health Claims Exchange (NHCX)", "Direct integration with ABDM / NHCX APIs for live digital pre-authorization and real-time network query."],
        ["Scale Step (12 Months)", "Hospital EHR / FHIR Integration", "HL7 / FHIR live feeds from hospital billing systems replacing simulated demo events in Care Journey."],
        ["Enterprise Horizon (18+ Months)", "Automated Claim Adjudication", "End-to-end integration with insurance TPAs for instant discharge settlement and dispute mitigation."]
    ]
    tbl_road = doc.add_table(rows=1, cols=3)
    format_table(tbl_road, [2.0, 2.3, 3.1], headers_road, rows_road)

    # ---------------------------------------------------------
    # PHASE 32: FINAL 4-HOUR STUDY GUIDE (HIGH DENSITY)
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 32 — FINAL 4-HOUR STUDY GUIDE (20 CORE TRUTHS)")

    study_points = [
        "1. Core Problem: Information asymmetry during hospital admission causes surprise out-of-pocket bills due to room rent caps and proportionate deductions.",
        "2. Core Solution: Decodes policy PDFs into computable rules, searches 54,000 hospitals, and guides patients through care.",
        "3. AI Role: Gemini 3.1 Flash Lite parses PDF into JSON schema with temperature 0. Ranking and billing are 100% deterministic.",
        "4. Statutory Schemes: PM-JAY (Ayushman Bharat: ₹5L SI, 0% copay, 100% cashless) and ESI (statutory unlimited cover) are automatically enforced.",
        "5. Proportionate Deduction: Exceeding room cap disallows doctor fees in proportion: AllowedRatio = AllowedRoom / ActualRoom.",
        "6. Scoring Pillars: 50% Coverage Fit, 25% Patient Cost Fit, 15% Hospital Type, 10% Co-Pay Predictability.",
        "7. 4-State Network Matching: Verified (match found), Unverified (data missing), No Match (other insurers), Unknown (policy insurer missing).",
        "8. In-Memory Search: 54,000 hospitals stream-parsed with string interning; searches execute in <5ms in RAM.",
        "9. Database Resilience: If MongoDB Atlas times out, server starts embedded MongoMemoryServer in RAM.",
        "10. Client Guidance Twin: frontend/src/utils/journeyGuidanceEngine.js allows offline Care Journey simulation.",
        "11. Non-Medical Consumables: 5% allowance modelled per IRDAI guidelines for non-reimbursable PPE/sanitization.",
        "12. Cost Jitter: Deterministic hash variation (±5%) based on hospital attributes eliminates random number flicker.",
        "13. Security: Passwords hashed with Node crypto.scryptSync and compared via crypto.timingSafeEqual.",
        "14. Localization: Localized in English, Hindi, and Kannada (honoring GE HealthCare Bengaluru engineering center).",
        "15. Safe Demo Path: Star Health demo policy -> Coverage Summary -> Bengaluru Knee Replacement -> Apollo Score & Bill Breakdown -> Care Journey Simulator.",
        "16. Provenance Badges: Every number is tagged: AI-EXTRACTED, USER-CONFIRMED, ASSUMED, or MODELLED ESTIMATE.",
        "17. Room Downgrade Advisor: Shows exact rupee savings if patient switches to Twin Sharing to avoid proportionate penalties.",
        "18. Never Claim: Do NOT claim live hospital bed APIs, 100% autonomous AI without human confirmation, or exact hospital quotations.",
        "19. What to Highlight: High-speed in-memory indexing, transparent provenance, and mathematical precision of proportionate deductions.",
        "20. Golden Closing: 'SehatSure turns confusing health insurance fine print into an actionable compass for patients during their most vulnerable moments.'"
    ]

    for sp in study_points:
        add_bullet(doc, "", sp, bold_title=False)

    # ---------------------------------------------------------
    # PHASE 33: "NEVER GET CAUGHT OFF GUARD" EMERGENCY RESPONSES
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 33 — BEFORE THE JUDGE: NEVER GET CAUGHT OFF GUARD")

    escapes = [
        ("If you do not know the answer to a question",
         "'That is a sharp edge case. Our current prototype does not explicitly model that specific scenario. Currently, our decision engine handles it through [X baseline], and in our production roadmap we would address it through [Y integration].'"),

        ("If a judge says: 'This is just a simple CRUD application'",
         "'With respect, CRUD simply stores and retrieves records. SehatSure executes complex multi-criteria decision analysis across 54,000 records in <5ms, evaluates non-linear IRDAI proportionate deduction penalties, models 4-state network empanelment, and executes a real-time event guidance engine. It is an active decision-support system, not a CRUD database.'"),

        ("If a judge says: 'Where is the machine learning?'",
         "'Our machine learning is focused in our ingestion pipeline using Gemini 3.1 Flash Lite with Zod validation. For hospital ranking and bill calculations, we deliberately chose deterministic multi-attribute decision mathematics because healthcare financial advice requires 100% auditability and explainability, which black-box neural networks cannot provide.'"),

        ("If a judge challenges your cost numbers",
         "'Our numbers are not arbitrary prices; they are empirical cost benchmarks stratified across geographic tiers, hospital segments, and room categories from reference healthcare datasets, bound strictly between dataset limits.'"),

        ("If a judge asks: 'Why should anyone trust this?'",
         "'Because we show our work. Every extracted number has a provenance badge and links to the exact PDF sentence snippet. Every score shows its 4-pillar mathematical breakdown, and our network matching explicitly discloses its verification status and data freshness.'")
    ]

    for situation, resp in escapes:
        add_heading_2(doc, "Scenario: " + situation)
        add_bullet(doc, "Calm, Professional Response", resp)

    # ---------------------------------------------------------
    # PHASE 34: 50 RAPID-FIRE Q&A FOR THE DEMO BOOTH
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 34 — 50 RAPID-FIRE Q&As FOR THE DEMO BOOTH")

    rapid_fire = [
        ("What is SehatSure?", "An insurance-aware decision engine that matches patients to optimal cashless hospitals and guides them through admission."),
        ("What is the core problem?", "Information asymmetry during hospital admission causing surprise out-of-pocket bills."),
        ("What is the hardest part?", "Modeling non-linear insurance rules like proportionate deduction and reconciling unstructured hospital addresses."),
        ("Where is the backend?", "Node.js and Express in TypeScript in server/src."),
        ("Where is the frontend?", "React 18 with Vite in frontend/src styled with custom design tokens in index.css."),
        ("Where is the database?", "MongoDB Atlas with an automatic embedded MongoMemoryServer fallback."),
        ("Where does hospital data come from?", "A reference dataset of over 54,000 Indian hospitals in hospitals.csv."),
        ("Where does cost data come from?", "pvt_costs.csv and govt_costs.csv stratified by tier, specialty, and procedure."),
        ("Where is AI used?", "Gemini 3.1 Flash Lite for policy document PDF extraction in geminiService.ts."),
        ("What is rule-based?", "Financial impact calculations, statutory overrides, scoring formula, and Care Journey event rules."),
        ("How does the score work?", "50% Coverage Fit + 25% Patient Cost Fit + 15% Hospital Type + 10% Co-Pay Predictability."),
        ("How is network status verified?", "Against a canonical insurer registry with exact and alias matching into 4 states: verified, unverified, no match, unknown."),
        ("How do you prevent false network claims?", "Unverified hospitals are never shown as network; freshness is disclosed as 'Reference Match: Freshness Unknown'."),
        ("What happens if a PDF is scanned?", "If pdf-parse finds <=50 characters, the service automatically passes inline base64 to Gemini multimodal vision."),
        ("What happens if Gemini extraction fails validation?", "An automated self-correcting retry loop re-prompts Gemini with the specific Zod errors."),
        ("What is Proportionate Deduction?", "A penalty where exceeding daily room rent caps disallows associated doctor and surgery fees in proportion."),
        ("How do you handle PM-JAY?", "Statutory override enforces ₹5 Lakh family cover, 0% copay, and 100% cashless treatment at empanelled centers."),
        ("How do you handle ESI?", "Statutory override enforces unlimited cover and 0% copay at ESIC hospitals and tie-ups."),
        ("Why 4 demo policies?", "To let booth judges test downstream discovery and care journey guidance instantly without waiting for uploads."),
        ("What are the 4 demo policies?", "Star Health (retail floater), HDFC Ergo (corporate group), PM-JAY (govt scheme), and ESI (statutory cover)."),
        ("How fast is hospital search?", "Under 5 milliseconds in RAM."),
        ("How do you keep memory low?", "Readline streaming and STRING_POOL string interning keep heap usage under 150MB."),
        ("What languages are supported?", "English, Hindi, and Kannada via i18next."),
        ("Why Kannada?", "To honor the local linguistic community of Bengaluru and Karnataka, home to GE HealthCare India."),
        ("Is pricing exact?", "No, it is an indicative clinical benchmark derived from tier-stratified cost datasets."),
        ("Why no Math.random() in cost?", "We use a deterministic hash of hospital attributes so estimates remain consistent across refreshes."),
        ("What is the non-medical consumables rate?", "5% of total bill, modelled after IRDAI non-payable consumables guidelines."),
        ("Can users edit extracted policies?", "Yes, CoverageSummaryPage allows full review and confirmation of extracted terms."),
        ("What are Tier 1 required fields?", "7 critical fields: insurer, policyType, sumInsured, roomLimit, copay, deductible, proportionateDeduction."),
        ("What if the database drops?", "The backend catches the error and boots an embedded MongoMemoryServer in RAM."),
        ("What if Wi-Fi drops?", "The frontend has an offline guidance twin in frontend/src/utils/journeyGuidanceEngine.js."),
        ("How is authentication secured?", "Node crypto.scryptSync with 16-byte random salt and timingSafeEqual."),
        ("Can users save hospitals?", "Yes, authenticated users can bookmark hospitals and view them in ProfileModal."),
        ("What does the Care Journey Simulator do?", "Allows users to simulate admission, room upgrades, pre-auth delays, and discharge checklists."),
        ("What is 'Why Am I Seeing This?'", "A modal explaining the exact policy clause, allowed value, patient value, and suggested action."),
        ("Does SehatSure replace doctors?", "Never. It provides zero clinical advice; it optimizes administrative and billing decisions."),
        ("Does SehatSure guarantee claims?", "No. Final claims adjudication remains strictly with the insurer and TPA."),
        ("What happens if a user selects a luxury room?", "The engine calculates room excess, fires a Proportionate Deduction alert, and advises downgrading."),
        ("How much can downgrading save?", "In our demo contract, switching from Single AC to Twin Sharing saves over ₹36,000 out-of-pocket."),
        ("How do you handle emergency admissions?", "Emergency mode bypasses pre-auth warnings with immediate clinical stabilization directives."),
        ("What is the pre-auth window?", "Typically 24-48 hours prior for planned admissions; within 24 hours post-admission for emergencies."),
        ("What is the post-hospitalization window?", "Typically 60 days to submit follow-up medicine and diagnostic receipts."),
        ("Where are uploaded PDFs stored?", "In an isolated server/uploads directory with unique UUIDs and no public static listing."),
        ("Why not microservices?", "A modular monolith is vastly superior for rapid hackathon execution and eliminates network hop latency."),
        ("How many hospitals are indexed?", "Over 54,000 healthcare facilities across India."),
        ("How many hospitals in Bengaluru?", "1,910 indexed facilities."),
        ("What breaks first at 100k users?", "Single-threaded Node event loop and external LLM API rate limits."),
        ("How would you scale it?", "Cluster Node processes, introduce Redis caching for search, and queue PDF uploads with BullMQ."),
        ("What is your immediate next step?", "Integrate Tesseract OCR for camera phone photos and connect to ABDM / NHCX APIs."),
        ("Why should GE HealthCare care?", "Because precision care cannot stop at diagnosis; it must deliver financial precision at admission.")
    ]

    for q_idx, (rq, ra) in enumerate(rapid_fire, 1):
        add_bullet(doc, f"{q_idx}. {rq}", ra)

    # ---------------------------------------------------------
    # PHASE 35: FINAL SELF-AUDIT CHECKLIST
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 35 — FINAL PRE-DEMO SELF-AUDIT CHECKLIST")

    audit_checks = [
        ("Repository Architecture Verified", "Confirmed server/src and frontend/src execution paths, tsx/vite build configurations, and root datasets."),
        ("Live Deployed Application Verified", "https://ge-pcc2026.onrender.com/ verified active with healthy backend response on /api/health."),
        ("Screen-by-Screen Controls Traced", "Traced UploadPage, CoverageSummaryPage, HospitalDiscoveryPage, CareJourneyPage, and all 5 modals."),
        ("Mathematical Formulas Audited", "Proportionate deduction formula, Policy Fit Score MCDA weights (50/25/15/10), and cost jitter verified."),
        ("AI vs Rule Demarcation Verified", "Gemini 3.1 Flash Lite ingestion separated from deterministic decision-support logic."),
        ("Statutory Overrides Confirmed", "PM-JAY ₹5L cover and ESI unlimited cover statutory clauses verified in overrideService.ts."),
        ("Data Provenance & Safeguards Audited", "4-state network matching verified; unverified hospitals confirmed shielded from false network claims."),
        ("Cybersecurity & Cryptography Inspected", "scrypt password hashing, timingSafeEqual, and isolated document endpoints confirmed."),
        ("Spoken 10-Minute Script Ready", "Word-for-word spoken presentation script with [EMPHASIZE], [SHOW], [PAUSE] finalized."),
        ("Emergency Survival Lines Memorized", "Ready to handle Wi-Fi drops, cold starts, and aggressive judge challenges with complete poise.")
    ]

    for title, desc in audit_checks:
        add_bullet(doc, title, desc)

    add_callout(
        doc,
        "YOU ARE READY. You possess complete forensic awareness of SehatSure's code, data, mathematics, and limitations. "
        "Stand tall at the booth. Speak with calm authority, total transparency, and unwavering confidence. "
        "Best of luck at the GE HealthCare Precision Care Challenge 2026 Final Round!",
        title="FINAL ROUND VICTORY MANDATE",
        alert_type="success"
    )
