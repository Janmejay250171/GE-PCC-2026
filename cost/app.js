/**
 * Hospital Estimated Cost Calculator - Core Engine & UI Controller
 * Pure Vanilla JavaScript (Zero External Dependencies)
 */

// ==========================================
// CONSTANTS & LOOKUPS
// ==========================================

const SEGMENT_POSITION = {
  "budget/local": 0.25,
  "budget": 0.25,
  "standard private": 0.40,
  "standard": 0.40,
  "established": 0.50,
  "premium": 0.65,
  "luxury": 0.80
};

const ROOM_KEYS = {
  "General Ward": "general_ward_cost_per_day",
  "Twin Sharing": "twin_sharing_cost_per_day",
  "Single Private Room": "single_private_room_cost_per_day"
};

const INDIAN_STATES = new Set([
  'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
  'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
  'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
  'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu',
  'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal',
  'andaman and nicobar islands', 'chandigarh', 'dadra and nagar haveli and daman and diu',
  'delhi', 'jammu and kashmir', 'ladakh', 'lakshadweep', 'puducherry',
  'daman and diu', 'dadra and nagar haveli', 'uttaranchal', 'orissa', 'pondicherry', 'nct of delhi'
]);

// App State
const state = {
  hospitals: [],
  pvtCosts: [],
  govtCosts: [],
  
  // Lookup Indexes
  hospitalsByCity: new Map(), // key: normalizedCity -> [hospitalObj]
  allCities: [],              // [{ name: string, count: number }]
  allSpecialties: [],         // [string]
  specialtyToProcedures: new Map(), // specialtyName -> Set(procedureNames)
  
  // Cost Index Maps
  costRecordsMap: new Map(),   // key: "type|tier|specialty|procedure" -> record
  tierSpecialtyMap: new Map(), // key: "type|tier|specialty" -> [records]
  tierMap: new Map(),          // key: "type|tier" -> [records]

  // Filter & Search State
  selectedCity: '',
  selectedType: 'Any',
  selectedSpecialty: '',
  selectedProcedure: '',
  selectedRoom: 'General Ward',
  sortBy: 'cost_asc', // 'cost_asc' | 'cost_desc' | 'rating'
  
  // Pagination State
  currentPage: 1,
  pageSize: 24,
  filteredHospitals: []
};

// ==========================================
// 1. DATA NORMALIZATION HELPERS
// ==========================================

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// ==========================================
// 2. CITY EXTRACTION & NORMALIZATION
// ==========================================

function cleanCandidateCity(s) {
  if (!s) return '';
  let str = s.trim();

  // Strip pincodes and "pin: ..." labels
  str = str.replace(/\bpin(?:\s*code)?\s*[-:]?\s*\d+/gi, '')
           .replace(/\b\d{6}\b/g, '')
           .replace(/\b\d+\b/g, '')
           .trim();

  // Strip leading & trailing punctuation
  str = str.replace(/^[\s,.\-:/()]+|[\s,.\-:/()]+$/g, '').trim();

  // Strip road/street/bypass prefixes if city follows
  // Example: "NARWAL BYE PASS ROAD JAMMU" -> "JAMMU"
  const roadKeywords = [
    'bye\\s*pass\\s*road', 'bypass\\s*road', 'bye\\s*pass', 'bypass',
    'national\\s*highway', 'ring\\s*road', 'main\\s*road',
    'road', 'rd\\b', 'street', 'st\\b', 'marg', 'lane', 'highway', 'hwy',
    'talab', 'chowk', 'chowka', 'circle', 'complex'
  ];

  for (const kw of roadKeywords) {
    const re = new RegExp(`\\b${kw}\\b(.*)$`, 'i');
    const match = str.match(re);
    if (match && match[1]) {
      const rest = match[1].replace(/^[,\s\-\/()]+/, '').trim();
      if (rest.length >= 2) {
        str = rest;
      }
    }
  }

  // Strip common location prefixes
  str = str.replace(/^(?:dist\.?|district|near|opp\.?|behind|beside|at|post|po|ps|taluka|tal|tehsil|mandal|ward)\s+/gi, '').trim();
  str = str.replace(/^[\s,.\-:/()]+|[\s,.\-:/()]+$/g, '').trim();

  if (str.length < 2 || str.length > 35) return '';
  if (INDIAN_STATES.has(str.toLowerCase())) return '';

  const ignoredWords = new Set([
    'road', 'street', 'cross', 'lane', 'main', 'floor', 'building',
    'chowk', 'village', 'opp', 'near', 'pin', 'null', 'na', 'hospital',
    'govt', 'private', 'plot', 'sector', 'block', 'phase'
  ]);
  if (ignoredWords.has(str.toLowerCase())) return '';

  return toTitleCase(str);
}

