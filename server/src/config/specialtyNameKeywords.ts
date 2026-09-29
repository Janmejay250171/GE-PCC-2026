import { SpecialtyNameMatch } from '../types/hospital.js';

export interface KeywordTiers {
  strong: string[];
  medium: string[];
  weak: string[];
}

/**
 * Comprehensive mapping of medical specialties to hospital-name keywords.
 * Covers all specialties supported by the SehatSure dataset and clinical domains.
 * Keywords are organized by strength:
 * - strong (100 pts): highly specific medical terms and full department/institute titles
 * - medium (75 pts): strongly related anatomical/clinical terms common in dedicated facility names
 * - weak (40 pts): broader/generic terms that warrant a smaller boost without dominating
 */
export const SPECIALTY_NAME_KEYWORDS: Record<string, KeywordTiers> = {
  Cardiology: {
    strong: [
      'cardiology', 'cardiac', 'cardio', 'heart',
      'heart care', 'heart hospital', 'heart centre', 'heart center', 'heart institute',
      'cardiac care', 'cardiac hospital', 'cardiac centre', 'cardiac center', 'cardiac institute',
      'cardiology hospital', 'cardiology centre', 'cardiology center', 'cardiology institute',
      'cardiovascular', 'cardio vascular', 'cardio thoracic', 'cardiothoracic'
    ],
    medium: [
      'cath lab', 'angioplasty', 'bypass', 'coronary'
    ],
    weak: [
      'vascular', 'ecg', 'echo', 'chest pain'
    ]
  },

  Orthopedics: {
    strong: [
      'orthopedic', 'orthopaedic', 'orthopedics', 'orthopaedics', 'ortho',
      'orthopedic hospital', 'orthopaedic hospital', 'orthopedic centre', 'orthopaedic centre',
      'orthopedic center', 'orthopaedic center', 'orthopedic institute', 'orthopaedic institute',
      'ortho care', 'ortho hospital', 'ortho centre', 'ortho center',
      'bone and joint', 'bone & joint', 'joint care'
    ],
    medium: [
      'bone', 'bones', 'joint', 'joints',
      'spine', 'spine care', 'spine hospital', 'spine centre', 'spine center',
      'fracture', 'fracture clinic', 'arthritis', 'knee replacement', 'hip replacement'
    ],
    weak: [
      'trauma', 'trauma care', 'musculoskeletal'
    ]
  },

  Neurology: {
    strong: [
      'neurology', 'neurological', 'neuro', 'neuroscience', 'neurosciences',
      'neurocare', 'neuro care', 'neuro hospital', 'neuro centre', 'neuro center', 'neuro institute',
      'neurosurgery', 'neurosurgical', 'neuro science', 'neuro sciences',
      'brain centre', 'brain center', 'brain hospital', 'brain care', 'brain and spine'
    ],
    medium: [
      'brain', 'spine and brain', 'stroke', 'stroke care', 'stroke centre', 'stroke center',
      'epilepsy'
    ],
    weak: [
      'nerve', 'nerves', 'nervous', 'paralysis', 'headache'
    ]
  },

  Oncology: {
    strong: [
      'oncology', 'oncologist', 'oncological',
      'oncology centre', 'oncology center', 'oncology hospital', 'oncology institute',
      'cancer', 'cancer care', 'cancer centre', 'cancer center', 'cancer hospital', 'cancer institute',
      'tumor centre', 'tumor center', 'tumour centre', 'tumour center', 'tumor hospital', 'tumour hospital',
      'surgical oncology', 'radiation oncology', 'medical oncology'
    ],
    medium: [
      'tumor', 'tumour', 'chemotherapy', 'radiation therapy', 'radiotherapy',
      'palliative care', 'carcinoma', 'leukemia', 'lymphoma'
    ],
    weak: [
      'chemo', 'lesion', 'hospice'
    ]
  },

  Gynecology: {
    strong: [
      'gynecology', 'gynaecology', 'gynae', 'gyno', 'gynecological', 'gynaecological',
      'obstetrics', 'obstetric', 'obstetrics and gynecology', 'obg', 'obgyn',
      'gynecology hospital', 'gynaecology hospital', 'gynecology centre', 'gynaecology centre'
    ],
    medium: [
      'maternity', 'maternal', 'maternity hospital', 'maternity centre', 'maternity center', 'maternity home',
      'women', "women's", 'womens', 'women care', "women's care",
      'mother', 'mother care', 'mother and child', 'women hospital', 'women centre', 'women center',
      'birthing', 'birthing centre', 'birthing center'
    ],
    weak: [
      'fertility', 'ivf', 'newborn', 'natal'
    ]
  },

  Urology: {
    strong: [
      'urology', 'urologist', 'uro', 'urological',
      'urology centre', 'urology center', 'urology hospital', 'urology institute',
      'urology care', 'uro care',
      'kidney care centre', 'kidney care center', 'kidney hospital', 'renal hospital', 'renal institute'
    ],
    medium: [
      'urinary', 'kidney', 'kidney care', 'kidney centre', 'kidney center',
      'renal', 'renal care', 'renal centre', 'renal center',
      'prostate', 'lithotripsy', 'stone clinic', 'kidney stone'
    ],
    weak: [
      'bladder', 'urine'
    ]
  },

  Nephrology: {
    strong: [
      'nephrology', 'nephrologist', 'nephro', 'nephrological',
      'nephrology centre', 'nephrology center', 'nephrology hospital', 'nephrology institute'
    ],
    medium: [
      'renal', 'renal care', 'renal hospital', 'renal centre', 'renal center', 'renal institute',
      'kidney', 'kidney care', 'kidney hospital', 'kidney centre', 'kidney center',
      'dialysis', 'dialysis centre', 'dialysis center', 'hemodialysis', 'haemodialysis'
    ],
    weak: [
      'kidney stone', 'crf'
    ]
  },

  Gastroenterology: {
    strong: [
      'gastroenterology', 'gastroenterologist', 'gastro', 'gastrointestinal',
      'gastro centre', 'gastro center', 'gastro hospital', 'gastro institute',
      'surgical gastroenterology', 'medical gastroenterology'
    ],
    medium: [
      'digestive', 'digestive care', 'digestive disease', 'digestive diseases',
      'endoscopy', 'endoscopy centre', 'endoscopy center',
      'hepatology', 'hepatologist', 'hepato', 'hepatic', 'liver', 'liver care', 'liver hospital', 'liver centre', 'liver center'
    ],
    weak: [
      'gi', 'bowel', 'stomach', 'gut'
    ]
  },

  Pulmonology: {
    strong: [
      'pulmonology', 'pulmonologist', 'pulmonary', 'pulmo', 'pulmonary care',
      'pulmonology centre', 'pulmonology center', 'pulmonology hospital', 'pulmonology institute'
    ],
    medium: [
      'respiratory', 'respiratory care', 'respiratory hospital', 'respiratory centre', 'respiratory center',
      'lung', 'lungs', 'lung care', 'lung hospital', 'lung centre', 'lung center', 'lung institute',
      'chest', 'chest hospital', 'chest clinic', 'chest care', 'asthma', 'tb and chest'
    ],
    weak: [
      'allergy', 'bronchus', 'breathing', 'sleep apnea'
    ]
  },

  Dermatology: {
    strong: [
      'dermatology', 'dermatologist', 'dermatological', 'derma',
      'skin', 'skin care', 'skin hospital', 'skin centre', 'skin center', 'skin institute', 'skin clinic',
      'cosmetology', 'cosmetologist'
    ],
    medium: [
      'aesthetics', 'cosmetic', 'trichology', 'hair care', 'hair clinic', 'hair transplant'
    ],
    weak: [
      'laser', 'derm', 'complexion'
    ]
  },

  Ophthalmology: {
    strong: [
      'ophthalmology', 'ophthalmologist', 'ophthalmic',
      'eye', 'eyes', 'vision', 'eye care', 'eye hospital', 'eye centre', 'eye center',
      'eye institute', 'vision centre', 'vision center', 'eye clinic'
    ],
    medium: [
      'retina', 'cornea', 'cataract', 'cataract surgery', 'lasik', 'glaucoma',
      'optic', 'optical', 'spectacles'
    ],
    weak: [
      'sight', 'lens'
    ]
  },

  ENT: {
    strong: [
      'ent', 'otolaryngology', 'otolaryngologist', 'otology',
      'ent hospital', 'ent centre', 'ent center', 'ent clinic', 'ent institute',
      'ear nose throat', 'ear nose and throat'
    ],
    medium: [
      'audiometry', 'hearing', 'hearing clinic', 'speech and hearing', 'sinus', 'sinus care',
      'voice clinic', 'rhinology', 'laryngology'
    ],
    weak: [
      'ear', 'nose', 'throat', 'head and neck'
    ]
  },

  Pediatrics: {
    strong: [
      'pediatric', 'paediatric', 'pediatrics', 'paediatrics', 'pediatrician', 'paediatrician',
      'pediatric hospital', 'paediatric hospital', 'pediatric centre', 'paediatric centre',
      'pediatric center', 'paediatric center', 'pediatric clinic'
    ],
    medium: [
      'child', 'children', 'child care', "children's", 'childrens', 'kids',
      'children hospital', 'child hospital', 'children centre', 'children center',
      'neonatology', 'neonatal', 'nicu', 'picu'
    ],
    weak: [
      'baby', 'infant', 'adolescent'
    ]
  },

  'General Surgery': {
    strong: [
      'general surgery', 'general surgical',
      'laparoscopic surgery', 'laparoscopy', 'laparoscopy centre', 'laparoscopy center',
      'surgical hospital', 'surgery hospital', 'surgical centre', 'surgical center', 'surgical institute'
    ],
    medium: [
      'surgical', 'surgical care', 'operative', 'day care surgery', 'minimal access surgery'
    ],
    weak: [
      'surgery', 'hernia', 'appendix', 'piles'
    ]
  },

  Endocrinology: {
    strong: [
      'endocrinology', 'endocrinologist', 'endocrine',
      'endocrine hospital', 'endocrine centre', 'endocrine center', 'endocrine institute'
    ],
    medium: [
      'diabetes', 'diabetic', 'diabetes care', 'diabetes hospital', 'diabetes centre', 'diabetes center',
      'diabetology', 'diabetologist', 'thyroid', 'thyroid clinic', 'hormone', 'hormonal', 'metabolic'
    ],
    weak: [
      'sugar', 'metabolism', 'obesity'
    ]
  },

  Psychiatry: {
    strong: [
      'psychiatry', 'psychiatric', 'psychiatrist',
      'psychiatric hospital', 'psychiatric centre', 'psychiatric center', 'psychiatric institute'
    ],
    medium: [
      'mental health', 'mental wellness', 'mental health centre', 'mental health center',
      'behavioral health', 'behavioural health', 'behavioral sciences', 'behavioural sciences',
      'deaddiction', 'de addiction', 'de-addiction', 'neuropsychiatry', 'neuro psychiatry'
    ],
    weak: [
      'counseling', 'counselling', 'stress', 'mind', 'rehab and wellness'
    ]
  },

  Dentistry: {
    strong: [
      'dental', 'dentistry', 'dentist', 'dental care',
      'dental hospital', 'dental clinic', 'dental centre', 'dental center', 'dental institute', 'dental college',
      'orthodontics', 'periodontics', 'endodontics', 'prosthodontics', 'maxillofacial', 'maxillo facial'
    ],
    medium: [
      'tooth', 'teeth', 'oral', 'oral care', 'implantology', 'dental implant', 'smile care'
    ],
    weak: [
      'braces', 'cavity', 'gums'
    ]
  },

  Physiotherapy: {
    strong: [
      'physiotherapy', 'physiotherapist', 'physio', 'physical therapy',
      'rehabilitation', 'rehab', 'rehabilitation centre', 'rehabilitation center',
      'rehab centre', 'rehab center', 'rehabilitation hospital', 'sports rehab', 'neuro rehab'
    ],
    medium: [
      'kinesiology', 'physical rehab', 'occupational therapy', 'pain relief', 'spine rehab', 'physiotherapy clinic'
    ],
    weak: [
      'massage', 'mobility', 'posture'
    ]
  }
};

