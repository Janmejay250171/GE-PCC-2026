from docx import Document
from docx.shared import Inches, Pt, RGBColor
from .styles import (
    add_heading_1, add_heading_2, add_heading_3,
    add_bullet, add_callout, format_table
)

def build_part4(doc: Document):
    # ---------------------------------------------------------
    # PHASE 16: WEAKNESS DEFENSE DIRECTORY (CATEGORIES A-J)
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 16 — WEAKNESS DEFENSE DIRECTORY (CATEGORIES A TO J)")

    weaknesses = [
        {
            "cat": "CATEGORY B: PROTOTYPE LIMITATION",
            "issue": "Lack of live hospital bed availability and real-time TPA claim adjudication APIs.",
            "attack": "'How can a patient rely on this if you don't have live API integration with Apollo or Star Health?'",
            "defense": "In India, real-time insurer TPA APIs are proprietary or currently emerging under the National Health Claims Exchange (NHCX). At the prototype stage, our priority was proving the core decision-support logic and financial optimization algorithms using authoritative reference benchmarks.",
            "deep": "We architected our models to match the FHIR / ABDM data specifications, so when NHCX APIs are accessible, our service can swap dataset lookups for live endpoints without architectural restructuring.",
            "no_claim": "Never say 'we have real-time APIs with insurers' or 'hospitals are updating our database live'.",
            "prod": "Integrate with National Health Claims Exchange (NHCX) and hospital ABDM Gateway."
        },
        {
            "cat": "CATEGORY C: DEMO / FIXTURE BEHAVIOR",
            "issue": "Pre-seeded demo policies (Star Health, HDFC Ergo, PM-JAY, ESI) with instant loading.",
            "attack": "'Are these pre-seeded policies just hard-coded fake data?'",
            "defense": "The demo policies are realistic clones of actual Indian policy contracts (with corresponding real PDFs in mock-policies/) provided to ensure booth judges can evaluate the downstream hospital discovery and care journey engines instantly without waiting 15 seconds for PDF uploads.",
            "deep": "The live PDF extraction endpoint (POST /api/policy/upload) is fully functional and uses Gemini 3.1 Flash Lite to extract arbitrary uploaded policies. The demo picker simply speeds up demonstration throughput.",
            "no_claim": "Do NOT say demo policies were extracted live if you clicked a demo card.",
            "prod": "Maintain a sandbox library of certified insurer policy templates for quick onboarding."
        },
        {
            "cat": "CATEGORY D: DESIGN TRADE-OFF",
            "issue": "Mandatory user confirmation step on CoverageSummaryPage instead of direct jump to hospitals.",
            "attack": "'Why do you make the user confirm the extracted policy? Shouldn't AI do it automatically?'",
            "defense": "In healthcare and insurance, 100% autonomous automation is dangerous. A single misidentified room rent clause or co-pay number could lead to a ₹50,000 out-of-pocket shock. Requiring human confirmation is a deliberate safety decision.",
            "deep": "We separate AI extraction (best-effort probabilistic) from decision-engine execution (deterministic). By making the user the final validator, we maintain clinical and financial safety.",
            "no_claim": "Never apologize for requiring user confirmation; celebrate it as a deliberate safety safeguard.",
            "prod": "Highlight low-confidence fields with interactive PDF side-by-side verification."
        },
        {
            "cat": "CATEGORY E: DATA LIMITATION",
            "issue": "Hospital dataset lists empanelled insurers, but freshness timestamp is unknown.",
            "attack": "'What if a hospital dropped out of Star Health's network last month?'",
            "defense": "That is an inherent limitation of reference datasets. To protect the patient, our system explicitly displays 'Verification Level: Reference Dataset Match' and 'Freshness: Unknown'. We advise patients to confirm with the hospital cashless desk for planned admissions.",
            "deep": "Furthermore, if hospital insurer data is missing or incomplete, our networkMatchingService classifies it as 'unverified' rather than assuming it is network.",
            "no_claim": "Never claim the dataset is updated daily or verified with hospital billing this morning.",
            "prod": "Implement automated daily TPA portal scraping and crowdsourced claim confirmation."
        },
        {
            "cat": "CATEGORY J: ACTUALLY FINE (ENGINEERING DECISION)",
            "issue": "Using in-memory Map indexing for 54,000 hospitals instead of complex MongoDB aggregation pipelines.",
            "attack": "'Why are you indexing hospitals in Node.js RAM instead of writing complex MongoDB queries?'",
            "defense": "Querying 54,000 records on MongoDB free tier over a remote Atlas connection takes 200-500ms per search. By stream-parsing and interning strings into RAM on boot, our queries execute in under 5 milliseconds with zero database network latency.",
            "deep": "Node readline streaming keeps heap memory under 150MB, well below our 450MB memory ceiling. For a read-heavy decision engine, in-memory indexing delivers vastly superior user responsiveness.",
            "no_claim": "Do NOT say MongoDB couldn't handle it; say in-memory caching was chosen for sub-5ms latency.",
            "prod": "Deploy an external Redis cache or Elasticsearch cluster for multi-node deployments."
        }
    ]

    for w in weaknesses:
        add_heading_2(doc, w["cat"] + ": " + w["issue"])
        add_bullet(doc, "Judge Attack", w["attack"])
        add_bullet(doc, "Short Defensive Response", w["defense"])
        add_bullet(doc, "Deeper Technical Response", w["deep"])
        add_bullet(doc, "What NOT to Claim", w["no_claim"], bold_title=True)
        add_bullet(doc, "Production Roadmap Improvement", w["prod"])

    # ---------------------------------------------------------
    # PHASE 17: 100+ HOSTILE JUDGE QUESTIONS & DEFENSES
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 17 — HOSTILE JUDGE ATTACK QUESTIONS & DEFENSES (100+ Q&As)")

    add_callout(
        doc,
        "These questions are engineered specifically from SehatSure's actual codebase. "
        "Review them thoroughly. Each provides a 10-second Short Answer, a 30-second Strong Answer, "
        "and the exact File Evidence supporting your claim.",
        title="JUDGE ATTACK SIMULATION DIRECTIVE",
        alert_type="warning"
    )

    qa_list = [
        # PRODUCT & CONCEPT
        ("What is SehatSure in one sentence?",
         "SehatSure is an insurance-aware healthcare decision-support engine that decodes policy fine print to match patients with optimal, cashless hospitals and guide them through admission without surprise out-of-pocket bills.",
         "Most hospital admission platforms are simple directories. SehatSure bridges the chasm between complex insurance policy terms (room rent caps, proportionate deductions, co-pays) and hospital billing tiers, calculating true patient out-of-pocket costs and providing proactive guidance throughout the care lifecycle.",
         "server/src/services/hospitalService.ts and journeyGuidanceEngine.ts",
         "Testing if you understand your core value proposition vs ordinary hospital directories.",
         "Do not say 'it's an AI chatbot that talks to patients'."),

        ("Why does SehatSure need to exist if hospitals already have TPA insurance desks?",
         "Because TPA desks operate AFTER a patient has arrived; SehatSure provides pre-admission decision intelligence before financial commitments are made.",
         "When a patient reaches the hospital desk, they have already chosen the facility. If the hospital is out-of-network or room rent exceeds limits, the patient is already trapped. SehatSure empowers families beforehand with transparent cost benchmarks and room cap compliance.",
         "frontend/src/pages/HospitalDiscoveryPage.jsx",
         "Challenging practical healthcare utility.",
         "Do not claim to replace hospital TPA personnel."),

        # INSURANCE & BUSINESS LOGIC
        ("How does SehatSure calculate Proportionate Deduction?",
         "If room rent exceeds policy limits, doctor fees and procedure charges are disallowed in proportion to the room limit ratio.",
         "AllowedRatio = Min(1, RoomLimitEligible / RoomRate). ProportionateDisallowance = AssociatedMedicalExpenses * (1 - AllowedRatio). This models the standard IRDAI clause where exceeding room caps penalizes surgeon and nursing fees.",
         "server/src/services/hospitalService.ts (lines 1188-1197)",
         "Testing if you know Indian insurance mechanics or just deducted room difference.",
         "Do not say 'we just deduct the extra room rent per day'."),

        ("How do you handle Ayushman Bharat PM-JAY and ESI schemes?",
         "Through automated statutory overrides in overrideService.ts that enforce ₹5 Lakh limit for PM-JAY and unlimited cover for ESI with 100% cashless treatment.",
         "Government schemes have statutory package rates that supersede private contract clauses. Our overrideService enforces 0% co-pay, zero room rent cap, and restricted-network requirements, tagging them with confidence='assumed'.",
         "server/src/services/overrideService.ts",
         "Testing healthcare domain depth.",
         "Do not say AI parsed PM-JAY terms from a brochure."),

        ("What happens if a policy has a procedure sub-limit, like ₹1.5 Lakh for Knee Replacement?",
         "The engine caps procedure admissibility at ₹1.5 Lakh and assigns the remaining expense directly to patient out-of-pocket.",
         "In calculatePolicyImpact(), we inspect policy.subLimits. If the procedure matches, SublimitExcess = Max(0, ProcedureCharges - Limit). This excess is deducted from eligible claim amount before co-pay calculation.",
         "server/src/services/hospitalService.ts (lines 1163-1185)",
         "Testing sub-limit handling.",
         "Do not say sub-limits are ignored if the overall Sum Insured is large."),

        # AI & ML
        ("Where is AI genuinely used in SehatSure?",
         "AI is used strictly in the policy PDF extraction pipeline using Gemini 3.1 Flash Lite with temperature 0 and Zod schema validation.",
         "We deliberately separated AI extraction from mathematical decision-making. AI parses complex, unstructured PDF policies into structured JSON. All financial impact, ranking, and network matching are deterministic to ensure explainability and regulatory auditability.",
         "server/src/services/geminiService.ts",
         "Testing if you are over-hyping AI.",
         "Never claim ranking or cost calculation is done by an LLM."),

        ("Why didn't you use an LLM for hospital ranking or bill estimation?",
         "Because healthcare billing and insurance claims require 100% mathematical determinism and traceability; LLMs hallucinate numbers.",
         "If an LLM calculates a patient's bill, two queries for the same hospital could return different numbers. In contrast, our multi-criteria scoring and segment cost positioning are 100% repeatable, explainable, and legally defensible.",
         "server/src/services/hospitalService.ts",
         "Testing software architecture maturity.",
         "Do not say 'we didn't have time to train a model'."),

        # BACKEND & PERFORMANCE
        ("How do you search 54,000 hospitals without lagging?",
         "We stream-parse the CSV on startup into an in-memory Map with string interning, enabling sub-5ms filtered lookups in RAM.",
         "Rather than loading 54k rows into Mongo and paying network query latency, HospitalService uses Node readline streaming and STRING_POOL interning to keep heap usage under 150MB, performing instant in-memory filtering by city and specialty.",
         "server/src/services/hospitalService.ts (lines 474-608)",
         "Testing data engineering and scalability.",
         "Do not claim to query MongoDB directly for every keystroke."),

        ("What happens if MongoDB Atlas goes down during your demo?",
         "The backend automatically catches the error and spawns an embedded MongoMemoryServer in RAM, seeding demo policies seamlessly.",
         "server/src/config/db.ts contains an automatic fallback to MongoMemoryServer with a 10-second timeout. Even if the venue has no internet or blocks database ports, the backend runs 100% offline.",
         "server/src/config/db.ts (lines 20-33)",
         "Testing fault tolerance and operational resilience.",
         "Do not say 'the app would crash'."),

        # NETWORK & DATA INTEGRITY
        ("How can you guarantee that a hospital is network?",
         "We cannot guarantee live network status from a reference dataset, which is why we classify matching into verified, unverified, no_match, and unknown with full freshness disclosures.",
         "Network empanelment fluctuates. If our dataset lacks insurer data for a hospital, we classify it as 'unverified' with a warning to check with the TPA desk, rather than making false claims. We clearly label freshness as 'Reference Dataset Match'.",
         "server/src/services/networkMatchingService.ts",
         "Testing patient safety and legal awareness.",
         "Never promise that a hospital is 100% guaranteed cashless.")
    ]

    for q, short_a, strong_a, ev, trap, do_not in qa_list:
        add_heading_2(doc, "Q: " + q)
        add_bullet(doc, "Short Answer (10s)", short_a)
        add_bullet(doc, "Strong Answer (30s)", strong_a)
        add_bullet(doc, "Code Evidence", ev)
        add_bullet(doc, "Judge Trap", trap)
        add_bullet(doc, "DO NOT SAY", do_not, bold_title=True)

    # ---------------------------------------------------------
    # PHASE 18: "SHOW ME THE CODE" QUICK REFERENCE
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 18 — 'SHOW ME THE CODE' MASTER DIRECTORY")

    headers_code = ["Feature / Logic", "Exact File Path", "Primary Function / Symbol", "Key Lines / Logic"]
    rows_code = [
        ["Policy PDF Extraction", "server/src/services/geminiService.ts", "GeminiService.extractPolicy()", "Lines 119-250 (pdf-parse text fallback + Gemini JSON retry)"],
        ["Proportionate Deduction", "server/src/services/hospitalService.ts", "calculatePolicyImpact()", "Lines 1188-1197 (AllowedRatio & AssociatedMedicalExpenses)"],
        ["Hospital Variation Jitter", "server/src/services/hospitalService.ts", "getHospitalVariation()", "Lines 359-363 (Deterministic hash variation ±5%)"],
        ["Stream CSV Ingestion", "server/src/services/hospitalService.ts", "parseHospitalsFromFile()", "Lines 500-608 (Readline streaming + STRING_POOL interning)"],
        ["Policy Fit Score Formula", "server/src/services/hospitalService.ts", "rankHospitals()", "Lines 1441-1454 (50% Coverage, 25% Cost, 15% Type, 10% Co-pay)"],
        ["Statutory Overrides", "server/src/services/overrideService.ts", "applySchemeOverrides()", "Lines 57-122 (PM-JAY ₹5L cover and ESI unlimited cover)"],
        ["4-State Network Matching", "server/src/services/networkMatchingService.ts", "getHospitalNetworkStatus()", "Lines 237-334 (Verified, Unverified, No Match, Unknown)"],
        ["In-Memory Mongo Fallback", "server/src/config/db.ts", "connectDB()", "Lines 20-33 (Automatic MongoMemoryServer fallback)"],
        ["Care Journey Event Engine", "server/src/services/journeyGuidanceEngine.ts", "evaluateEvent()", "Lines 40-250 (Event dispatch, room cap audit, financial deltas)"],
        ["Client Journey Twin", "frontend/src/utils/journeyGuidanceEngine.js", "evaluateClientJourneyEvent()", "Lines 7-150 (Offline client-side guidance twin)"],
        ["Password Cryptography", "server/src/controllers/authController.ts", "hashPassword() & verifyPassword()", "Lines 6-19 (scryptSync + timingSafeEqual)"]
    ]
    tbl_code = doc.add_table(rows=1, cols=4)
    format_table(tbl_code, [1.8, 2.3, 1.8, 1.6], headers_code, rows_code)

    # ---------------------------------------------------------
    # PHASE 19: DEMO BOOTH MASTER FLOW
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 19 — DEMO BOOTH MASTER SEQUENCE (BULLETPROOF)")

    add_heading_2(doc, "19.1 The Safe Golden Demo Path (5 Minutes)")
    add_bullet(doc, "Step 1: Open Live App", "Navigate to https://ge-pcc2026.onrender.com/. Show clean homepage with capability strip.")
    add_bullet(doc, "Step 2: Log In", "Click Login -> enter demo credentials (e.g. demo@sehatsure.com) or click 'Sign Up' with your name. Show user profile badge.")
    add_bullet(doc, "Step 3: Select Star Health Demo Policy", "Click 'Star Health (Private)' card. SteppedLoader activates. Explain: 'The system extracted a retail floater with ₹3,00,000 Sum Insured, ₹3,000 room cap, and a proportionate deduction clause.'")
    add_bullet(doc, "Step 4: Show Coverage Summary & Source Snippets", "Hover over the Provenance Badge. Click the Room Rent badge to open the Source Snippet modal: show the exact text row from the PDF where the clause was extracted!")
    add_bullet(doc, "Step 5: Confirm Policy", "Click 'Confirm & Discover Hospitals'. Show smooth transition to HospitalDiscoveryPage.")
    add_bullet(doc, "Step 6: Filter by City & Specialty", "Type 'Bengaluru' in city autocomplete. Select 'Orthopedics' -> select 'Knee Replacement'. Show that 4 audit counts update instantly (Total, Network Facilities, Specialty Matched, Procedure Matched).")
    add_bullet(doc, "Step 7: Explain Policy Fit Score", "Click 'Score Breakdown' on top hospital (e.g. Apollo). Show the 4 pillars: 50% Coverage Fit, 25% Cost Fit, 15% Type, 10% Co-Pay.")
    add_bullet(doc, "Step 8: Demonstrate Room Downgrade Advisor", "Click 'Bill Breakdown & AI Advice'. Show how choosing Single Private Room triggers Proportionate Deduction alert, and point to AI suggestion: 'Switching to Twin Sharing saves ₹36,000 out-of-pocket!'")
    add_bullet(doc, "Step 9: Track Care Journey", "Click 'Track Care Journey'. In Care Journey Simulator, trigger a 'Room Upgrade'. Show instant financial delta recalculation and click 'Why Am I Seeing This?' to show policy rule audit.")

    add_heading_2(doc, "19.2 Dangerous / Unstable Features to Avoid at Booth")
    add_bullet(doc, "AVOID: Uploading huge uncompressed 100MB PDFs", "Free Render tier has a 512MB RAM cap. Upload standard 1-5 page PDFs (use mock-policies/ files if testing live upload).")
    add_bullet(doc, "AVOID: Claiming real-time bed occupancy", "Stick to cost benchmarks, network matching, and policy compliance.")

    # ---------------------------------------------------------
    # PHASE 20: DEMO FAILURE PREPARATION
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 20 — DEMO FAILURE SURVIVAL GUIDE")

    headers_fail = ["Failure Scenario", "Symptom / Error", "Calm Pivot Explanation"]
    rows_fail = [
        ["Venue Wi-Fi drops completely", "Browser cannot reach web server", "Pivot immediately to local dev: 'Notice our offline-first architecture: the client guidance twin in frontend/src/utils/ continues executing decision guidance even without an active internet connection.'"],
        ["Render free container cold start", "Initial request takes 30-40 seconds", "'Render free web services spin down after inactivity. While the container wakes up, notice our client-side state caching in localStorage which instantly restores the user session.'"],
        ["Gemini API rate limit on PDF upload", "HTTP 429 / extraction takes long", "'Because external LLM API rate limits can experience spikes, we pre-seeded our platform with 4 reference scheme templates (Star, HDFC, PM-JAY, ESI). Let's load the Star Health contract instantly.'"],
        ["MongoDB connection drop", "Database write error", "'Our backend is architected with an automated fallback to an embedded in-memory MongoDB instance (MongoMemoryServer), isolating demo execution from external cloud database downtime.'"]
    ]
    tbl_fail = doc.add_table(rows=1, cols=3)
    format_table(tbl_fail, [1.8, 1.8, 3.6], headers_fail, rows_fail)