function extractCity(address) {
  if (!address || typeof address !== 'string') return 'Other';
  const cleanAddr = address.trim();

  // 1. Look for explicit ( City - XYZ ) tag
  const cityTagMatch = cleanAddr.match(/\(\s*city\s*[-:]\s*([^)]+)\)/i);
  if (cityTagMatch) {
    const c = cleanCandidateCity(cityTagMatch[1]);
    if (c) return c;
  }

  // Split by comma
  const parts = cleanAddr.split(',').map(p => p.trim()).filter(Boolean);

  // 2. Identify State towards the end and check prior parts
  for (let i = parts.length - 1; i >= 0; i--) {
    const rawPart = parts[i].replace(/\d+/g, '').replace(/[()]/g, '').trim().toLowerCase();
    if (INDIAN_STATES.has(rawPart)) {
      for (let j = i - 1; j >= 0; j--) {
        const c = cleanCandidateCity(parts[j]);
        if (c) return c;
      }
    }
  }

  // 3. Fallback: inspect parts backwards
  for (let i = parts.length - 1; i >= 0; i--) {
    const c = cleanCandidateCity(parts[i]);
    if (c) return c;
  }

  return 'Other';
}

function normalizeCity(city) {
  const norm = normalize(city);
  // Unify common aliases
  if (norm === 'bangalore') return 'Bengaluru';
  if (norm === 'gurgaon') return 'Gurugram';
  if (norm === 'bombay') return 'Mumbai';
  if (norm === 'calcutta') return 'Kolkata';
  if (norm === 'madras') return 'Chennai';
  if (norm === 'ahmed nagar') return 'Ahmednagar';
  return toTitleCase(city);
}

// ==========================================
// 3. DETERMINISTIC HOSPITAL VARIATION
// ==========================================

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
  ]
    .join("|")
    .toLowerCase()
    .trim();

  return hashString(key);
}

function getHospitalVariation(hospital) {
  const seed = getHospitalSeed(hospital);
  return ((seed % 1001) / 1000) * 0.10 - 0.05;
}

// ==========================================
// 4. SEGMENT ADJUSTED COST
// ==========================================

function getSegmentAdjustedCost(low, mean, high, segment, hospitalType) {
  const normType = normalize(hospitalType);
  if (normType === 'government') {
    return mean;
  }

  const normSegment = normalize(segment);
  const position = SEGMENT_POSITION[normSegment] !== undefined 
    ? SEGMENT_POSITION[normSegment] 
    : 0.50; // Default to Established (mean) if unspecified

  if (position <= 0.5) {
    return low + (mean - low) * (position / 0.5);
  } else {
    return mean + (high - mean) * ((position - 0.5) / 0.5);
  }
}

// ==========================================
// 5. CSV PARSER (Zero-Dependency, Robust)
// ==========================================

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      row.push(current);
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        rows.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  if (current !== '' || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

// Convert CSV rows into array of objects using first row as headers
function csvToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => normalize(h));
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] !== undefined ? row[j].trim() : '';
    }
    result.push(obj);
  }
  return result;
}

// ==========================================
// 6. RECORD NORMALIZATION
// ==========================================

function normalizeHospital(raw) {
  const extractedCity = extractCity(raw.address);
  const city = normalizeCity(extractedCity);

  let ratingVal = parseFloat(raw.rating);
  if (isNaN(ratingVal) || ratingVal <= 0) {
    ratingVal = 0;
  }

  // Parse specialties string (semicolon separated)
  const specialtiesList = (raw.specialties || "")
    .split(";")
    .map(s => s.trim())
    .filter(Boolean);

  return {
    hospital_name: raw.hospital_name || "Unnamed Hospital",
    hospital_type: raw.hospital_type || "Private",
    address: raw.address || "",
    city: city,
    insurers: raw.insurers || "PMJAY",
    rating: ratingVal,
    specialties: specialtiesList,
    tier: raw.tier || "City 1",
    segment: raw.segment || "Standard Private"
  };
}