/**
 * Maps common specialty synonyms and variants to canonical dictionary keys.
 */
export const SPECIALTY_ALIASES: Record<string, string> = {
  // Cardiology
  'cardiology': 'Cardiology',
  'cardiac': 'Cardiology',
  'cardiac care': 'Cardiology',
  'heart': 'Cardiology',

  // Orthopedics
  'orthopedics': 'Orthopedics',
  'orthopaedics': 'Orthopedics',
  'ortho': 'Orthopedics',
  'bone & joint': 'Orthopedics',
  'bone and joint': 'Orthopedics',

  // Neurology
  'neurology': 'Neurology',
  'neuro': 'Neurology',
  'neuroscience': 'Neurology',
  'neurosciences': 'Neurology',

  // Oncology
  'oncology': 'Oncology',
  'cancer': 'Oncology',
  'cancer care': 'Oncology',

  // Gynecology
  'gynecology': 'Gynecology',
  'gynaecology': 'Gynecology',
  'obstetrics': 'Gynecology',
  'obstetric': 'Gynecology',
  'obstetrics & gynecology': 'Gynecology',
  'obstetrics and gynecology': 'Gynecology',
  'obg': 'Gynecology',
  'obgyn': 'Gynecology',
  'maternity': 'Gynecology',
  "women's health": 'Gynecology',

  // Urology
  'urology': 'Urology',
  'uro': 'Urology',

  // Nephrology
  'nephrology': 'Nephrology',
  'nephro': 'Nephrology',
  'renal': 'Nephrology',
  'dialysis': 'Nephrology',

  // Gastroenterology
  'gastroenterology': 'Gastroenterology',
  'gastro': 'Gastroenterology',
  'gi': 'Gastroenterology',
  'digestive care': 'Gastroenterology',

  // Pulmonology
  'pulmonology': 'Pulmonology',
  'pulmonary': 'Pulmonology',
  'pulmonary medicine': 'Pulmonology',
  'respiratory': 'Pulmonology',
  'respiratory medicine': 'Pulmonology',
  'chest medicine': 'Pulmonology',

  // Dermatology
  'dermatology': 'Dermatology',
  'derma': 'Dermatology',
  'skin': 'Dermatology',

  // Ophthalmology
  'ophthalmology': 'Ophthalmology',
  'eye': 'Ophthalmology',
  'eye care': 'Ophthalmology',
  'vision': 'Ophthalmology',

  // ENT
  'ent': 'ENT',
  'otolaryngology': 'ENT',
  'ear nose throat': 'ENT',
  'ear nose and throat': 'ENT',

  // Pediatrics
  'pediatrics': 'Pediatrics',
  'paediatrics': 'Pediatrics',
  'pediatric': 'Pediatrics',
  'paediatric': 'Pediatrics',
  'child care': 'Pediatrics',

  // General Surgery
  'general surgery': 'General Surgery',
  'surgery': 'General Surgery',
  'surgical': 'General Surgery',

  // Endocrinology
  'endocrinology': 'Endocrinology',
  'endocrine': 'Endocrinology',
  'diabetes': 'Endocrinology',
  'diabetology': 'Endocrinology',

  // Psychiatry
  'psychiatry': 'Psychiatry',
  'psychiatric': 'Psychiatry',
  'mental health': 'Psychiatry',
  'behavioral health': 'Psychiatry',

  // Dentistry
  'dentistry': 'Dentistry',
  'dental': 'Dentistry',
  'dental care': 'Dentistry',

  // Physiotherapy
  'physiotherapy': 'Physiotherapy',
  'physical therapy': 'Physiotherapy',
  'rehabilitation': 'Physiotherapy',
  'rehab': 'Physiotherapy'
};

