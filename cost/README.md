# Hospital Estimated Cost Calculator (Standalone Prototype)

> [!IMPORTANT]
> ### NOTICE: LEGACY / STANDALONE REFERENCE PROTOTYPE (NON-AUTHORITATIVE)
> This directory (`cost/`) contains an early standalone client-side prototype and reference implementation created prior to full application integration.
> **DO NOT MODIFY THIS DIRECTORY TO IMPLEMENT BUSINESS LOGIC CHANGES.**
>
> The integrated SehatSure application uses:
> - **Authoritative Backend Services**: Located in `server/src/services/` (`hospitalService.ts`, `overrideService.ts`, etc.)
> - **Authoritative Datasets**: Located in the repository root (`hospitals.csv`, `pvt_costs.csv`, `govt_costs.csv`).
>
> The CSV copies in `cost/` and `cost/data/` are retained solely for standalone offline demonstration of this prototype and must not be used as the source of truth for the integrated platform.

A high-performance, standalone web prototype for estimating hospital treatment and procedure costs across India. Designed as a reference implementation for integration into the **SehatSure** platform.

Built strictly with **HTML, CSS, and Vanilla JavaScript** with **zero external libraries or backend servers**.

---

## 1. Overview & Key Capabilities

- **50,000+ Hospital Database**: Parses, normalizes, and indexes over 54,000 healthcare facilities client-side in under 1 second.
- **Robust City Extraction**: Extracts and cleans city names from complex Indian addresses (including comma-separated locations, road markers, and state names).
- **Dynamic Cascading Filters**:
  - **City** (Searchable with autocomplete)
  - **Hospital Type** (`Any`, `Government`, `Private`)
  - **Specialty** (Extracted dynamically from the datasets)
  - **Procedure** (Dynamically cascaded based on the chosen specialty)
  - **Room Category** (`General Ward`, `Twin Sharing`, `Single Private Room`)
- **Three-Tier Estimation Granularity**:
  1. **Procedure-Level (Exact)**: Matches hospital tier, specialty, and procedure for the most accurate quote.
  2. **Specialty-Level (Average)**: Calculates weighted average across all procedures within a specialty if no specific procedure is selected.
  3. **City/Tier-Level (Broad Average)**: Averages all clinical records for the hospital's tier when searching by city alone.
- **100% Deterministic Pricing**: No `Math.random()`. The same hospital always gets the exact same estimate, with small individualized differences (±5%) bounded strictly within the cost dataset ranges.

---

## 2. Project Structure

```text
c:\Users\eduko\Downloads\cost\
│
├── index.html        # Clean semantic markup and accessible UI components
├── style.css         # Modern enterprise healthcare styling (Deep Teal theme)
├── app.js            # CSV parser, indexing, pricing engine & UI controller
│
├── data/             # Primary data directory (detected automatically)
│   ├── hospitals.csv # ~55,000 hospital records
│   ├── pvt_costs.csv # Private hospital procedures & room rates by tier
│   └── govt_costs.csv# Government hospital procedures & room rates by tier
│
└── README.md         # Documentation and run instructions
```

*Note: The application detects CSV files in both `./data/` and the root folder `./`.*

---

## 3. Dataset Specifications

### `hospitals.csv`
- `hospital_name`: Facility name.
- `hospital_type`: `Private` or `Government`.
- `address`: Full address string (e.g. `"NARWAL BYE PASS ROAD JAMMU, Jammu and Kashmir"`).
- `insurers`: Comma-separated list of empaneled health insurance providers (e.g. `PMJAY, Care Health, HDFC`).
- `rating`: Float rating (e.g. `4.1`). If `0.0` or missing, the UI displays *"Rating unavailable"*.
- `specialties`: Semicolon-separated specialties list.
- `tier`: Geographic tier (`Metro 1`, `Metro 2`, `Large City 1`, `Large City 2`, `City 1`, `City 2`, `Town 1`, `Town 2`).
- `segment`: Hospital tier classification (`Budget/Local`, `Standard Private`, `Established`, `Premium`, `Luxury`, `Government`).