function normalizeCostRecord(raw) {
  return {
    tier: raw.tier || "",
    specialty: raw.specialty || "",
    procedure: raw.procedure || "",
    low_cost: parseFloat(raw.low_cost) || 0,
    highest_cost: parseFloat(raw.highest_cost) || 0,
    mean_cost: parseFloat(raw.mean_cost) || 0,
    estimated_stay_days: parseFloat(raw.estimated_stay_days) || 0,
    general_ward_cost_per_day: parseFloat(raw.general_ward_cost_per_day) || 0,
    twin_sharing_cost_per_day: parseFloat(raw.twin_sharing_cost_per_day) || 0,
    single_private_room_cost_per_day: parseFloat(raw.single_private_room_cost_per_day) || 0
  };
}

// ==========================================
// 7. INDEX BUILDING & PRECOMPUTATION
// ==========================================

function buildIndexes() {
  state.hospitalsByCity.clear();
  state.costRecordsMap.clear();
  state.tierSpecialtyMap.clear();
  state.tierMap.clear();
  state.specialtyToProcedures.clear();

  // 1. Index Hospitals by City
  const cityCounts = new Map();
  for (const h of state.hospitals) {
    const normC = normalize(h.city);
    if (!state.hospitalsByCity.has(normC)) {
      state.hospitalsByCity.set(normC, []);
    }
    state.hospitalsByCity.get(normC).push(h);

    const count = (cityCounts.get(h.city) || 0) + 1;
    cityCounts.set(h.city, count);
  }

  // Build sorted allCities list
  state.allCities = Array.from(cityCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 2. Index Costs for both Private & Government
  const datasets = [
    { type: 'private', records: state.pvtCosts },
    { type: 'government', records: state.govtCosts }
  ];

  const specSet = new Set();

  for (const ds of datasets) {
    for (const r of ds.records) {
      const normTier = normalize(r.tier);
      const normSpec = normalize(r.specialty);
      const normProc = normalize(r.procedure);

      // Save to distinct specialties & procedure map
      if (r.specialty) {
        specSet.add(r.specialty);
        if (!state.specialtyToProcedures.has(r.specialty)) {
          state.specialtyToProcedures.set(r.specialty, new Set());
        }
        if (r.procedure) {
          state.specialtyToProcedures.get(r.specialty).add(r.procedure);
        }
      }

      // Exact procedure index
      const exactKey = `${ds.type}|${normTier}|${normSpec}|${normProc}`;
      state.costRecordsMap.set(exactKey, r);

      // Specialty list index
      const specKey = `${ds.type}|${normTier}|${normSpec}`;
      if (!state.tierSpecialtyMap.has(specKey)) {
        state.tierSpecialtyMap.set(specKey, []);
      }
      state.tierSpecialtyMap.get(specKey).push(r);

      // Tier list index
      const tierKey = `${ds.type}|${normTier}`;
      if (!state.tierMap.has(tierKey)) {
        state.tierMap.set(tierKey, []);
      }
      state.tierMap.get(tierKey).push(r);
    }
  }

  state.allSpecialties = Array.from(specSet).sort();
}

// ==========================================
// 8. COST LOOKUP & AGGREGATIONS
// ==========================================

function getCostDataset(hospitalType) {
  const normType = normalize(hospitalType);
  return normType === 'government' ? 'government' : 'private';
}

function computeAggregateFromList(list) {
  if (!list || list.length === 0) return null;
  const count = list.length;
  let sumLow = 0, sumMean = 0, sumHigh = 0, sumStay = 0;
  let sumGen = 0, sumTwin = 0, sumSingle = 0;

  for (const r of list) {
    sumLow += r.low_cost;
    sumMean += r.mean_cost;
    sumHigh += r.highest_cost;
    sumStay += r.estimated_stay_days;
    sumGen += r.general_ward_cost_per_day;
    sumTwin += r.twin_sharing_cost_per_day;
    sumSingle += r.single_private_room_cost_per_day;
  }

  return {
    low_cost: Math.round(sumLow / count),
    mean_cost: Math.round(sumMean / count),
    highest_cost: Math.round(sumHigh / count),
    estimated_stay_days: Math.round((sumStay / count) * 10) / 10,
    general_ward_cost_per_day: Math.round(sumGen / count),
    twin_sharing_cost_per_day: Math.round(sumTwin / count),
    single_private_room_cost_per_day: Math.round(sumSingle / count),
    isAggregate: true
  };
}

function getCostRecord(hospitalType, tier, specialty, procedure) {
  const dsType = getCostDataset(hospitalType);
  const normTier = normalize(tier);
  const normSpec = normalize(specialty);
  const normProc = normalize(procedure);

  // 1. Exact: tier + specialty + procedure
  if (normSpec && normProc) {
    const exactKey = `${dsType}|${normTier}|${normSpec}|${normProc}`;
    if (state.costRecordsMap.has(exactKey)) {
      return {
        record: state.costRecordsMap.get(exactKey),
        level: 'procedure'
      };
    }
  }

  // 2. Specialty-only: tier + specialty
  if (normSpec) {
    const specKey = `${dsType}|${normTier}|${normSpec}`;
    const list = state.tierSpecialtyMap.get(specKey);
    if (list && list.length > 0) {
      return {
        record: computeAggregateFromList(list),
        level: 'specialty'
      };
    }
  }

  // 3. Tier average (City-only)
  const tierKey = `${dsType}|${normTier}`;
  const tierList = state.tierMap.get(tierKey);
  if (tierList && tierList.length > 0) {
    return {
      record: computeAggregateFromList(tierList),
      level: 'tier'
    };
  }

  // 4. Global fallback
  return {
    record: null,
    level: 'unavailable'
  };
}

// ==========================================
// 9. ROOM & ESTIMATE CALCULATIONS
// ==========================================

function calculateRoomCost(costRecord, roomType) {
  if (!costRecord) return 0;
  const colKey = ROOM_KEYS[roomType] || ROOM_KEYS["General Ward"];
  const roomCostPerDay = costRecord[colKey] || 0;
  const stayDays = costRecord.estimated_stay_days || 0;
  return roomCostPerDay * stayDays;
}

function calculateHospitalEstimate(hospital, specialty, procedure, roomType) {
  const lookup = getCostRecord(hospital.hospital_type, hospital.tier, specialty, procedure);
  if (!lookup.record) {
    return {
      available: false,
      message: "Estimated cost unavailable"
    };
  }

  const rec = lookup.record;
  const lowCost = rec.low_cost;
  const meanCost = rec.mean_cost;
  const highestCost = rec.highest_cost;

  // 1. Segment-adjusted cost
  const segmentAdjustedCost = getSegmentAdjustedCost(
    lowCost,
    meanCost,
    highestCost,
    hospital.segment,
    hospital.hospital_type
  );

  // 2. Deterministic hospital variation (-5% to +5%)
  const hospitalVariation = getHospitalVariation(hospital);

  // 3. Treatment cost with variation bounded by dataset limits
  let treatmentCost = segmentAdjustedCost * (1 + hospitalVariation);
  treatmentCost = Math.max(lowCost, Math.min(treatmentCost, highestCost));

  // 4. Room cost (no variation applied)
  const roomCost = calculateRoomCost(rec, roomType);
  const totalCost = treatmentCost + roomCost;

  // 5. Cost display range (bounded display around deterministic treatment cost + room charges)
  const displayLow = Math.max(lowCost, treatmentCost * 0.90) + roomCost;
  const displayHigh = Math.min(highestCost, treatmentCost * 1.10) + roomCost;

  return {
    available: true,
    level: lookup.level,
    lowCost,
    meanCost,
    highestCost,
    segmentAdjustedCost,
    hospitalVariation,
    treatmentCost: Math.round(treatmentCost),
    roomCost: Math.round(roomCost),
    totalCost: Math.round(totalCost),
    displayLow: Math.round(displayLow),
    displayHigh: Math.round(displayHigh),
    estimatedStayDays: rec.estimated_stay_days
  };
}

// ==========================================
// 10. FORMATTING HELPERS
// ==========================================

function formatCurrency(amount) {
  if (isNaN(amount) || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// ==========================================
// 11. DATA FETCHING & INITIALIZATION
// ==========================================

async function tryFetchCSV(fileName) {
  // First try ./data/fileName, then fallback to ./fileName
  const paths = [`./data/${fileName}`, `./${fileName}`];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      // Continue to next path
    }
  }
  throw new Error(`Failed to load ${fileName} from both ./data/ and ./ root paths.`);
}

async function loadData() {
  const loadingEl = document.getElementById('loading-overlay');
  const loadingStatusEl = document.getElementById('loading-status');

  try {
    if (loadingStatusEl) loadingStatusEl.textContent = 'Loading hospital & pricing datasets...';

    const [hospText, pvtText, govtText] = await Promise.all([
      tryFetchCSV('hospitals.csv'),
      tryFetchCSV('pvt_costs.csv'),
      tryFetchCSV('govt_costs.csv')
    ]);

    if (loadingStatusEl) loadingStatusEl.textContent = 'Parsing CSV records...';
    
    // Parse CSVs
    const hospRows = parseCSV(hospText);
    const pvtRows = parseCSV(pvtText);
    const govtRows = parseCSV(govtText);

    if (loadingStatusEl) loadingStatusEl.textContent = 'Normalizing hospital data & indexing cities...';

    const rawHospitals = csvToObjects(hospRows);
    const rawPvt = csvToObjects(pvtRows);
    const rawGovt = csvToObjects(govtRows);

    state.hospitals = rawHospitals.map(normalizeHospital);
    state.pvtCosts = rawPvt.map(normalizeCostRecord);
    state.govtCosts = rawGovt.map(normalizeCostRecord);

    buildIndexes();

    if (loadingStatusEl) loadingStatusEl.textContent = 'Initializing interface...';

    initUI();

    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
  } catch (error) {
    console.error("Error initializing calculator:", error);
    if (loadingStatusEl) {
      loadingStatusEl.innerHTML = `
        <div style="color: #ef4444; font-weight: 600; margin-bottom: 8px;">Error loading CSV files</div>
        <div style="font-size: 0.85rem; color: #64748b;">
          ${error.message}<br><br>
          <em>Please ensure the application is served via a local HTTP server (e.g. <code>python -m http.server 5500</code>).</em>
        </div>
      `;
    }
  }
}

// ==========================================
// 12. UI INITIALIZATION & EVENT LISTENERS
// ==========================================

function initUI() {
  populateCityDropdown();
  populateSpecialtyDropdown();
  setupEventListeners();

  // Set initial default city (first with highest hospital count)
  if (state.allCities.length > 0) {
    const defaultCity = state.allCities[0].name;
    const cityInput = document.getElementById('city-input');
    if (cityInput) {
      cityInput.value = defaultCity;
      state.selectedCity = defaultCity;
    }
    // Run initial calculation
    handleSearch();
  }
}

function populateCityDropdown() {
  const datalist = document.getElementById('city-datalist');
  if (!datalist) return;

  datalist.innerHTML = '';
  // Populate datalist with popular cities
  for (const c of state.allCities) {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.label = `${c.name} (${c.count} hospitals)`;
    datalist.appendChild(opt);
  }
}

function populateSpecialtyDropdown() {
  const specSelect = document.getElementById('specialty-select');
  if (!specSelect) return;

  specSelect.innerHTML = '<option value="">Any Specialty</option>';
  for (const spec of state.allSpecialties) {
    const opt = document.createElement('option');
    opt.value = spec;
    opt.textContent = spec;
    specSelect.appendChild(opt);
  }
}

function updateProcedureDropdown() {
  const procSelect = document.getElementById('procedure-select');
  if (!procSelect) return;

  const currentSpec = state.selectedSpecialty;
  procSelect.innerHTML = '<option value="">Any Procedure</option>';

  if (currentSpec && state.specialtyToProcedures.has(currentSpec)) {
    const procedures = Array.from(state.specialtyToProcedures.get(currentSpec)).sort();
    for (const proc of procedures) {
      const opt = document.createElement('option');
      opt.value = proc;
      opt.textContent = proc;
      procSelect.appendChild(opt);
    }
    procSelect.disabled = false;
  } else {
    procSelect.disabled = true;
    state.selectedProcedure = '';
  }
}

function setupEventListeners() {
  const cityInput = document.getElementById('city-input');
  const typeSelect = document.getElementById('type-select');
  const specSelect = document.getElementById('specialty-select');
  const procSelect = document.getElementById('procedure-select');
  const roomSelect = document.getElementById('room-select');
  const sortSelect = document.getElementById('sort-select');
  const searchForm = document.getElementById('calculator-form');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const resetBtn = document.getElementById('reset-btn');

  // Specialty change -> cascade procedure options
  if (specSelect) {
    specSelect.addEventListener('change', (e) => {
      state.selectedSpecialty = e.target.value;
      state.selectedProcedure = '';
      updateProcedureDropdown();
      handleSearch();
    });
  }

  // Procedure change
  if (procSelect) {
    procSelect.addEventListener('change', (e) => {
      state.selectedProcedure = e.target.value;
      handleSearch();
    });
  }

  // Hospital Type change
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      state.selectedType = e.target.value;
      handleSearch();
    });
  }

  // Room Type change
  if (roomSelect) {
    roomSelect.addEventListener('change', (e) => {
      state.selectedRoom = e.target.value || 'General Ward';
      handleSearch();
    });
  }

  // Sort change
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applySortingAndRender();
    });
  }

  // City change on blur/input
  if (cityInput) {
    cityInput.addEventListener('change', (e) => {
      state.selectedCity = e.target.value.trim();
      handleSearch();
    });
  }

  // Form Submit
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (cityInput) {
        state.selectedCity = cityInput.value.trim();
      }
      handleSearch();
    });
  }

  // Reset Filters
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (cityInput) cityInput.value = state.allCities.length > 0 ? state.allCities[0].name : '';
      state.selectedCity = cityInput ? cityInput.value : '';
      if (typeSelect) typeSelect.value = 'Any';
      state.selectedType = 'Any';
      if (specSelect) specSelect.value = '';
      state.selectedSpecialty = '';
      updateProcedureDropdown();
      if (roomSelect) roomSelect.value = 'General Ward';
      state.selectedRoom = 'General Ward';
      if (sortSelect) sortSelect.value = 'cost_asc';
      state.sortBy = 'cost_asc';
      handleSearch();
    });
  }

  // Load More Button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      state.currentPage++;
      renderHospitalCards(false);
    });
  }
}