/**
 * Normalizes specialty input to a canonical key in SPECIALTY_NAME_KEYWORDS.
 */
export function normalizeSpecialtyKey(specialty?: string | null): string | null {
  if (!specialty || typeof specialty !== 'string') return null;
  const clean = specialty.trim().toLowerCase();
  if (!clean || clean === 'all specialties' || clean === 'all' || clean === 'none') {
    return null;
  }

  if (SPECIALTY_ALIASES[clean]) {
    return SPECIALTY_ALIASES[clean];
  }

  // Direct lookup match against keys
  for (const key of Object.keys(SPECIALTY_NAME_KEYWORDS)) {
    if (key.toLowerCase() === clean) {
      return key;
    }
  }

  return null;
}

/**
 * Normalizes text for token-aware matching.
 * Replaces punctuation, hyphens, and ampersands with clean spaces,
 * preserves letter-digit tokens, and collapses whitespace.
 */
export function normalizeForMatching(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '') // remove apostrophes (women's -> womens)
    .replace(/[-/\\.,:;!?()\[\]{}_+*~#@$%^=<>`"|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a normalized string contains a keyword using strict word-boundary token matching.
 * This guarantees keywords like 'ear', 'eye', 'gi', 'skin' do not trigger false positives
 * inside unrelated words like 'heart', 'clear', 'they', 'regional', etc.
 */
function containsKeywordToken(normalizedName: string, keyword: string): boolean {
  const normKw = normalizeForMatching(keyword);
  if (!normKw) return false;

  // Escape special regex chars if any remain
  const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
  return regex.test(normalizedName);
}

/**
 * Calculates specialty name relevance score and metadata for a hospital name given a selected specialty.
 * 
 * Invariants:
 * 1. Score is strictly 0 to 100.
 * 2. Deterministic: same inputs produce identical results.
 * 3. Token-aware: avoids accidental substring matches inside unrelated words.
 * 4. Distinct strength tiers: Strong (100), Medium (75), Weak (40).
 * 5. Multi-keyword match caps at 100.
 * 6. Neutral explanation indicating name-based relevance heuristic without claiming clinical superiority.
 */
export function calculateSpecialtyNameRelevance(
  hospitalName: string,
  selectedSpecialty?: string | null
): SpecialtyNameMatch {
  const defaultNoMatch: SpecialtyNameMatch = {
    matched: false,
    strength: 'none',
    keywords: [],
    matchedKeywords: [],
    score: 0,
    explanation: null
  };

  const canonicalSpecialty = normalizeSpecialtyKey(selectedSpecialty);
  if (!canonicalSpecialty) {
    return defaultNoMatch;
  }

  const keywordTiers = SPECIALTY_NAME_KEYWORDS[canonicalSpecialty];
  if (!keywordTiers) {
    return defaultNoMatch;
  }

  const normName = normalizeForMatching(hospitalName);
  if (!normName) {
    return defaultNoMatch;
  }

  const matchedStrong: string[] = [];
  const matchedMedium: string[] = [];
  const matchedWeak: string[] = [];

  for (const kw of keywordTiers.strong) {
    if (containsKeywordToken(normName, kw)) {
      if (!matchedStrong.includes(kw)) matchedStrong.push(kw);
    }
  }

  for (const kw of keywordTiers.medium) {
    if (containsKeywordToken(normName, kw)) {
      if (!matchedMedium.includes(kw)) matchedMedium.push(kw);
    }
  }

  for (const kw of keywordTiers.weak) {
    if (containsKeywordToken(normName, kw)) {
      if (!matchedWeak.includes(kw)) matchedWeak.push(kw);
    }
  }

  const allMatched = [...matchedStrong, ...matchedMedium, ...matchedWeak];
  if (allMatched.length === 0) {
    return defaultNoMatch;
  }

  let strength: 'strong' | 'medium' | 'weak' = 'weak';
  let baseScore = 40;

  if (matchedStrong.length > 0) {
    strength = 'strong';
    baseScore = 100;
  } else if (matchedMedium.length > 0) {
    strength = 'medium';
    baseScore = 75;
  } else {
    strength = 'weak';
    baseScore = 40;
  }

  // Capped bonus for additional matched keywords (e.g. +5 pts per extra keyword up to max 100)
  const additionalMatchesCount = Math.max(0, allMatched.length - 1);
  const bonus = additionalMatchesCount * 5;
  const finalScore = Math.min(100, baseScore + bonus);

  const primaryKeywordDisplay = allMatched[0].charAt(0).toUpperCase() + allMatched[0].slice(1);
  const explanation = `Hospital name contains a ${strength} ${canonicalSpecialty}-related term: ${primaryKeywordDisplay}`;

  return {
    matched: true,
    strength,
    keywords: allMatched,
    matchedKeywords: allMatched,
    score: finalScore,
    explanation
  };
}