### `pvt_costs.csv` & `govt_costs.csv`
- `tier`: Geographic tier.
- `specialty`: Clinical department (Cardiology, Orthopedics, Neurology, etc.).
- `procedure`: Surgical or medical procedure name (CABG, Knee Replacement, etc.).
- `low_cost`: Minimum procedure cost benchmark.
- `highest_cost`: Maximum procedure cost benchmark.
- `mean_cost`: Baseline average cost benchmark.
- `estimated_stay_days`: Expected inpatient stay duration in days.
- `general_ward_cost_per_day`: Daily charge for general ward.
- `twin_sharing_cost_per_day`: Daily charge for twin-sharing room.
- `single_private_room_cost_per_day`: Daily charge for single private room.

---

## 4. Pricing & Mathematical Model

The calculator avoids arbitrary multipliers and bounds all estimates strictly between the dataset's `low_cost` and `highest_cost`.

```text
                 USER SELECTION
                       ↓
                      CITY
                       ↓
                    HOSPITAL
                       ↓
        ┌──────────────┴──────────────┐
        ↓                             ↓
      TIER                      HOSPITAL TYPE
        ↓                             ↓
   COST RANGE                  PRIVATE/GOVT CSV
        ↓
    SPECIALTY
        ↓
    PROCEDURE
        ↓
  SEGMENT POSITION
        ↓
  DETERMINISTIC
  HOSPITAL VARIATION (±5%)
        ↓
     ROOM COST
        ↓
   FINAL ESTIMATE
```

### 4.1. Segment Position Model

Hospital segments represent relative positions within the range `[low_cost, mean_cost, highest_cost]`:

```javascript
const SEGMENT_POSITION = {
  "Budget/Local": 0.25,      // Lower quartile between low_cost and mean_cost
  "Standard Private": 0.40,  // Lower-middle
  "Established": 0.50,       // Exactly at mean_cost
  "Premium": 0.65,           // Upper-middle between mean_cost and highest_cost
  "Luxury": 0.80             // Upper part approaching highest_cost
};
```

**Piecewise Linear Interpolation Formula**:
- For Private Hospitals:
  - If `position <= 0.5`:
    $$\text{cost} = \text{low\_cost} + (\text{mean\_cost} - \text{low\_cost}) \times \left(\frac{\text{position}}{0.5}\right)$$
  - If `position > 0.5`:
    $$\text{cost} = \text{mean\_cost} + (\text{highest\_cost} - \text{mean\_cost}) \times \left(\frac{\text{position} - 0.5}{0.5}\right)$$
- For Government Hospitals:
  $$\text{cost} = \text{mean\_cost}$$
  *(Government hospitals exclusively use `govt_costs.csv` and do not use private segment positions).*

### 4.2. Deterministic Hospital Variation

To ensure 50,000 hospitals do not produce identical quotes while guaranteeing complete consistency across sessions, a deterministic hash is generated:

```javascript
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getHospitalSeed(hospital) {
  const key = [
    hospital.hospital_name,
    hospital.address,
    hospital.tier,
    hospital.segment
  ].join("|").toLowerCase().trim();
  return hashString(key);
}

function getHospitalVariation(hospital) {
  const seed = getHospitalSeed(hospital);
  return ((seed % 1001) / 1000) * 0.10 - 0.05; // Generates -0.05 to +0.05 (-5% to +5%)
}
```

The variation is applied to treatment cost and clamped:
```javascript
treatmentCost = segmentAdjustedCost * (1 + hospitalVariation);
treatmentCost = Math.max(lowCost, Math.min(treatmentCost, highestCost));
```

### 4.3. Room Charges

Room cost is computed independently without treatment variation:
```javascript
roomCost = roomCostPerDay * estimatedStayDays;
totalCost = treatmentCost + roomCost;
```

---

## 5. How to Run the Application

Because modern web browsers enforce CORS restrictions on local file requests via the `file://` protocol, the application must be served over HTTP:

### Option A: Using Python (Recommended)
Open a terminal in this directory (`c:\Users\eduko\Downloads\cost`) and run:
```bash
python -m http.server 5500
```
Open your browser and navigate to:
```text
http://localhost:5500
```

### Option B: Using Node.js (npx)
```bash
npx serve -l 5500
```
Or:
```bash
npx http-server -p 5500
```

---

## 6. Porting to Main SehatSure Project

The pricing functions in `app.js` are decoupled from UI rendering:
- `getSegmentAdjustedCost()`
- `getHospitalVariation()`
- `calculateHospitalEstimate()`
- `extractCity()`

These pure functions can be moved directly into backend Node.js services or React/Next.js client stores without rewriting the pricing logic.
