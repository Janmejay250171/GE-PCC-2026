from docx import Document
from docx.shared import Inches, Pt, RGBColor
from .styles import (
    add_title, add_heading_1, add_heading_2, add_heading_3,
    add_bullet, add_callout, format_table
)

def build_part1(doc: Document):
    # Executive Document Header
    add_title(
        doc,
        "SEHATSURE — FORENSIC REPOSITORY AUDIT & DEFENSE MANUAL",
        "GE HealthCare Precision Care Challenge 2026 | Physical Booth & Final Presentation Playbook"
    )

    add_callout(
        doc,
        "CRITICAL OBJECTIVE: The final presentation is tomorrow. You do not have time to modify or refactor the code. "
        "Your goal is complete technical mastery, unvarnished transparency, forensic defense, and zero bluffing. "
        "Every claim in this manual is verified against the actual repository code (server/src, frontend/src, datasets). "
        "Never invent features or hide limitations. Turn prototype trade-offs into evidence of mature engineering judgment.",
        title="FINAL ROUND READINESS DIRECTIVE",
        alert_type="warning"
    )

    # ---------------------------------------------------------
    # PHASE 1: REPOSITORY DISCOVERY & INTERNAL ARCHITECTURE
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 1 — REPOSITORY ARCHITECTURE & EXECUTION PATHS")

    add_heading_2(doc, "1.1 Monorepo Structure & Package Workspaces")
    add_bullet(doc, "Repository Layout", "Root package.json configures npm workspaces managing two packages: 'server' (Node.js/Express/TypeScript) and 'frontend' (React/Vite).")
    add_bullet(doc, "Authoritative vs Reference Code", "The repository contains a legacy prototype folder 'cost/' created during early development. As documented in cost/README.md, this directory is NON-AUTHORITATIVE. The authoritative business logic lives strictly in 'server/src/services/' and root datasets.")
    add_bullet(doc, "Datasets at Root", "Three core CSV files provide the data backbone: 'hospitals.csv' (11 MB, 54,000+ facilities), 'pvt_costs.csv' (private procedure & room rates by tier), and 'govt_costs.csv' (government procedure & room rates).")

    add_heading_2(doc, "1.2 Execution Entry Points & Runtime Pathways")
    add_bullet(doc, "Backend Entry", "server/src/index.ts (TypeScript compiled via tsx watch in dev or tsc/dist in prod). Listens on PORT 5000 (configurable via config/env.ts).")
    add_bullet(doc, "Frontend Entry", "frontend/src/main.jsx booting App.jsx wrapped in AuthProvider and i18next configuration. Built using Vite.")
    add_bullet(doc, "Database Connection", "server/src/config/db.ts: Attempts connection to MongoDB Atlas/local URI. If unreachable or timeout occurs (10s), it seamlessly spins up an in-memory Mongo instance via mongodb-memory-server to ensure 100% demo resilience.")
    add_bullet(doc, "Dataset Hydration", "hospitalService.initData() in server/src/services/hospitalService.ts: Streams hospitals.csv line-by-line using readline and memory string interning to stay under 150MB heap on Render's 512MB RAM cap.")

    # Table of Core Backend Services
    headers_services = ["Service / File", "Responsibility", "Key Algorithms / Dependencies"]
    rows_services = [
        ["geminiService.ts", "AI policy extraction from PDF documents", "GoogleGenerativeAI (gemini-3.1-flash-lite), pdf-parse, Zod validation"],
        ["hospitalService.ts (73KB)", "Indexing, search, tiered cost estimation, scoring", "Streaming readline, hashString jitter, 4-pillar Policy Fit Score formula"],
        ["networkMatchingService.ts", "4-state insurer empanelment verification", "Canonical alias registry, token boundary matching, freshness disclosure"],
        ["journeyGuidanceEngine.ts", "Inpatient hospitalization event guidance & rules", "Deterministic event engine, room cap breach audit, financial deltas"],
        ["overrideService.ts", "Statutory scheme defaults & Tier 2 fallbacks", "Statutory rules for PM-JAY (₹5L SI, 0% copay) and ESI (unlimited SI)"],
        ["normalizerService.ts", "Payload cleaning and schema sanitization", "Regex cleaning, currency string-to-integer conversion, Zod parsing"]
    ]
    tbl_services = doc.add_table(rows=1, cols=3)
    format_table(tbl_services, [1.8, 2.5, 2.7], headers_services, rows_services)

    # ---------------------------------------------------------
    # PHASE 2: RUNNING APPLICATION & DEMO RESILIENCE
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 2 — RUNNING ENVIRONMENT & DEMO RESILIENCE")

    add_heading_2(doc, "2.1 Production vs Local Execution")
    add_bullet(doc, "Live Production URL", "https://ge-pcc2026.onrender.com/ (Deployed on Render free web service running Node.js + Express with static SPA fallback).")
    add_bullet(doc, "Local Startup Command", "npm run dev at root, which concurrently executes 'npm --prefix server run dev' and 'npm --prefix frontend run dev'.")
    add_bullet(doc, "RAM Cap Safeguard", "package.json start script mandates 'node --max-old-space-size=450 server/dist/index.js' to prevent Render out-of-memory container kills.")

    add_heading_2(doc, "2.2 Embedded In-Memory MongoDB Fallback")
    add_bullet(doc, "What Happens If Atlas Fails?", "If conference Wi-Fi blocks port 27017 or Atlas connection fails, server/src/config/db.ts catches the error and initializes an embedded MongoMemoryServer in RAM. It then seeds DEMO_POLICIES automatically.")
    add_bullet(doc, "What to Tell Judges", "'We engineered an automated embedded database fallback (MongoMemoryServer) so that our healthcare decision-support engine can operate fully offline during emergency field demos without external network reliance.'")

    # ---------------------------------------------------------
    # PHASE 3: SCREEN-BY-SCREEN FORENSIC WALKTHROUGH
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 3 — SCREEN-BY-SCREEN FORENSIC WALKTHROUGH")

    add_heading_2(doc, "Screen 1: UploadPage (Upload & Policy Onboarding)")
    add_bullet(doc, "Route / State", "currentView === 'upload' rendered by frontend/src/pages/UploadPage.jsx.")
    add_bullet(doc, "Visual Elements", "Hero title, Capability Strip (Extraction, Matching, Cost, Verified), UploadZone (drag-and-drop PDF), DemoPicker (4 interactive cards), SteppedLoader.")
    add_bullet(doc, "Authentication Barrier", "Upload and Demo selection check if user is logged in. If logged out, onRequireAuth opens AuthModal with an inviting prompt: 'Please log in first to access your insurance policy.'")
    add_bullet(doc, "Interactive Control 1 (File Drop)", "User uploads a PDF -> handleFileUpload -> uploadPolicyPdf API (POST /api/policy/upload) -> server executes Gemini extraction -> returns structured policy -> handlePolicyLoaded -> transitions to 'summary'.")
    add_bullet(doc, "Interactive Control 2 (Demo Picker)", "User clicks a demo card (e.g. Star Health) -> handleDemoSelect -> createPolicyFromDemo API (POST /api/policy/demo/:key) -> clones pre-seeded policy -> transitions to 'summary'.")

    add_heading_2(doc, "Screen 2: CoverageSummaryPage (Policy Validation & Confirmation)")
    add_bullet(doc, "Route / State", "currentView === 'summary' rendered by frontend/src/pages/CoverageSummaryPage.jsx.")
    add_bullet(doc, "Visual Elements", "Executive policy card (Insurer, Plan Name, UIN, Zone, Network), ProvenanceBadges (AI-EXTRACTED, USER-CONFIRMED, ASSUMED), Tier 1 required fields grid, Tier 2 benefits accordion, Exclusions pills, Waiting periods table.")
    add_bullet(doc, "Interactive Control 1 (Source Snippets)", "Clicking on any extracted field badge triggers a snippet view showing the exact sentence or table row from the original PDF where Gemini found the clause.")
    add_bullet(doc, "Interactive Control 2 (Confirm Button)", "User clicks 'Confirm & Discover Hospitals' -> updatePolicy API (PUT /api/policy/:id) -> server validates getMissingTier1Fields() -> sets confirmedByUser = true -> transitions currentView to 'discovery'.")

    add_heading_2(doc, "Screen 3: HospitalDiscoveryPage (Multi-Tiered Hospital Matching)")
    add_bullet(doc, "Route / State", "currentView === 'discovery' rendered by frontend/src/pages/HospitalDiscoveryPage.jsx.")
    add_bullet(doc, "Filter Bar", "1. City autocomplete input; 2. Specialty selector (Cardiology, Orthopedics, etc.); 3. Procedure selector (dynamically cascaded based on specialty); 4. Room category (General Ward, Twin Sharing, Single Private Room); 5. Network toggle ('Verified Network Hospitals Only').")
    add_bullet(doc, "Explicit Audit Counts Header", "Displays 4 distinct metrics: totalCount (total in city), networkFacilityCount (verified network facilities), specialtyMatchedCount (facilities offering department), procedureMatchedCount (facilities performing procedure).")
    add_bullet(doc, "Hospital Card Elements", "Hospital name, segment badge, tier, Google Maps link, empanelled insurer list, network status badge, SehatSure Policy Fit Score (0-100), itemized financial bar (Estimated Bill, Insurer Share, Out-of-Pocket), room rent status.")
    add_bullet(doc, "Interactive Control 1 (Score Modal)", "Clicking 'Score Breakdown' opens ScoreBreakdownModal displaying the 4-pillar Decision Radar.")
    add_bullet(doc, "Interactive Control 2 (Bill Modal)", "Clicking 'Bill Breakdown & AI Advice' opens BillBreakdownModal showing itemized doctor fees, room tariff, medicine costs, and proactive AI downgrade savings.")
    add_bullet(doc, "Interactive Control 3 (Track Care Journey)", "Clicking 'Track Care Journey' calls onTrackJourney(hospital, procedure, roomType) -> transitions currentView to 'journey'.")

    add_heading_2(doc, "Screen 4: CareJourneyPage (Inpatient Guidance & Simulator)")
    add_bullet(doc, "Route / State", "currentView === 'journey' rendered by frontend/src/pages/CareJourneyPage.jsx.")
    add_bullet(doc, "Visual Elements", "Hospital context banner, Emergency Mode toggle, 5-stage chronological pipeline (Admission, Investigation, Procedure, Billing, Discharge/Recovery), CareJourneySimulator widget, Active Alerts list, Financial Snapshot delta panel, Documentation Checklists.")
    add_bullet(doc, "Interactive Control 1 (Simulate Room Upgrade)", "User selects 'Twin Sharing -> Single Private Room' in simulator -> postJourneyEvent API -> journeyGuidanceEngine evaluates room cap breach -> fires Proportionate Deduction alert -> recalculates out-of-pocket financial delta.")
    add_bullet(doc, "Interactive Control 2 (Why Am I Seeing This?)", "Clicking 'Why Am I Seeing This?' opens WhyExplanationModal displaying: Policy Rule, Allowed Value, Actual Patient Value, Financial Consequence, and Suggested Action.")

    # ---------------------------------------------------------
    # PHASE 4: COMPLETE USER JOURNEY (DUAL LANGUAGE)
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 4 — COMPLETE USER JOURNEY (SIMPLE VS TECHNICAL)")

    add_heading_2(doc, "4.1 Simple Language Explanation (For Non-Technical Judges)")
    add_bullet(doc, "Step 1: Upload", "'The patient uploads their health insurance policy or picks a demo policy. Our system reads the fine print and finds their sum insured, room limits, and co-payment rules.'")
    add_bullet(doc, "Step 2: Confirmation", "'The patient reviews what was extracted. If something is missing or ambiguous, they can confirm or adjust it before proceeding.'")
    add_bullet(doc, "Step 3: Discovery", "'The patient chooses their city and medical treatment. SehatSure searches thousands of hospitals, checks whether their insurer has a cashless tie-up, and calculates their estimated out-of-pocket expense.'")
    add_bullet(doc, "Step 4: Smart Ranking", "'We rank hospitals using a Policy Fit Score so patients don't just see the cheapest hospital, but the one that maximizes insurance coverage and minimizes surprise deductions.'")
    add_bullet(doc, "Step 5: Journey Guidance", "'Once admitted, our Care Journey guidance alerts the patient to room rent breaches, pre-authorization deadlines, and discharge documents, ensuring cashless claims are protected end-to-end.'")

    add_heading_2(doc, "4.2 Technical Language Explanation (For Technical Judges)")
    add_bullet(doc, "Step 1: Ingestion & Extraction", "'The PDF buffer is parsed via pdf-parse or sent as inline base64 to Gemini 3.1 Flash Lite with temperature 0. The output is parsed against a strict Zod schema with an automated retry loop on validation failure.'")
    add_bullet(doc, "Step 2: Statutory Normalization", "'overrideService applies scheme-specific statutory rules for PM-JAY and ESI, overriding missing values with legally mandated defaults and tagging them with confidence='assumed'.' ")
    add_bullet(doc, "Step 3: Streaming Query & Network Matching", "'hospitalService queries an in-memory Map of stream-parsed hospitals. networkMatchingService executes canonical alias matching against an empanelment registry, assigning 4-state network statuses: verified, unverified, no_match, unknown.'")
    add_bullet(doc, "Step 4: Multi-Attribute Decision Scoring", "'calculatePolicyImpact evaluates procedure cost, room caps, proportionate deduction, deductibles, and co-pays. rankHospitals computes a 4-pillar score: 50% Coverage Fit, 25% Patient Cost Fit, 15% Hospital Type Score, and 10% Co-Pay Fit.'")
    add_bullet(doc, "Step 5: Event-Driven Lifecycle Guidance", "'journeyGuidanceEngine consumes hospital events, computes real-time financial deltas, generates structured WhyExplanation objects, and persists state in MongoDB with offline client-side fallback.'")

    # ---------------------------------------------------------
    # PHASE 5: FEATURE-BY-FEATURE FORENSIC AUDIT
    # ---------------------------------------------------------
    add_heading_1(doc, "PHASE 5 — FEATURE-BY-FEATURE FORENSIC AUDIT")

    features = [
        {
            "name": "1. AI Policy Extraction Pipeline",
            "what": "Extracts 25+ structured policy variables from insurance policy PDFs using LLM and rule normalization.",
            "why": "Indian health insurance policies are 30-50 pages long with complex legal tables and ambiguous terminology.",
            "input": "PDF file buffer (multipart/form-data under field 'file').",
            "output": "ExtractedPolicyZod compliant JSON object with source snippets and confidence ratings.",
            "ai_truth": "GENUINELY AI: Gemini 3.1 Flash Lite prompt with JSON schema enforcement and zero temperature.",
            "limitations": "Scanned photocopies with poor contrast may fail OCR text extraction.",
            "trap": "Judge asks: 'What happens if the LLM hallucinates an insurance limit?'",
            "defense": "We enforce strict Zod validation with a self-correcting retry loop. Furthermore, the UI enforces a mandatory human-in-the-loop review on CoverageSummaryPage before any recommendation engine runs.",
            "no_claim": "Do NOT claim 100% autonomous accuracy or zero human intervention."
        },
        {
            "name": "2. Statutory Scheme Engine (PM-JAY & ESI)",
            "what": "Automatically applies statutory overrides for Ayushman Bharat (PM-JAY) and ESI schemes.",
            "why": "Government schemes have statutory legal terms (e.g. ₹5 Lakh cover, 100% cashless, zero room rent cap) that supersede private policy clauses.",
            "input": "Policy document marked with policyType='pmjay' or 'esi'.",
            "output": "Enforced statutory constraints with confidence='assumed' and legal citations.",
            "ai_truth": "DETERMINISTIC LOGIC: Written in server/src/services/overrideService.ts.",
            "limitations": "Currently models central PM-JAY and ESI rules; state-specific sub-schemes (e.g. Arogya Karnataka) use central rules.",
            "trap": "Judge asks: 'Why did AI extract unlimited SI for ESI?'",
            "defense": "AI did not extract unlimited SI; our overrideService deterministically sets sumInsured to null because under the ESI Act, medical benefit is statutory and legally unlimited.",
            "no_claim": "Do NOT claim AI deduced Indian statutory law on its own."
        },
        {
            "name": "3. 54,000+ Hospital In-Memory Search Engine",
            "what": "Indexes over 54,000 Indian hospitals, extracts cities from unstructured addresses, and filters by city, specialty, and network status in <5ms.",
            "why": "Querying 54k rows in MongoDB on a free cloud tier introduces latency and memory spikes. In-memory indexing guarantees instantaneous search.",
            "input": "City string, specialty string, procedure string, networkOnly boolean.",
            "output": "HospitalSearchResult containing ranked hospitals, average city cost, and explicit facility counts.",
            "ai_truth": "DATA-DRIVEN LOGIC & HEURISTICS: Node stream readline + Map indexing + string interning.",
            "limitations": "Hospital dataset is a reference snapshot from open government/curated registries; freshness is unknown.",
            "trap": "Judge asks: 'How do you prevent Render from crashing with 54,000 records?'",
            "defense": "We implemented stream-parsing with Node readline and a custom string intern pool (STRING_POOL). This collapses duplicate city and insurer strings, keeping heap memory under 150MB against a 450MB node limit.",
            "no_claim": "Do NOT claim this is a live real-time API connection to hospital beds."
        },
        {
            "name": "4. 4-State Network Matching Service",
            "what": "Verifies insurer empanelment into verified, unverified, no_match, or unknown.",
            "why": "Prevents misleading patients into believing a hospital offers cashless coverage when data is missing or unverified.",
            "input": "Hospital record insurers list vs policy insurer and aliases.",
            "output": "HospitalNetworkInfo with networkStatus, matchMethod, and freshness disclosure.",
            "ai_truth": "DETERMINISTIC REGISTRY: CANONICAL_INSURER_REGISTRY with 16 major Indian insurers and 100+ aliases.",
            "limitations": "Empanelment tie-ups change dynamically between TPAs and hospitals.",
            "trap": "Judge asks: 'What if a hospital is network, but your dataset says unverified?'",
            "defense": "We deliberately bias towards patient safety. If hospital data is missing, we classify it as 'unverified' with a warning to check with the TPA desk, rather than falsely promising cashless admission.",
            "no_claim": "Do NOT claim real-time TPA API verification."
        },
        {
            "name": "5. Three-Tier Cost Estimation Engine",
            "what": "Estimates hospital treatment bills at procedure-level, specialty average, or tier average.",
            "why": "Patients need indicative treatment budgets before admission, but exact pricing depends on operative findings.",
            "input": "Hospital segment, tier, specialty, procedure, room category.",
            "output": "HospitalEstimate with procedure charges, doctor fees (20%), medicines/labs (10%), and room charges.",
            "ai_truth": "DATA-DRIVEN DETERMINISTIC CALCULATION: Bound strictly between low_cost and highest_cost in benchmark CSVs with deterministic hash jitter.",
            "limitations": "Estimates are clinical benchmarks, not binding hospital quotations.",
            "trap": "Judge asks: 'Is this an exact bill quotation?'",
            "defense": "No, and we never claim it is. It is an indicative benchmark derived from tier-stratified cost datasets, adjusted for hospital segment and room category per IRDAI billing norms.",
            "no_claim": "Do NOT call this an exact hospital price."
        },
        {
            "name": "6. Decision Radar: Policy Fit Score Formula",
            "what": "Calculates an objective 0-100 compatibility score between policy terms and hospital attributes.",
            "why": "Patients shouldn't just pick the cheapest hospital; they need to optimize insurance coverage and minimize out-of-pocket leakage.",
            "input": "Continuous coverage fit, patient cost fit, hospital type score, co-pay fit.",
            "output": "finalScore (0-100) and granularScore (1 decimal place) with ScoreBreakdown.",
            "ai_truth": "DETERMINISTIC MULTI-CRITERIA DECISION ANALYSIS (MCDA): 50% Coverage, 25% Cost, 15% Type, 10% Co-pay.",
            "limitations": "Weights are expert-heuristic based; not derived from machine learning regression.",
            "trap": "Judge asks: 'Why is coverage fit weighted at 50%?'",
            "defense": "In health insurance decision support, insurance protection and avoiding proportionate deduction penalties are the primary financial risk factors for a hospitalized family.",
            "no_claim": "Do NOT claim the weights were trained by a machine learning model."
        },
        {
            "name": "7. Inpatient Care Journey Simulator & Guidance Engine",
            "what": "Tracks hospitalization events in real-time, audits policy limits, and fires proactive alerts.",
            "why": "Most insurance disallowances occur during admission due to room upgrades or delayed pre-authorization.",
            "input": "JourneyEvent (e.g. ROOM_ASSIGNED, PREAUTH_PENDING, DISCHARGE_INITIATED).",
            "output": "EvaluationResult with insuranceImpact, alert, financialSnapshot, and WhyExplanation.",
            "ai_truth": "RULE-BASED INTELLIGENCE: 14 deterministic event handlers evaluating policy clauses.",
            "limitations": "Events in the demo are triggered via simulator rather than live hospital HL7/FHIR feeds.",
            "trap": "Judge asks: 'How do you receive hospital events in production?'",
            "defense": "In production, this engine connects to ABDM / FHIR hospital management feeds. For the prototype, we created an event simulator to prove the decision engine's reactive guidance.",
            "no_claim": "Do NOT claim live integration with hospital EHR systems."
        }
    ]

    for f in features:
        add_heading_2(doc, f["name"])
        add_bullet(doc, "What It Does", f["what"])
        add_bullet(doc, "Why It Exists", f["why"])
        add_bullet(doc, "Inputs & Outputs", f"Input: {f['input']} | Output: {f['output']}")
        add_bullet(doc, "AI vs Rules Truth", f["ai_truth"])
        add_bullet(doc, "Current Limitation", f["limitations"])
        add_bullet(doc, "Judge Trap & Defense", f"Trap: {f['trap']}\nDefense: {f['defense']}")
        add_bullet(doc, "DO NOT CLAIM", f["no_claim"], bold_title=True)