// ==========================================
// 13. SEARCH & CALCULATION CONTROLLER
// ==========================================

function handleSearch() {
  const city = state.selectedCity;
  if (!city) {
    showNotice("Please enter or select a city to calculate estimated costs.");
    return;
  }

  const normC = normalize(city);
  let hospitals = state.hospitalsByCity.get(normC);

  // If not exact match, check fuzzy prefix or partial match
  if (!hospitals || hospitals.length === 0) {
    for (const [key, list] of state.hospitalsByCity.entries()) {
      if (key.includes(normC) || normC.includes(key)) {
        hospitals = list;
        break;
      }
    }
  }

  if (!hospitals || hospitals.length === 0) {
    showNotice(`No hospitals found matching "${city}". Try selecting a city from the suggested list.`);
    return;
  }

  // Apply Hospital Type filter
  if (state.selectedType !== 'Any') {
    const filterType = normalize(state.selectedType);
    hospitals = hospitals.filter(h => normalize(h.hospital_type) === filterType);
  }

  // Apply Specialty filter (Hospital must offer selected specialty if specified)
  if (state.selectedSpecialty) {
    const normFilterSpec = normalize(state.selectedSpecialty);
    hospitals = hospitals.filter(h => {
      if (!h.specialties || h.specialties.length === 0) return false;
      return h.specialties.some(s => normalize(s) === normFilterSpec);
    });
  }

  // Calculate estimates for all matching hospitals
  const results = [];
  for (const h of hospitals) {
    const estimate = calculateHospitalEstimate(
      h,
      state.selectedSpecialty,
      state.selectedProcedure,
      state.selectedRoom
    );

    results.push({
      hospital: h,
      estimate: estimate
    });
  }

  state.filteredHospitals = results;
  state.currentPage = 1;

  renderSummaryBanner();
  applySortingAndRender();
}

function applySortingAndRender() {
  const sort = state.sortBy;

  state.filteredHospitals.sort((a, b) => {
    // If one is unavailable, push to end
    if (!a.estimate.available && b.estimate.available) return 1;
    if (a.estimate.available && !b.estimate.available) return -1;
    if (!a.estimate.available && !b.estimate.available) return 0;

    if (sort === 'cost_asc') {
      return a.estimate.totalCost - b.estimate.totalCost;
    } else if (sort === 'cost_desc') {
      return b.estimate.totalCost - a.estimate.totalCost;
    } else if (sort === 'rating') {
      return (b.hospital.rating || 0) - (a.hospital.rating || 0);
    }
    return 0;
  });

  state.currentPage = 1;
  renderHospitalCards(true);
}

// ==========================================
// 14. UI RENDERING
// ==========================================

function renderSummaryBanner() {
  const bannerEl = document.getElementById('summary-banner');
  if (!bannerEl) return;

  const count = state.filteredHospitals.length;
  if (count === 0) {
    bannerEl.classList.add('hidden');
    return;
  }

  bannerEl.classList.remove('hidden');

  // Compute City-wide aggregate range from filtered hospitals that have available estimates
  const valid = state.filteredHospitals.filter(item => item.estimate.available);
  let minCost = 0, maxCost = 0, avgTypical = 0, avgStay = 0;

  if (valid.length > 0) {
    minCost = Math.min(...valid.map(v => v.estimate.displayLow));
    maxCost = Math.max(...valid.map(v => v.estimate.displayHigh));
    const sumTypical = valid.reduce((acc, v) => acc + v.estimate.totalCost, 0);
    avgTypical = Math.round(sumTypical / valid.length);
    const sumStay = valid.reduce((acc, v) => acc + (v.estimate.estimatedStayDays || 0), 0);
    avgStay = Math.round((sumStay / valid.length) * 10) / 10;
  }

  const titleEl = document.getElementById('summary-title');
  const badgeEl = document.getElementById('summary-badge');
  const rangeEl = document.getElementById('summary-range');
  const typicalEl = document.getElementById('summary-typical');
  const stayEl = document.getElementById('summary-stay');
  const roomEl = document.getElementById('summary-room');

  // Precision Badge & Title
  let levelText = 'Approximate City Average';
  let badgeClass = 'badge-tier';
  if (state.selectedProcedure) {
    levelText = `Procedure: ${state.selectedProcedure}`;
    badgeClass = 'badge-exact';
  } else if (state.selectedSpecialty) {
    levelText = `Specialty: ${state.selectedSpecialty}`;
    badgeClass = 'badge-specialty';
  }

  if (titleEl) titleEl.textContent = `${state.selectedCity} • ${levelText}`;
  if (badgeEl) {
    badgeEl.className = `status-pill ${badgeClass}`;
    badgeEl.textContent = state.selectedProcedure ? 'Procedure Quotation' : (state.selectedSpecialty ? 'Specialty Average' : 'Broad Average');
  }

  if (rangeEl) rangeEl.textContent = valid.length > 0 ? `${formatCurrency(minCost)} – ${formatCurrency(maxCost)}` : 'N/A';
  if (typicalEl) typicalEl.textContent = valid.length > 0 ? formatCurrency(avgTypical) : 'N/A';
  if (stayEl) stayEl.textContent = `${avgStay} days`;
  if (roomEl) roomEl.textContent = state.selectedRoom;

  // Update Toolbar Count
  const countEl = document.getElementById('results-count');
  if (countEl) {
    countEl.textContent = `Showing ${count} hospital${count === 1 ? '' : 's'} in ${state.selectedCity}`;
  }
}

function showNotice(msg) {
  const container = document.getElementById('hospitals-container');
  const bannerEl = document.getElementById('summary-banner');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const countEl = document.getElementById('results-count');

  if (bannerEl) bannerEl.classList.add('hidden');
  if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
  if (countEl) countEl.textContent = '';

  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>${msg}</h3>
      </div>
    `;
  }
}

function renderHospitalCards(resetContainer = false) {
  const container = document.getElementById('hospitals-container');
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (!container) return;

  if (resetContainer) {
    container.innerHTML = '';
  }

  const startIdx = 0;
  const endIdx = state.currentPage * state.pageSize;
  const pageItems = state.filteredHospitals.slice(startIdx, endIdx);

  container.innerHTML = pageItems.map(item => renderHospitalCard(item)).join('');

  // Handle Load More visibility
  if (loadMoreBtn) {
    if (endIdx < state.filteredHospitals.length) {
      loadMoreBtn.classList.remove('hidden');
      loadMoreBtn.textContent = `Load More (${state.filteredHospitals.length - endIdx} remaining)`;
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }
}

function renderHospitalCard(item) {
  const h = item.hospital;
  const est = item.estimate;

  const isGovt = normalize(h.hospital_type) === 'government';
  const typeClass = isGovt ? 'badge-govt' : 'badge-pvt';

  // Format Rating: if rating is 0, display "Rating unavailable"
  const ratingHtml = h.rating > 0
    ? `<span class="rating-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> ${h.rating.toFixed(1)}</span>`
    : `<span class="rating-badge rating-na">Rating unavailable</span>`;

  // Specialties chips (show first 3, then +N more)
  const specChips = h.specialties && h.specialties.length > 0
    ? h.specialties.slice(0, 3).map(s => `<span class="chip">${s}</span>`).join('') + 
      (h.specialties.length > 3 ? `<span class="chip chip-more">+${h.specialties.length - 3}</span>` : '')
    : '<span class="text-muted">General healthcare</span>';

  // Accepted insurers
  const insurersList = h.insurers ? h.insurers : 'None listed';

  // Cost card content
  let costHtml = '';
  if (est.available) {
    const varSign = est.hospitalVariation >= 0 ? '+' : '';
    const varPercent = (est.hospitalVariation * 100).toFixed(1);

    costHtml = `
      <div class="card-pricing">
        <div class="price-header">
          <div class="price-range-label">Estimated Cost Range</div>
          <div class="price-range-val">${formatCurrency(est.displayLow)} – ${formatCurrency(est.displayHigh)}</div>
        </div>
        <div class="price-typical">
          <span class="label">Typical Estimate:</span>
          <span class="value">${formatCurrency(est.totalCost)}</span>
        </div>
        <div class="price-meta">
          <span>Stay: <strong>${est.estimatedStayDays} days</strong></span>
          <span>Room: <strong>${state.selectedRoom}</strong></span>
        </div>
        <details class="cost-breakdown">
          <summary>View Calculation Breakdown</summary>
          <div class="breakdown-details">
            <div class="bd-row">
              <span>Segment Base (${h.segment}):</span>
              <span>${formatCurrency(est.segmentAdjustedCost)}</span>
            </div>
            <div class="bd-row">
              <span>Hospital Variation:</span>
              <span>${varSign}${varPercent}%</span>
            </div>
            <div class="bd-row">
              <span>Treatment Cost:</span>
              <span>${formatCurrency(est.treatmentCost)}</span>
            </div>
            <div class="bd-row">
              <span>Room Cost (${state.selectedRoom}):</span>
              <span>${formatCurrency(est.roomCost)}</span>
            </div>
            <div class="bd-row bd-total">
              <span>Total Estimate:</span>
              <span>${formatCurrency(est.totalCost)}</span>
            </div>
          </div>
        </details>
      </div>
    `;
  } else {
    costHtml = `
      <div class="card-pricing pricing-unavailable">
        <div class="price-range-label">Estimated Cost</div>
        <div class="unavailable-text">Estimated cost unavailable</div>
        <p class="unavailable-sub">No matching cost records found for this tier.</p>
      </div>
    `;
  }

  return `
    <article class="hospital-card" id="hospital-${hashString(h.hospital_name + h.address)}">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="hospital-name" title="${h.hospital_name}">${h.hospital_name}</h3>
          ${ratingHtml}
        </div>
        <div class="card-badges">
          <span class="badge ${typeClass}">${h.hospital_type}</span>
          <span class="badge badge-tier">${h.tier}</span>
          <span class="badge badge-segment">${h.segment}</span>
        </div>
      </div>

      <div class="card-body">
        <p class="hospital-address" title="${h.address}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${h.address}
        </p>

        <div class="card-section">
          <div class="section-label">Specialties</div>
          <div class="chips-container">${specChips}</div>
        </div>

        <div class="card-section insurers-section">
          <div class="section-label">Accepted Insurers</div>
          <div class="insurers-text" title="${insurersList}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            ${insurersList}
          </div>
        </div>
      </div>

      ${costHtml}
    </article>
  `;
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', loadData);
