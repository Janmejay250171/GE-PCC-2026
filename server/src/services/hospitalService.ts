import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  HospitalRecord,
  CostRecord,
  HospitalEstimate,
  RankedHospitalItem,
  ScoreBreakdown,
  ItemizedBill,
  PolicyImpactBreakdown,
  RoomCategory,
  HospitalSearchResult,
  HospitalNetworkInfo,
  NetworkStatus,
  CanonicalFinancialImpact,
  SpecialtyNameMatch
} from '../types/hospital.js';
import { PolicyDocument } from '../types/policy.js';
import { getHospitalNetworkStatus } from './networkMatchingService.js';
import {
  calculateSpecialtyNameRelevance,
  normalizeSpecialtyKey
} from '../config/specialtyNameKeywords.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to CSV datasets (check process.cwd(), root, then cost/)
const possibleHospPaths = [
  path.resolve(process.cwd(), 'hospitals.csv'),
  path.resolve(__dirname, '../../../hospitals.csv'),
  path.resolve(__dirname, '../../hospitals.csv'),
  path.resolve(__dirname, '../../../cost/hospitals.csv'),
  path.resolve(process.cwd(), 'cost/hospitals.csv')
];
const possiblePvtPaths = [
  path.resolve(process.cwd(), 'pvt_costs.csv'),
  path.resolve(__dirname, '../../../pvt_costs.csv'),
  path.resolve(__dirname, '../../pvt_costs.csv'),
  path.resolve(__dirname, '../../../cost/pvt_costs.csv'),
  path.resolve(process.cwd(), 'cost/pvt_costs.csv')
];
const possibleGovtPaths = [
  path.resolve(process.cwd(), 'govt_costs.csv'),
  path.resolve(__dirname, '../../../govt_costs.csv'),
  path.resolve(__dirname, '../../govt_costs.csv'),
  path.resolve(__dirname, '../../../cost/govt_costs.csv'),
  path.resolve(process.cwd(), 'cost/govt_costs.csv')
];

function resolveFilePath(paths: string[]): string {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return paths[0];
}

const SEGMENT_POSITION: Record<string, number> = {
  'budget/local': 0.25,
  'budget': 0.25,
  'standard private': 0.40,
  'standard': 0.40,
  'established': 0.50,
  'premium': 0.65,
  'luxury': 0.80,
  'government': 0.50
};

type RoomCostKey = 'general_ward_cost_per_day' | 'twin_sharing_cost_per_day' | 'single_private_room_cost_per_day';

const ROOM_KEYS: Record<RoomCategory, RoomCostKey> = {
  'General Ward': 'general_ward_cost_per_day',
  'Twin Sharing': 'twin_sharing_cost_per_day',
  'Single Private Room': 'single_private_room_cost_per_day'
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

export const CITY_CANONICAL_TIERS: Record<string, string> = {
  // Metro 1
  'bengaluru': 'Metro 1',
  'bangalore': 'Metro 1',
  'mumbai': 'Metro 1',
  'bombay': 'Metro 1',
  'navi mumbai': 'Metro 1',
  'thane': 'Metro 1',
  'delhi': 'Metro 1',
  'new delhi': 'Metro 1',
  'noida': 'Metro 1',
  'greater noida': 'Metro 1',
  'gurgaon': 'Metro 1',
  'gurugram': 'Metro 1',
  'faridabad': 'Metro 1',
  'ghaziabad': 'Metro 1',
  'hyderabad': 'Metro 1',
  'secunderabad': 'Metro 1',
  'chennai': 'Metro 1',
  'madras': 'Metro 1',
  'kolkata': 'Metro 1',
  'calcutta': 'Metro 1',
  'howrah': 'Metro 1',

  // Metro 2
  'pune': 'Metro 2',
  'ahmedabad': 'Metro 2',
  'gandhinagar': 'Metro 2',

  // Large City 1
  'jaipur': 'Large City 1',
  'surat': 'Large City 1',
  'lucknow': 'Large City 1',
  'kanpur': 'Large City 1',
  'nagpur': 'Large City 1',
  'indore': 'Large City 1',
  'bhopal': 'Large City 1',
  'patna': 'Large City 1',
  'vadodara': 'Large City 1',
  'coimbatore': 'Large City 1',

  // Large City 2
  'visakhapatnam': 'Large City 2',
  'vizag': 'Large City 2',
  'agra': 'Large City 2',
  'varanasi': 'Large City 2',
  'ludhiana': 'Large City 2',
  'nashik': 'Large City 2',
  'rajkot': 'Large City 2',
  'madurai': 'Large City 2',
  'meerut': 'Large City 2',
  'jabalpur': 'Large City 2',
  'gwalior': 'Large City 2',
  'chandigarh': 'Large City 2',
  'mohali': 'Large City 2',
  'panchkula': 'Large City 2',

  // City 1
  'amritsar': 'City 1',
  'allahabad': 'City 1',
  'prayagraj': 'City 1',
  'ranchi': 'City 1',
  'jodhpur': 'City 1',
  'raipur': 'City 1',
  'kota': 'City 1',
  'guwahati': 'City 1',
  'mysore': 'City 1',
  'mysuru': 'City 1',
  'hubli': 'City 1',
  'hubballi': 'City 1',
  'mangalore': 'City 1',
  'mangaluru': 'City 1',
  'belgaum': 'City 1',
  'belagavi': 'City 1',
  'salem': 'City 1',
  'tiruchirappalli': 'City 1',
  'trichy': 'City 1',
  'bareilly': 'City 1',
  'aligarh': 'City 1',
  'moradabad': 'City 1',
  'jalandhar': 'City 1',
  'bhubaneswar': 'City 1',
  'warangal': 'City 1',
  'guntur': 'City 1',
  'vijayawada': 'City 1',
  'tirupati': 'City 1',
  'dehradun': 'City 1',
  'kochi': 'City 1',
  'cochin': 'City 1',
  'thiruvananthapuram': 'City 1',
  'trivandrum': 'City 1',
  'calicut': 'City 1',
  'kozhikode': 'City 1',
  'gorakhpur': 'City 1',
  'saharanpur': 'City 1',
  'firozabad': 'City 1',
  'jhansi': 'City 1',
  'muzaffarnagar': 'City 1',
  'mathura': 'City 1',
  'kollam': 'City 1',
  'thrissur': 'City 1',
  'kannur': 'City 1',
  'dhanbad': 'City 1',
  'jamshedpur': 'City 1',
  'bokaro': 'City 1',
  'udaipur': 'City 1',
  'ajmer': 'City 1',
  'bikaner': 'City 1',
  'amravati': 'City 1',
  'solapur': 'City 1',
  'kolhapur': 'City 1',
  'aurangabad': 'City 1',
  'kurnool': 'City 1',
  'nellore': 'City 1',
  'rajahmundry': 'City 1',
  'kakinada': 'City 1',
  'karimnagar': 'City 1',
  'nizamabad': 'City 1',
  'tirunelveli': 'City 1',
  'erode': 'City 1',
  'vellore': 'City 1',
  'tuticorin': 'City 1',
  'thoothukudi': 'City 1',
  'siliguri': 'City 1',
  'rourkela': 'City 1',
  'haridwar': 'City 1',
  'roorkee': 'City 1',
  'haldwani': 'City 1',
  'jammu': 'City 1',
  'srinagar': 'City 1'
};

function normalize(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanCandidateCity(s: string): string {
  if (!s) return '';
  let str = s.trim();

  // Strip pincodes
  str = str.replace(/\bpin(?:\s*code)?\s*[-:]?\s*\d+/gi, '')
    .replace(/\b\d{6}\b/g, '')
    .replace(/\b\d+\b/g, '')
    .trim();

  // Strip leading & trailing punctuation
  str = str.replace(/^[\s,.\-:/()]+|[\s,.\-:/()]+$/g, '').trim();

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
      const rest = match[1].replace(/^[,\s\-/()]+/, '').trim();
      if (rest.length >= 2) {
        str = rest;
      }
    }
  }

  str = str.replace(/^[\s,.\-:/()]+|[\s,.\-:/()]+$/g, '').trim();
  return str;
}

function extractCity(address: string): string {
  if (!address) return 'Unknown';
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return 'Unknown';

  const meaningful = parts.filter(p => !/^\d{6}$/.test(p) && !/^pin(?:\s*code)?\s*[-:]?\s*\d+$/i.test(p));
  if (meaningful.length === 0) return 'Unknown';

  for (let i = meaningful.length - 1; i >= 0; i--) {
    const candidate = meaningful[i];
    const cleaned = cleanCandidateCity(candidate);
    const norm = normalize(cleaned);
    if (!norm) continue;

    if (INDIAN_STATES.has(norm)) {
      if (i > 0) {
        const prevCleaned = cleanCandidateCity(meaningful[i - 1]);
        if (prevCleaned && !INDIAN_STATES.has(normalize(prevCleaned))) {
          return prevCleaned;
        }
      }
      continue;
    }
    return cleaned;
  }

  return cleanCandidateCity(meaningful[0]) || 'Unknown';
}

function normalizeCity(rawCity: string): string {
  let c = cleanCandidateCity(rawCity);
  if (!c || c.length < 2) return 'Other';

  const n = normalize(c);
  const cityAliases: Record<string, string> = {
    'bangalore': 'Bengaluru',
    'bengaluru': 'Bengaluru',
    'bombay': 'Mumbai',
    'mumbai': 'Mumbai',
    'calcutta': 'Kolkata',
    'kolkata': 'Kolkata',
    'madras': 'Chennai',
    'chennai': 'Chennai',
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'gurgaon': 'Gurugram',
    'gurugram': 'Gurugram',
    'hyderabad': 'Hyderabad',
    'secunderabad': 'Hyderabad',
    'pune': 'Pune',
    'ahmedabad': 'Ahmedabad',
    'jaipur': 'Jaipur',
    'lucknow': 'Lucknow',
    'chandigarh': 'Chandigarh',
    'coimbatore': 'Coimbatore',
    'kochi': 'Kochi',
    'cochin': 'Kochi',
    'indore': 'Indore',
    'nagpur': 'Nagpur',
    'patna': 'Patna',
    'bhopal': 'Bhopal',
    'vadodara': 'Vadodara',
    'ludhiana': 'Ludhiana',
    'agra': 'Agra',
    'nashik': 'Nashik',
    'varanasi': 'Varanasi',
    'visakhapatnam': 'Visakhapatnam',
    'vizag': 'Visakhapatnam',
    'jammu': 'Jammu',
    'srinagar': 'Srinagar'
  };

  if (cityAliases[n]) return cityAliases[n];
  return toTitleCase(c);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getHospitalVariation(hospital: HospitalRecord): number {
  const seed = hashString([hospital.hospital_name, hospital.address, hospital.tier, hospital.segment].join('|'));
  const norm = (seed % 1000) / 1000; // 0.0 to 0.999
  return (norm * 0.10) - 0.05; // -0.05 to +0.05 (-5% to +5%)
}

export interface DatasetStats {
  totalRecordsParsed: number;
  validRecordsLoaded: number;
  malformedRecordsRejected: number;
  recordsWithMissingInsurer: number;
  recordsWithMissingSpecialty: number;
  recordsWithMissingAddress: number;
  unknownCityCount: number;
}

export function parseCSVRecords(csvText: string): string[][] {
  const records: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  const len = csvText.length;

  for (let i = 0; i < len; i++) {
    const c = csvText[i];

    if (c === '"') {
      if (inQuotes && i + 1 < len && csvText[i + 1] === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && i + 1 < len && csvText[i + 1] === '\n') {
        i++; // handle \r\n
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim().length > 0)) {
        records.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += c;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim().length > 0)) {
      records.push(currentRow);
    }
  }

  return records;
}

const STRING_POOL = new Map<string, string>();
function internString(str: string): string {
  if (!str) return '';
  let cached = STRING_POOL.get(str);
  if (!cached) {
    cached = str;
    STRING_POOL.set(str, cached);
  }
  return cached;
}

export function parseCSVLine(text: string): string[] {
  const records = parseCSVRecords(text);
  return records.length > 0 ? records[0] : [];
}

export class HospitalService {
  private hospitals: HospitalRecord[] = [];
  private pvtCosts: CostRecord[] = [];
  private govtCosts: CostRecord[] = [];

  private datasetStats: DatasetStats = {
    totalRecordsParsed: 0,
    validRecordsLoaded: 0,
    malformedRecordsRejected: 0,
    recordsWithMissingInsurer: 0,
    recordsWithMissingSpecialty: 0,
    recordsWithMissingAddress: 0,
    unknownCityCount: 0
  };

  private hospitalsByCity = new Map<string, HospitalRecord[]>();
  private allCities: { name: string; count: number }[] = [];
  private allSpecialties: string[] = [];
  private specialtyToProcedures = new Map<string, string[]>();

  private costRecordsMap = new Map<string, CostRecord>();
  private tierSpecialtyMap = new Map<string, CostRecord[]>();
  private tierMap = new Map<string, CostRecord[]>();

  private isLoaded = false;

  public async initData(): Promise<void> {
    if (this.isLoaded) return;

    const hospPath = resolveFilePath(possibleHospPaths);
    const pvtPath = resolveFilePath(possiblePvtPaths);
    const govtPath = resolveFilePath(possibleGovtPaths);

    console.log(`[HospitalService] Loading datasets from:`);
    console.log(` - Hospitals: ${hospPath}`);
    console.log(` - Pvt Costs: ${pvtPath}`);
    console.log(` - Govt Costs: ${govtPath}`);

    // Stream-parse hospitals to drastically minimize heap memory (< 150MB)
    await this.parseHospitalsFromFile(hospPath);

    const pvtRaw = fs.readFileSync(pvtPath, 'utf8');
    const govtRaw = fs.readFileSync(govtPath, 'utf8');
    this.parseCosts(pvtRaw, 'private');
    this.parseCosts(govtRaw, 'government');

    this.buildIndexes();
    this.isLoaded = true;

    console.log(`[HospitalService] Dataset Validation Report:`);
    console.log(` - Total rows parsed: ${this.datasetStats.totalRecordsParsed}`);
    console.log(` - Valid records loaded: ${this.datasetStats.validRecordsLoaded}`);
    console.log(` - Malformed records rejected: ${this.datasetStats.malformedRecordsRejected}`);
    console.log(` - Records with missing insurer: ${this.datasetStats.recordsWithMissingInsurer}`);
    console.log(` - Records with missing specialty: ${this.datasetStats.recordsWithMissingSpecialty}`);
    console.log(` - Records with missing address: ${this.datasetStats.recordsWithMissingAddress}`);
    console.log(` - Unknown city count: ${this.datasetStats.unknownCityCount}`);
    console.log(`[HospitalService] Successfully indexed ${this.hospitals.length} hospitals across ${this.allCities.length} cities.`);
  }

  public getDatasetStats(): DatasetStats {
    return { ...this.datasetStats };
  }

  public async parseHospitalsFromFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let headers: string[] = [];
      let isFirstLine = true;
      let totalParsed = 0;
      let malformedCount = 0;
      let missingInsurerCount = 0;
      let missingSpecialtyCount = 0;
      let missingAddressCount = 0;
      let unknownCityCount = 0;

      const records: HospitalRecord[] = [];

      rl.on('line', (line) => {
        if (!line.trim()) return;
        if (isFirstLine) {
          headers = parseCSVLine(line).map(h => h.trim());
          isFirstLine = false;
          return;
        }

        totalParsed++;
        const cols = parseCSVLine(line);
        if (cols.length < headers.length) {
          malformedCount++;
          return;
        }

        const obj: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = cols[j] !== undefined ? cols[j].trim() : '';
        }

        const hospitalName = obj.hospital_name || '';
        const address = obj.address || '';

        if (!hospitalName.trim() && !address.trim()) {
          malformedCount++;
          return;
        }

        if (!address.trim()) {
          missingAddressCount++;
        }

        const extractedCity = extractCity(address);
        const city = internString(normalizeCity(extractedCity));
        if (city === 'Other' || city === 'Unknown') {
          unknownCityCount++;
        }

        let ratingVal = parseFloat(obj.rating);
        if (isNaN(ratingVal) || ratingVal <= 0) {
          ratingVal = 0;
        }

        const specialties = (obj.specialties || '')
          .split(';')
          .map(s => internString(s.trim()))
          .filter(Boolean);

        if (specialties.length === 0) {
          missingSpecialtyCount++;
        }

        const insurersList = (obj.insurers || '')
          .split(',')
          .map(ins => internString(ins.trim()))
          .filter(Boolean);

        if (insurersList.length === 0) {
          missingInsurerCount++;
        }

        const canonicalTier = internString(CITY_CANONICAL_TIERS[normalize(city)] || obj.tier || 'City 1');

        records.push({
          hospital_name: hospitalName || 'Unnamed Hospital',
          hospital_type: internString(obj.hospital_type || 'Private'),
          address,
          city,
          insurers: insurersList,
          insurersRaw: obj.insurers || '',
          rating: ratingVal,
          specialties,
          tier: canonicalTier,
          segment: internString(obj.segment || 'Standard Private')
        });
      });

      rl.on('close', () => {
        this.hospitals = records;
        this.datasetStats = {
          totalRecordsParsed: totalParsed,
          validRecordsLoaded: records.length,
          malformedRecordsRejected: malformedCount,
          recordsWithMissingInsurer: missingInsurerCount,
          recordsWithMissingSpecialty: missingSpecialtyCount,
          recordsWithMissingAddress: missingAddressCount,
          unknownCityCount
        };
        resolve();
      });

      rl.on('error', reject);
    });
  }

  public parseHospitals(csvText: string): void {
    const rawRecords = parseCSVRecords(csvText);
    if (rawRecords.length < 2) return;

    const headers = rawRecords[0].map(h => h.trim());
    const expectedCols = headers.length;
    const records: HospitalRecord[] = [];

    let malformedCount = 0;
    let missingInsurerCount = 0;
    let missingSpecialtyCount = 0;
    let missingAddressCount = 0;
    let unknownCityCount = 0;

    for (let i = 1; i < rawRecords.length; i++) {
      const cols = rawRecords[i];
      if (cols.length !== expectedCols) {
        malformedCount++;
        continue;
      }

      const obj: Record<string, string> = {};
      for (let j = 0; j < expectedCols; j++) {
        obj[headers[j]] = cols[j] !== undefined ? cols[j].trim() : '';
      }

      const hospitalName = obj.hospital_name || '';
      const address = obj.address || '';

      if (!hospitalName.trim() && !address.trim()) {
        malformedCount++;
        continue;
      }

      if (!address.trim()) {
        missingAddressCount++;
      }

      const extractedCity = extractCity(address);
      const city = normalizeCity(extractedCity);
      if (city === 'Other' || city === 'Unknown') {
        unknownCityCount++;
      }

      let ratingVal = parseFloat(obj.rating);
      if (isNaN(ratingVal) || ratingVal <= 0) {
        ratingVal = 0;
      }

      const specialties = (obj.specialties || '')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);

      if (specialties.length === 0) {
        missingSpecialtyCount++;
      }

      const insurersList = (obj.insurers || '')
        .split(',')
        .map(ins => ins.trim())
        .filter(Boolean);

      if (insurersList.length === 0) {
        missingInsurerCount++;
      }

      const canonicalTier = CITY_CANONICAL_TIERS[normalize(city)] || obj.tier || 'City 1';

      records.push({
        hospital_name: hospitalName || 'Unnamed Hospital',
        hospital_type: obj.hospital_type || 'Private',
        address,
        city,
        insurers: insurersList,
        insurersRaw: obj.insurers || '',
        rating: ratingVal,
        specialties,
        tier: canonicalTier,
        segment: obj.segment || 'Standard Private'
      });
    }

    this.hospitals = records;
    this.datasetStats = {
      totalRecordsParsed: rawRecords.length - 1,
      validRecordsLoaded: records.length,
      malformedRecordsRejected: malformedCount,
      recordsWithMissingInsurer: missingInsurerCount,
      recordsWithMissingSpecialty: missingSpecialtyCount,
      recordsWithMissingAddress: missingAddressCount,
      unknownCityCount
    };
  }

  public parseCosts(csvText: string, type: 'private' | 'government'): void {
    const rawRecords = parseCSVRecords(csvText);
    if (rawRecords.length < 2) return;

    const headers = rawRecords[0].map(h => h.trim());
    const expectedCols = headers.length;
    const records: CostRecord[] = [];

    for (let i = 1; i < rawRecords.length; i++) {
      const cols = rawRecords[i];
      if (cols.length !== expectedCols) continue;

      const obj: Record<string, string> = {};
      for (let j = 0; j < expectedCols; j++) {
        obj[headers[j]] = cols[j] !== undefined ? cols[j].trim() : '';
      }

      records.push({
        tier: obj.tier || '',
        specialty: obj.specialty || '',
        procedure: obj.procedure || '',
        low_cost: parseFloat(obj.low_cost) || 0,
        highest_cost: parseFloat(obj.highest_cost) || 0,
        mean_cost: parseFloat(obj.mean_cost) || 0,
        estimated_stay_days: parseFloat(obj.estimated_stay_days) || 0,
        general_ward_cost_per_day: parseFloat(obj.general_ward_cost_per_day) || 0,
        twin_sharing_cost_per_day: parseFloat(obj.twin_sharing_cost_per_day) || 0,
        single_private_room_cost_per_day: parseFloat(obj.single_private_room_cost_per_day) || 0
      });
    }

    if (type === 'private') {
      this.pvtCosts = records;
    } else {
      this.govtCosts = records;
    }
  }

  private buildIndexes() {
    this.hospitalsByCity.clear();
    this.costRecordsMap.clear();
    this.tierSpecialtyMap.clear();
    this.tierMap.clear();
    this.specialtyToProcedures.clear();

    const cityCounts = new Map<string, number>();
    for (const h of this.hospitals) {
      const normCity = normalize(h.city);
      if (!this.hospitalsByCity.has(normCity)) {
        this.hospitalsByCity.set(normCity, []);
      }
      this.hospitalsByCity.get(normCity)!.push(h);

      const count = (cityCounts.get(h.city) || 0) + 1;
      cityCounts.set(h.city, count);
    }

    this.allCities = Array.from(cityCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const datasets = [
      { type: 'private', records: this.pvtCosts },
      { type: 'government', records: this.govtCosts }
    ];

    const specSet = new Set<string>();
    const specProcMap = new Map<string, Set<string>>();

    for (const ds of datasets) {
      for (const r of ds.records) {
        const normTier = normalize(r.tier);
        const normSpec = normalize(r.specialty);
        const normProc = normalize(r.procedure);

        if (r.specialty) {
          specSet.add(r.specialty);
          if (!specProcMap.has(r.specialty)) {
            specProcMap.set(r.specialty, new Set());
          }
          if (r.procedure) {
            specProcMap.get(r.specialty)!.add(r.procedure);
          }
        }

        const exactKey = `${ds.type}|${normTier}|${normSpec}|${normProc}`;
        this.costRecordsMap.set(exactKey, r);

        const specKey = `${ds.type}|${normTier}|${normSpec}`;
        if (!this.tierSpecialtyMap.has(specKey)) {
          this.tierSpecialtyMap.set(specKey, []);
        }
        this.tierSpecialtyMap.get(specKey)!.push(r);

        const tierKey = `${ds.type}|${normTier}`;
        if (!this.tierMap.has(tierKey)) {
          this.tierMap.set(tierKey, []);
        }
        this.tierMap.get(tierKey)!.push(r);
      }
    }

    this.allSpecialties = Array.from(specSet).sort();
    for (const [spec, procs] of specProcMap.entries()) {
      this.specialtyToProcedures.set(spec, Array.from(procs).sort());
    }
  }

  public getCities(): { name: string; count: number }[] {
    return this.allCities;
  }

  public getTaxonomy(): { specialties: string[]; proceduresBySpecialty: Record<string, string[]> } {
    const proceduresBySpecialty: Record<string, string[]> = {};
    for (const [spec, procs] of this.specialtyToProcedures.entries()) {
      proceduresBySpecialty[spec] = procs;
    }
    return {
      specialties: this.allSpecialties,
      proceduresBySpecialty
    };
  }

  private computeAggregateFromList(list: CostRecord[]): CostRecord | null {
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
      tier: list[0].tier,
      specialty: list[0].specialty,
      procedure: 'Average',
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

  private getCostRecord(hospitalType: string, tier: string, specialty?: string, procedure?: string): { record: CostRecord | null; level: 'procedure' | 'specialty' | 'tier' | 'unavailable' } {
    const dsType = normalize(hospitalType) === 'government' ? 'government' : 'private';
    const normTier = normalize(tier);
    const canonicalSpec = normalizeSpecialtyKey(specialty) || specialty;
    const normSpec = normalize(canonicalSpec);
    const normProc = normalize(procedure);

    // 1. Exact procedure
    if (normSpec && normProc) {
      const exactKey = `${dsType}|${normTier}|${normSpec}|${normProc}`;
      if (this.costRecordsMap.has(exactKey)) {
        return {
          record: this.costRecordsMap.get(exactKey)!,
          level: 'procedure'
        };
      }
    }

    // 2. Specialty average
    if (normSpec) {
      const specKey = `${dsType}|${normTier}|${normSpec}`;
      const list = this.tierSpecialtyMap.get(specKey);
      if (list && list.length > 0) {
        return {
          record: this.computeAggregateFromList(list),
          level: 'specialty'
        };
      }
    }

    // 3. Tier average (city only)
    const tierKey = `${dsType}|${normTier}`;
    const tierList = this.tierMap.get(tierKey);
    if (tierList && tierList.length > 0) {
      return {
        record: this.computeAggregateFromList(tierList),
        level: 'tier'
      };
    }

    return {
      record: null,
      level: 'unavailable'
    };
  }

  private getSegmentAdjustedCost(low: number, mean: number, high: number, segment: string, hospType: string): number {
    if (normalize(hospType) === 'government') {
      return mean;
    }

    const pos = SEGMENT_POSITION[normalize(segment)] ?? 0.50;
    if (pos <= 0.50) {
      return low + (mean - low) * (pos / 0.50);
    } else {
      return mean + (high - mean) * ((pos - 0.50) / 0.50);
    }
  }

  public calculateHospitalEstimate(
    hospital: HospitalRecord,
    specialty?: string,
    procedure?: string,
    roomType: RoomCategory = 'General Ward'
  ): HospitalEstimate {
    const lookup = this.getCostRecord(hospital.hospital_type, hospital.tier, specialty, procedure);
    if (!lookup.record) {
      return {
        available: false,
        level: 'unavailable',
        lowCost: 0,
        meanCost: 0,
        highestCost: 0,
        segmentAdjustedCost: 0,
        hospitalVariation: 0,
        treatmentCost: 0,
        roomCost: 0,
        totalCost: 0,
        displayLow: 0,
        displayHigh: 0,
        estimatedStayDays: 0,
        roomCostPerDay: 0
      };
    }

    const rec = lookup.record;
    const lowCost = rec.low_cost;
    const meanCost = rec.mean_cost;
    const highestCost = rec.highest_cost;

    const segmentAdjustedCost = this.getSegmentAdjustedCost(
      lowCost,
      meanCost,
      highestCost,
      hospital.segment,
      hospital.hospital_type
    );

    const hospitalVariation = getHospitalVariation(hospital);
    let treatmentCost = segmentAdjustedCost * (1 + hospitalVariation);
    treatmentCost = Math.max(lowCost, Math.min(treatmentCost, highestCost));

    const colKey = ROOM_KEYS[roomType] || ROOM_KEYS['General Ward'];
    const roomCostPerDay = rec[colKey] || 0;
    const stayDays = rec.estimated_stay_days || 0;
    const roomCost = roomCostPerDay * stayDays;

    // Procedure cost directly from dataset logic (segment adjusted + deterministic variation)
    const procedureCost = Math.round(treatmentCost);
    // Doctor fees: exactly 20% of procedure cost
    const doctorFees = Math.round(procedureCost * 0.20);
    // Medicines & Lab tests: exactly 10% of procedure cost
    const medicineLabCost = Math.round(procedureCost * 0.10);

    // Total cost = Procedure + Doctor Fees (20%) + Medicines & Lab Tests (10%) + Room Charges
    const totalCost = procedureCost + doctorFees + medicineLabCost + roomCost;

    const displayLow = Math.round(Math.max(lowCost, procedureCost * 0.90) * 1.30 + roomCost);
    const displayHigh = Math.round(Math.min(highestCost, procedureCost * 1.10) * 1.30 + roomCost);

    return {
      available: true,
      level: lookup.level,
      lowCost,
      meanCost,
      highestCost,
      segmentAdjustedCost: Math.round(segmentAdjustedCost),
      hospitalVariation,
      treatmentCost: procedureCost,
      roomCost: Math.round(roomCost),
      totalCost: Math.round(totalCost),
      displayLow,
      displayHigh,
      estimatedStayDays: rec.estimated_stay_days,
      roomCostPerDay
    };
  }

  public getHospitalByName(name: string): HospitalRecord | undefined {
    if (!name) return undefined;
    const norm = normalize(name);
    return this.hospitals.find(h => normalize(h.hospital_name) === norm) ||
      this.hospitals.find(h => normalize(h.hospital_name).includes(norm));
  }

  public isInsurerEmpanelled(hospital: HospitalRecord, insurerName?: string | null, aliases: string[] = []): boolean {
    const status = getHospitalNetworkStatus(hospital, insurerName, aliases);
    return status.networkStatus === 'verified';
  }

  public getHospitalNetworkStatus(hospital: HospitalRecord, insurerName?: string | null, aliases: string[] = []): HospitalNetworkInfo {
    return getHospitalNetworkStatus(hospital, insurerName, aliases);
  }

  public calculatePolicyImpact(
    estimate: HospitalEstimate,
    policy: PolicyDocument,
    networkStatus: NetworkStatus,
    roomType: RoomCategory = 'General Ward',
    specialty?: string,
    procedure?: string
  ): CanonicalFinancialImpact {
    const totalBill = estimate.totalCost;
    const procedureCharges = estimate.treatmentCost;
    const doctorFees = Math.round(procedureCharges * 0.20);
    const medicineCharges = Math.round(procedureCharges * 0.10);
    const roomCharges = estimate.roomCost;
    const roomRate = estimate.roomCostPerDay;
    const stayDays = Math.max(1, Math.round(estimate.estimatedStayDays));

    const isVerified = networkStatus === 'verified';
    const isStatutory = policy.policyType === 'pmjay' || policy.policyType === 'esi';

    // 0. Excluded Department / Treatment Check
    const isSpecialtyExcluded = Boolean(
      (specialty || procedure) &&
      policy.exclusions &&
      Array.isArray(policy.exclusions) &&
      policy.exclusions.some(ex => {
        const e = ex.toLowerCase().trim();
        const s = (specialty || '').toLowerCase().trim();
        const p = (procedure || '').toLowerCase().trim();
        return (s && (s.includes(e) || e.includes(s))) || (p && (p.includes(e) || e.includes(p)));
      })
    );

    if (isSpecialtyExcluded) {
      return {
        estimatedBill: totalBill,
        eligibleAmount: 0,
        roomRentExcess: 0,
        roomRentExcessPerDay: 0,
        roomLimitEligiblePerDay: roomRate,
        roomLimitType: 'Excluded Treatment',
        proportionateDeductionActive: false,
        proportionateDisallowance: 0,
        deductibleApplied: 0,
        deductibleUnknown: false,
        effectiveCopayPercent: 0,
        copayAmount: 0,
        isCopayUncertain: false,
        sumInsuredExcess: 0,
        isSumInsuredUnknown: false,
        modelledNonMedicalAllowance: 0,
        patientPayable: totalBill,
        insurerEstimatedShare: 0,
        isSpecialtyExcluded: true
      };
    }

    // 1. Statutory Scheme Handling (PM-JAY & ESI)
    if (isStatutory) {
      if (isVerified) {
        // Empanelled statutory facility: 100% cashless treatment, zero patient payable
        return {
          estimatedBill: totalBill,
          eligibleAmount: totalBill,
          roomRentExcess: 0,
          roomRentExcessPerDay: 0,
          roomLimitEligiblePerDay: roomRate,
          roomLimitType: 'Statutory Scheme Entitlement',
          proportionateDeductionActive: false,
          proportionateDisallowance: 0,
          deductibleApplied: 0,
          deductibleUnknown: false,
          effectiveCopayPercent: 0,
          copayAmount: 0,
          isCopayUncertain: false,
          sumInsuredExcess: 0,
          isSumInsuredUnknown: false,
          modelledNonMedicalAllowance: 0,
          patientPayable: 0,
          insurerEstimatedShare: totalBill,
          isSpecialtyExcluded: false
        };
      } else {
        // Non-empanelled / unverified: statutory cashless benefits do NOT apply
        return {
          estimatedBill: totalBill,
          eligibleAmount: 0,
          roomRentExcess: 0,
          roomRentExcessPerDay: 0,
          roomLimitEligiblePerDay: 0,
          roomLimitType: 'Empanelled Centers Only',
          proportionateDeductionActive: false,
          proportionateDisallowance: 0,
          deductibleApplied: 0,
          deductibleUnknown: false,
          effectiveCopayPercent: null,
          copayAmount: 0,
          isCopayUncertain: false,
          sumInsuredExcess: totalBill,
          isSumInsuredUnknown: false,
          modelledNonMedicalAllowance: 0,
          patientPayable: totalBill,
          insurerEstimatedShare: 0,
          isSpecialtyExcluded: false
        };
      }
    }

    // 2. Private / Corporate Health Insurance Policy Rules

    // Sum Insured
    const hasSumInsured = typeof policy.sumInsured === 'number' && policy.sumInsured > 0;
    const sumInsured = hasSumInsured ? (policy.sumInsured as number) : 0;
    const isSumInsuredUnknown = !hasSumInsured;

    // Room limit evaluation
    let roomLimitEligiblePerDay = 999999;
    let roomLimitType = 'No Capping (Unlimited)';

    if (policy.roomLimit) {
      if (policy.roomLimit.type === 'amount' && policy.roomLimit.value) {
        roomLimitEligiblePerDay = Number(policy.roomLimit.value);
        roomLimitType = `₹${roomLimitEligiblePerDay.toLocaleString('en-IN')}/day`;
      } else if (policy.roomLimit.type === 'percent' && policy.roomLimit.value) {
        const pct = Number(policy.roomLimit.value);
        if (hasSumInsured) {
          roomLimitEligiblePerDay = Math.round(sumInsured * (pct / 100));
          roomLimitType = `${pct}% of SUM INSURED(SI) (₹${roomLimitEligiblePerDay.toLocaleString('en-IN')}/day)`;
        } else {
          roomLimitType = `${pct}% of SUM INSURED(SI) (Unknown SI)`;
        }
      } else if (policy.roomLimit.type === 'category' && policy.roomLimit.value) {
        const cat = String(policy.roomLimit.value);
        roomLimitType = cat;
        if (cat.toLowerCase().includes('general')) {
          roomLimitEligiblePerDay = estimate.roomCostPerDay;
        } else if (cat.toLowerCase().includes('twin')) {
          roomLimitEligiblePerDay = estimate.roomCostPerDay;
        }
      }
    }

    const roomRentExcessPerDay = Math.max(0, roomRate - roomLimitEligiblePerDay);
    const totalRoomRentExcess = roomRentExcessPerDay * stayDays;

    // Sublimits evaluation (e.g. Knee Replacement ₹20,000 cap)
    let sublimitExcess = 0;
    let applicableSublimit: number | null = null;
    let sublimitName: string | null = null;

    if (policy.subLimits && typeof policy.subLimits === 'object') {
      const proc = (procedure || '').toLowerCase().trim();
      const spec = (specialty || '').toLowerCase().trim();
      for (const [key, limitVal] of Object.entries(policy.subLimits)) {
        if (typeof limitVal === 'number' && limitVal > 0) {
          const k = key.toLowerCase().trim();
          if (
            (proc && (proc.includes(k) || k.includes(proc))) ||
            (spec && (spec.includes(k) || k.includes(spec))) ||
            (proc.includes('knee') && k.includes('knee'))
          ) {
            applicableSublimit = limitVal;
            sublimitName = key;
            break;
          }
        }
      }
    }

    if (applicableSublimit !== null && procedureCharges > applicableSublimit) {
      sublimitExcess = procedureCharges - applicableSublimit;
    }

    // Proportionate Deduction
    let proportionateDisallowance = 0;
    const proportionateDeductionActive = Boolean(
      policy.proportionateDeduction && roomRentExcessPerDay > 0
    );

    if (proportionateDeductionActive && roomRate > 0) {
      const allowedRatio = Math.min(1, roomLimitEligiblePerDay / roomRate);
      const effectiveProcedure = Math.max(0, procedureCharges - sublimitExcess);
      const associateMedicalExpenses = effectiveProcedure + doctorFees;
      proportionateDisallowance = Math.round(associateMedicalExpenses * (1 - allowedRatio));
    }

    // Eligible amount before deductible & copay
    const eligibleAmount = Math.max(
      0,
      totalBill - totalRoomRentExcess - proportionateDisallowance - sublimitExcess
    );

    // Deductible Handling (P0.2)
    let deductibleApplied: number | null = null;
    let deductibleUnknown = false;
    let remainingAfterDeductible = eligibleAmount;

    if (typeof policy.deductible === 'number' && policy.deductible >= 0) {
      deductibleApplied = Math.min(eligibleAmount, policy.deductible);
      remainingAfterDeductible = Math.max(0, eligibleAmount - deductibleApplied);
    } else if (policy.deductible === null || policy.deductible === undefined) {
      deductibleApplied = null;
      deductibleUnknown = true;
      remainingAfterDeductible = eligibleAmount;
    }

    // Co-pay Handling (P0.3)
    let effectiveCopayPercent: number | null = null;
    let isCopayUncertain = false;
    let copayAmount = 0;

    if (isVerified) {
      if (typeof policy.copay === 'number' && policy.copay >= 0) {
        effectiveCopayPercent = policy.copay;
        copayAmount = Math.round(remainingAfterDeductible * (effectiveCopayPercent / 100));
      } else {
        effectiveCopayPercent = 0;
        copayAmount = 0;
      }
    } else {
      // Non-network hospital
      if (typeof policy.nonNetworkCopay === 'number' && policy.nonNetworkCopay >= 0) {
        effectiveCopayPercent = policy.nonNetworkCopay;
        copayAmount = Math.round(remainingAfterDeductible * (effectiveCopayPercent / 100));
      } else {
        // Unknown non-network copay: do not invent 10% or base copay
        effectiveCopayPercent = null;
        isCopayUncertain = true;
        copayAmount = 0;
      }
    }

    // Excess over Sum Insured (P2.2)
    let sumInsuredExcess = 0;
    const remainingClaim = Math.max(0, remainingAfterDeductible - copayAmount);

    if (hasSumInsured) {
      sumInsuredExcess = Math.max(0, remainingClaim - sumInsured);
    } else {
      sumInsuredExcess = 0;
    }

    // Modelled non-medical consumables (5%) (P2.1)
    const modelledNonMedicalAllowance = Math.round(totalBill * 0.05);

    // Total Patient Payable
    const patientPayable = Math.round(
      totalRoomRentExcess +
      proportionateDisallowance +
      sublimitExcess +
      (deductibleApplied ?? 0) +
      copayAmount +
      sumInsuredExcess +
      modelledNonMedicalAllowance
    );

    const insurerEstimatedShare = Math.max(0, totalBill - patientPayable);

    return {
      estimatedBill: totalBill,
      eligibleAmount,
      roomRentExcess: totalRoomRentExcess,
      roomRentExcessPerDay,
      roomLimitEligiblePerDay,
      roomLimitType,
      proportionateDeductionActive,
      proportionateDisallowance,
      deductibleApplied,
      deductibleUnknown,
      effectiveCopayPercent,
      copayAmount,
      isCopayUncertain,
      sumInsuredExcess,
      isSumInsuredUnknown,
      modelledNonMedicalAllowance,
      patientPayable,
      insurerEstimatedShare,
      sublimitExcess,
      applicableSublimit,
      sublimitName,
      isSpecialtyExcluded: false
    };
  }

  public rankHospitals(
    hospitals: HospitalRecord[],
    policy: PolicyDocument,
    specialty?: string,
    procedure?: string,
    roomType: RoomCategory = 'General Ward'
  ): RankedHospitalItem[] {
    const sumInsured = policy.sumInsured && policy.sumInsured > 0 ? policy.sumInsured : 500000;

    interface PreRankItem {
      hospital: HospitalRecord;
      estimate: HospitalEstimate;
      networkInfo: HospitalNetworkInfo;
      impact: CanonicalFinancialImpact;
      nameRelevance: SpecialtyNameMatch;
      coverageFit: number;
      patientCostFit: number;
      hospitalTypeScore: number;
      coPayFit: number;
      finalScore: number;
      granularScore: number;
    }

    const preItems: PreRankItem[] = [];

    for (const h of hospitals) {
      const est = this.calculateHospitalEstimate(h, specialty, procedure, roomType);
      if (!est.available) continue;

      const netInfo = getHospitalNetworkStatus(h, policy.insurer, policy.insurerAliases);
      const isVerified = netInfo.networkStatus === 'verified';
      const impact = this.calculatePolicyImpact(est, policy, netInfo.networkStatus, roomType, specialty, procedure);
      const nameRelevance = calculateSpecialtyNameRelevance(h.hospital_name, specialty);

      const C = est.totalCost;

      // 1. CoverageFit (50% weight): Insurance Protection & Financial Safety Fit
      let continuousCoverageFit = 100;
      if (policy.policyType === 'pmjay' || policy.policyType === 'esi') {
        continuousCoverageFit = isVerified ? 100 : 0;
      } else {
        // (a) Network cashless base
        const absorptiveRatio = C > 0 ? (impact.insurerEstimatedShare / C) : 1;
        continuousCoverageFit = absorptiveRatio * 100;
        if (!isVerified) {
          continuousCoverageFit -= 35; // Non-network penalty
        }

        // (b) Room Rent Limit Compliance & Proportionate Disallowance Avoidance
        if (impact.proportionateDeductionActive && impact.proportionateDisallowance > 0) {
          continuousCoverageFit -= Math.min(30, 15 + (impact.proportionateDisallowance / Math.max(1, C)) * 35);
        } else if (impact.roomRentExcess > 0) {
          continuousCoverageFit -= 12;
        } else {
          // Room headroom buffer bonus (up to +4 pts for comfortable room tariff buffer)
          const roomLimitPerDay = impact.roomLimitEligiblePerDay > 0 ? impact.roomLimitEligiblePerDay : 5000;
          const roomRate = est.roomCostPerDay || 2500;
          const roomHeadroomRatio = Math.max(0, Math.min(1, (roomLimitPerDay - roomRate) / roomLimitPerDay));
          continuousCoverageFit += roomHeadroomRatio * 4;
        }

        // (c) Sum Insured Adequacy & Buffer Cushion
        const effectiveSI = sumInsured || 500000;
        if (impact.sumInsuredExcess > 0) {
          const excessRatio = C > 0 ? (impact.sumInsuredExcess / C) : 1;
          continuousCoverageFit -= Math.min(35, Math.round(excessRatio * 40));
        } else {
          const siUsageRatio = C / effectiveSI;
          continuousCoverageFit += Math.max(0, 5 * (1 - Math.min(1, siUsageRatio)));
        }

        // (d) Patient Out-of-Pocket Burden Ratio
        const oopRatio = C > 0 ? (impact.patientPayable / effectiveSI) : 0;
        if (oopRatio > 0.50) continuousCoverageFit -= 20;
        else if (oopRatio > 0.25) continuousCoverageFit -= 10;
        else if (oopRatio > 0.10) continuousCoverageFit -= 5;

        continuousCoverageFit = Math.max(0, Math.min(100, continuousCoverageFit));
      }

      // 2. PatientCostFit (25% weight): Policy Sum-Insured-to-Hospital-Segment Alignment & Tariff Efficiency
      const segNorm = normalize(h.segment);
      const effectiveSI = sumInsured || 500000;
      let segmentFitScore = 80;

      if (effectiveSI >= 1000000) {
        if (segNorm.includes('established')) segmentFitScore = 100;
        else if (segNorm.includes('premium')) segmentFitScore = 95;
        else if (segNorm.includes('standard')) segmentFitScore = 88;
        else if (segNorm.includes('luxury')) segmentFitScore = 82;
        else segmentFitScore = 70;
      } else if (effectiveSI >= 500000) {
        if (segNorm.includes('standard')) segmentFitScore = 100;
        else if (segNorm.includes('established')) segmentFitScore = 96;
        else if (segNorm.includes('premium')) segmentFitScore = 82;
        else if (segNorm.includes('budget') || segNorm.includes('local')) segmentFitScore = 82;
        else segmentFitScore = 68;
      } else {
        if (segNorm.includes('standard')) segmentFitScore = 100;
        else if (segNorm.includes('budget') || segNorm.includes('local') || normalize(h.hospital_type) === 'government') segmentFitScore = 100;
        else if (segNorm.includes('established')) segmentFitScore = 76;
        else if (segNorm.includes('premium')) segmentFitScore = 55;
        else segmentFitScore = 40;
      }

      // Continuous tariff efficiency offset from hospital-specific cost variation
      const efficiencyOffset = - (est.hospitalVariation * 15);
      const oopBurden = Math.min(25, (impact.patientPayable / effectiveSI) * 50);
      const continuousPatientCostFit = Math.max(0, Math.min(100, segmentFitScore + efficiencyOffset - oopBurden));

      // 3. HospitalTypeScore (15% weight): Institutional Trust & Empanelment Depth
      const insurerCount = Array.isArray(h.insurers) ? h.insurers.length : 0;
      const empanelmentScore = 60 + Math.min(35, insurerCount * 3.2);
      let statureBonus = 0;
      const typeNorm = normalize(h.hospital_type);
      if (typeNorm === 'government') {
        statureBonus = 15;
      } else if (segNorm.includes('established') || segNorm.includes('premium')) {
        statureBonus = 5;
      }
      const continuousHospitalTypeScore = Math.max(0, Math.min(100, empanelmentScore + statureBonus));

      // 4. CoPayFit (10% weight): Clinical Capability & Co-Pay Predictability
      let coPayBase = 90;
      if (impact.effectiveCopayPercent !== null) {
        if (impact.effectiveCopayPercent === 0) coPayBase = 100;
        else if (impact.effectiveCopayPercent <= 10) coPayBase = 90;
        else if (impact.effectiveCopayPercent <= 20) coPayBase = 75;
        else coPayBase = 50;
      } else {
        coPayBase = isVerified ? 90 : 60;
      }

      const specialtyCount = Array.isArray(h.specialties) ? h.specialties.length : 0;
      const clinicalBreadth = Math.min(18, specialtyCount * 1.8);
      const nameMatchScore = nameRelevance?.score || 0;
      const relevanceBonus = (nameMatchScore / 100) * 10;
      const continuousCoPayFit = Math.max(0, Math.min(100, 72 + (coPayBase - 72) * 0.5 + clinicalBreadth + relevanceBonus));

      const coverageFit = Math.round(continuousCoverageFit);
      const patientCostFit = Math.round(continuousPatientCostFit);
      const hospitalTypeScore = Math.round(continuousHospitalTypeScore);
      const coPayFit = Math.round(continuousCoPayFit);

      const finalScore = Math.round(
        (0.50 * coverageFit) +
        (0.25 * patientCostFit) +
        (0.15 * hospitalTypeScore) +
        (0.10 * coPayFit)
      );

      const granularScore = Math.round(
        ((0.50 * continuousCoverageFit) +
        (0.25 * continuousPatientCostFit) +
        (0.15 * continuousHospitalTypeScore) +
        (0.10 * continuousCoPayFit)) * 10
      ) / 10;

      preItems.push({
        hospital: h,
        estimate: est,
        networkInfo: netInfo,
        impact,
        nameRelevance,
        coverageFit,
        patientCostFit,
        hospitalTypeScore,
        coPayFit,
        finalScore,
        granularScore
      });
    }

    if (preItems.length === 0) return [];

    const ranked: RankedHospitalItem[] = preItems.map(item => {
      const score: ScoreBreakdown = {
        coverageFit: item.coverageFit,
        patientCostFit: item.patientCostFit,
        hospitalTypeScore: item.hospitalTypeScore,
        coPayFit: item.coPayFit,
        finalScore: item.finalScore,
        granularScore: item.granularScore,
        patientPayable: item.impact.patientPayable,
        insurerEstimatedShare: item.impact.insurerEstimatedShare,
        coPayAmount: item.impact.copayAmount,
        excessOverSI: item.impact.sumInsuredExcess,
        totalRoomRentExcess: item.impact.roomRentExcess,
        proportionateDisallowance: item.impact.proportionateDisallowance,
        deductibleApplied: item.impact.deductibleApplied,
        deductibleUnknown: item.impact.deductibleUnknown,
        modelledNonMedicalAllowance: item.impact.modelledNonMedicalAllowance,
        isCopayUncertain: item.impact.isCopayUncertain,
        isSumInsuredUnknown: item.impact.isSumInsuredUnknown,
        networkStatus: item.networkInfo.networkStatus
      };

      return {
        hospital: item.hospital,
        estimate: item.estimate,
        score,
        networkInfo: item.networkInfo,
        rank: 0,
        specialtyNameMatch: item.nameRelevance,
        specialtyNameRelevance: item.nameRelevance
      };
    });

    // Sort descending:
    // 1. Verified network hospitals first (network constraint / priority)
    // 2. Specialty Name Relevance score (promotes dedicated facilities when specialty selected)
    // 3. SehatSure Policy Fit Score (finalScore)
    // 4. Granular continuous score (differentiates tied finalScore)
    // 5. Financial fit: lower patient payable
    // 6. Higher hospital rating
    // 7. Deterministic alphabetical hospital name
    ranked.sort((a, b) => {
      const aVerified = a.networkInfo.networkStatus === 'verified' ? 1 : 0;
      const bVerified = b.networkInfo.networkStatus === 'verified' ? 1 : 0;
      if (aVerified !== bVerified) {
        return bVerified - aVerified;
      }

      const aNameScore = a.specialtyNameMatch?.score || 0;
      const bNameScore = b.specialtyNameMatch?.score || 0;
      if (bNameScore !== aNameScore) {
        return bNameScore - aNameScore;
      }

      if (b.score.finalScore !== a.score.finalScore) {
        return b.score.finalScore - a.score.finalScore;
      }

      const aGranular = a.score.granularScore ?? a.score.finalScore;
      const bGranular = b.score.granularScore ?? b.score.finalScore;
      if (bGranular !== aGranular) {
        return bGranular - aGranular;
      }

      if (a.score.patientPayable !== b.score.patientPayable) {
        return a.score.patientPayable - b.score.patientPayable;
      }
      if ((b.hospital.rating || 0) !== (a.hospital.rating || 0)) {
        return (b.hospital.rating || 0) - (a.hospital.rating || 0);
      }
      return a.hospital.hospital_name.localeCompare(b.hospital.hospital_name);
    });

    ranked.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return ranked;
  }

  public getDetailedBillBreakdown(
    hospitalName: string,
    hospitalAddress: string,
    policy: PolicyDocument,
    specialty?: string,
    procedure?: string,
    roomType: RoomCategory = 'General Ward'
  ): PolicyImpactBreakdown | null {
    const hosp = this.hospitals.find(h =>
      normalize(h.hospital_name) === normalize(hospitalName) &&
      normalize(h.address).includes(normalize(hospitalAddress).slice(0, 20))
    ) || this.hospitals.find(h => normalize(h.hospital_name) === normalize(hospitalName));

    if (!hosp) return null;

    const estimate = this.calculateHospitalEstimate(hosp, specialty, procedure, roomType);
    if (!estimate.available) return null;

    const netInfo = getHospitalNetworkStatus(hosp, policy.insurer, policy.insurerAliases);
    const isVerified = netInfo.networkStatus === 'verified';

    const stayDays = Math.max(1, Math.round(estimate.estimatedStayDays));
    const roomRate = estimate.roomCostPerDay;
    const roomCharges = estimate.roomCost;
    const procedureCharges = estimate.treatmentCost;
    const doctorFees = Math.round(procedureCharges * 0.20);
    const medicineCharges = Math.round(procedureCharges * 0.10);
    const otherCharges = 0;
    const totalBill = procedureCharges + doctorFees + medicineCharges + roomCharges;

    const itemizedBill: ItemizedBill = {
      roomCharges,
      roomRatePerDay: roomRate,
      stayDays,
      procedureCharges,
      medicineCharges,
      doctorFees,
      otherCharges,
      totalBill
    };

    // Calculate canonical policy impact using shared engine
    const impact = this.calculatePolicyImpact(estimate, policy, netInfo.networkStatus, roomType, specialty, procedure);

    // AI Smart Recommendations & Advice
    const aiRecommendations: PolicyImpactBreakdown['aiRecommendations'] = [];

    // Department / Treatment Exclusion Notice
    if (impact.isSpecialtyExcluded) {
      aiRecommendations.push({
        type: 'warning',
        title: 'Department / Treatment Excluded Under Policy',
        message: `Your policy explicitly excludes ${specialty || procedure || 'this department/treatment'}. Claims arising from or primarily related to this care are not payable by the insurer, so the total bill of ₹${totalBill.toLocaleString('en-IN')} is payable out-of-pocket.`
      });
    }

    // Procedure Sublimit Notice
    if (impact.sublimitExcess && impact.sublimitExcess > 0) {
      aiRecommendations.push({
        type: 'warning',
        title: `Procedure Sublimit Active (${impact.sublimitName || 'Treatment Limit'})`,
        message: `Your policy caps coverage for ${procedure || 'this procedure'} at ₹${(impact.applicableSublimit || 0).toLocaleString('en-IN')}. The excess treatment expense of ₹${impact.sublimitExcess.toLocaleString('en-IN')} is payable out-of-pocket.`
      });
    }

    // Authoritative Network Guidance (Section 2, 9, 11)
    if (netInfo.networkStatus === 'verified') {
      aiRecommendations.push({
        type: 'success',
        title: 'Verified Network Partner (Cashless Eligible)',
        message: `${hosp.hospital_name} is verified in the network for ${policy.insurer || 'your insurer'}. Cashless pre-authorization can proceed smoothly through the hospital insurance desk.`
      });
    } else if (netInfo.networkStatus === 'no_match') {
      aiRecommendations.push({
        type: 'warning',
        title: 'No Verified Network Match (Reimbursement Only)',
        message: `${hosp.hospital_name} is not in the verified cashless network for ${policy.insurer || 'your insurer'}. Claims must be settled directly at discharge and submitted for reimbursement.`
      });
    } else if (netInfo.networkStatus === 'unverified') {
      aiRecommendations.push({
        type: 'warning',
        title: 'Network Status Not Verified',
        message: `Insurer empanelment records for ${hosp.hospital_name} are insufficient to confirm network status. Verify tie-up with the hospital insurance/TPA desk prior to admission.`
      });
    } else {
      aiRecommendations.push({
        type: 'info',
        title: 'Network Status Unknown',
        message: `Policy insurer details are unverified. Please confirm your insurer to evaluate cashless eligibility.`
      });
    }

    // Room Rent & Proportionate Deduction Advice
    if (!impact.isSpecialtyExcluded && impact.roomRentExcess > 0) {
      const savingsIfDowngraded = impact.roomRentExcess + impact.proportionateDisallowance;
      aiRecommendations.push({
        type: 'warning',
        title: 'Room Rent Exceeds Policy Limit',
        message: `Your policy caps room rent at ${impact.roomLimitType}. The selected ${roomType} costs ₹${roomRate.toLocaleString('en-IN')}/day, leaving an excess of ₹${impact.roomRentExcessPerDay.toLocaleString('en-IN')}/day to be paid out-of-pocket.`,
        actionable: `Switching to a lower room category (e.g. Twin Sharing or General Ward) could save you up to ₹${savingsIfDowngraded.toLocaleString('en-IN')}!`
      });
    }

    if (!impact.isSpecialtyExcluded && impact.proportionateDisallowance > 0) {
      aiRecommendations.push({
        type: 'warning',
        title: 'Proportionate Deduction Penalty Active',
        message: `Because you exceeded the room rent limit, the insurer proportionately reduces doctor and procedure charges by ₹${impact.proportionateDisallowance.toLocaleString('en-IN')}. This penalty disappears if you select an eligible room category.`
      });
    }

    // Deductible Advice
    if (impact.deductibleApplied !== null && impact.deductibleApplied > 0) {
      aiRecommendations.push({
        type: 'info',
        title: 'Compulsory Policy Deductible Applied',
        message: `Your policy mandates a deductible of ₹${impact.deductibleApplied.toLocaleString('en-IN')}, which must be paid by the patient before insurer coverage begins.`
      });
    } else if (impact.deductibleUnknown) {
      aiRecommendations.push({
        type: 'info',
        title: 'Deductible Clause Not Established',
        message: `No compulsory deductible was identified in the uploaded document. If your policy has a deductible, out-of-pocket costs will adjust accordingly.`
      });
    }

    // Sum Insured Cushion / Excess
    if (impact.sumInsuredExcess > 0) {
      const siDisplay = policy.sumInsured ? `₹${Number(policy.sumInsured).toLocaleString('en-IN')}` : 'your available limit';
      aiRecommendations.push({
        type: 'warning',
        title: 'Estimated Cost Exceeds Sum Insured',
        message: `The total estimated cost exceeds your available Sum Insured of ${siDisplay} by ₹${impact.sumInsuredExcess.toLocaleString('en-IN')}. Consider checking standard private or government network facilities in this city.`
      });
    } else if (isVerified && policy.sumInsured && policy.sumInsured > 0) {
      aiRecommendations.push({
        type: 'success',
        title: 'Comfortable Sum Insured Cushion',
        message: `The total estimated treatment cost (₹${totalBill.toLocaleString('en-IN')}) is within your ₹${Number(policy.sumInsured).toLocaleString('en-IN')} Sum Insured. Cashless pre-authorization can proceed smoothly.`
      });
    }

    if (impact.effectiveCopayPercent !== null && impact.effectiveCopayPercent > 0) {
      aiRecommendations.push({
        type: 'info',
        title: `${impact.effectiveCopayPercent}% Co-payment Required`,
        message: `Your policy mandates a ${impact.effectiveCopayPercent}% co-pay (₹${impact.copayAmount.toLocaleString('en-IN')}) on admissible claims.`
      });
    } else if (impact.isCopayUncertain) {
      aiRecommendations.push({
        type: 'warning',
        title: 'Non-Network Co-Payment Rate Not Specified',
        message: `The policy document does not specify a distinct non-network co-pay. Out-of-network claims may be subject to additional reimbursement restrictions.`
      });
    }

    // Alternative Hospital Suggestions (ONLY VERIFIED NETWORK ALTERNATIVES)
    try {
      const cityKey = normalize(hosp.city);
      const cityHospitals = this.hospitalsByCity.get(cityKey) || [];
      const otherVerifiedNetwork = cityHospitals.filter(h =>
        normalize(h.hospital_name) !== normalize(hosp.hospital_name) &&
        this.isInsurerEmpanelled(h, policy.insurer || '', policy.insurerAliases || [])
      );

      if (otherVerifiedNetwork.length > 0) {
        const scoredAlternatives = otherVerifiedNetwork
          .map(h => ({
            hospital: h,
            estimate: this.calculateHospitalEstimate(h, specialty, procedure, roomType)
          }))
          .filter(item => item.estimate.available);

        // A) Cheaper Hospital Alternative
        const cheaperOptions = scoredAlternatives.filter(a => a.estimate.totalCost < totalBill * 0.95);
        if (cheaperOptions.length > 0) {
          cheaperOptions.sort((a, b) => a.estimate.totalCost - b.estimate.totalCost);
          const topCheaper = cheaperOptions[0];
          const potentialSavings = totalBill - topCheaper.estimate.totalCost;
          aiRecommendations.push({
            type: 'suggestion',
            title: `Cheaper Verified Network Hospital: ${topCheaper.hospital.hospital_name}`,
            message: `${topCheaper.hospital.hospital_name} (${topCheaper.hospital.segment || 'Budget/Standard'}) in ${topCheaper.hospital.address.split(',')[0]} is verified in network under ${policy.insurer}. Estimated cost is ₹${topCheaper.estimate.totalCost.toLocaleString('en-IN')}, saving you approximately ₹${potentialSavings.toLocaleString('en-IN')}.`,
            actionable: `Switching to ${topCheaper.hospital.hospital_name} significantly lowers out-of-pocket expenses while maintaining full network cashless coverage.`
          });
        }

        // B) Higher-Tier / Premium Hospital Alternative
        const siVal = policy.sumInsured || 0;
        if (impact.sumInsuredExcess === 0 && siVal > 0 && totalBill < siVal * 0.90) {
          const higherOptions = scoredAlternatives.filter(a =>
            a.estimate.totalCost > totalBill * 1.05 &&
            a.estimate.totalCost <= siVal
          );
          if (higherOptions.length > 0) {
            higherOptions.sort((a, b) => {
              const segScoreA = SEGMENT_POSITION[normalize(a.hospital.segment)] || 0.4;
              const segScoreB = SEGMENT_POSITION[normalize(b.hospital.segment)] || 0.4;
              if (segScoreB !== segScoreA) return segScoreB - segScoreA;
              return (b.hospital.rating || 0) - (a.hospital.rating || 0);
            });
            const topHigher = higherOptions[0];
            aiRecommendations.push({
              type: 'info',
              title: `Premium Network Option: ${topHigher.hospital.hospital_name}`,
              message: `Because your Sum Insured of ₹${siVal.toLocaleString('en-IN')} has plenty of room, you can also consider ${topHigher.hospital.hospital_name} (${topHigher.hospital.segment}${topHigher.hospital.rating > 0 ? `, ★ ${topHigher.hospital.rating.toFixed(1)}` : ''}). Estimated cost is ₹${topHigher.estimate.totalCost.toLocaleString('en-IN')}.`,
              actionable: `Provides top-tier clinical care and private room comfort fully covered within your remaining Sum Insured buffer.`
            });
          }
        }
      }
    } catch (recErr) {
      console.warn('[Advisor Alternatives Warning]:', recErr);
    }

    if (isVerified) {
      aiRecommendations.push({
        type: 'info',
        title: 'Cashless Admission Protocol',
        message: `For planned admissions, submit your cashless pre-authorization form at the hospital TPA / Insurance desk at least 48 to 72 hours in advance. For emergency hospitalizations, intimation must be completed within 24 hours of admission.`
      });
    }

    if (impact.modelledNonMedicalAllowance > 0) {
      aiRecommendations.push({
        type: 'warning',
        title: 'Modelled Non-Medical Expenses Allowance',
        message: `IRDAI guidelines exclude non-medical consumables (registration charges, PPE, sanitization packs, admission kits) from insurance reimbursement. Keep approximately ₹${impact.modelledNonMedicalAllowance.toLocaleString('en-IN')} ready for direct settlement at discharge.`
      });
    }

    return {
      itemizedBill,
      networkInfo: netInfo,
      roomLimitEligiblePerDay: impact.roomLimitEligiblePerDay,
      roomLimitType: impact.roomLimitType,
      roomRentExcessPerDay: impact.roomRentExcessPerDay,
      totalRoomRentExcess: impact.roomRentExcess,
      proportionateDeductionActive: impact.proportionateDeductionActive,
      proportionateDisallowance: impact.proportionateDisallowance,
      copayPercent: impact.effectiveCopayPercent,
      copayAmount: impact.copayAmount,
      isCopayUncertain: impact.isCopayUncertain,
      deductibleApplied: impact.deductibleApplied,
      deductibleUnknown: impact.deductibleUnknown,
      excessOverSumInsured: impact.sumInsuredExcess,
      isSumInsuredUnknown: impact.isSumInsuredUnknown,
      modelledNonMedicalAllowance: impact.modelledNonMedicalAllowance,
      nonMedicalDeductible: impact.modelledNonMedicalAllowance,
      totalPatientPayable: impact.patientPayable,
      totalInsuranceCovered: impact.insurerEstimatedShare,
      sublimitExcess: impact.sublimitExcess,
      applicableSublimit: impact.applicableSublimit,
      sublimitName: impact.sublimitName,
      isSpecialtyExcluded: impact.isSpecialtyExcluded,
      aiRecommendations
    };
  }

  public search(params: {
    policy: PolicyDocument;
    city?: string;
    specialty?: string;
    procedure?: string;
    roomType?: RoomCategory;
    query?: string;
    networkOnly?: boolean;
  }): HospitalSearchResult {
    const { policy, city, specialty, procedure, roomType = 'General Ward', query, networkOnly = false } = params;

    let candidateHospitals: HospitalRecord[] = [];

    if (city && city.trim().length > 0) {
      const normCity = normalize(city);
      candidateHospitals = this.hospitalsByCity.get(normCity) || [];
      if (candidateHospitals.length === 0) {
        candidateHospitals = this.hospitals.filter(h =>
          normalize(h.city).includes(normCity) || normalize(h.address).includes(normCity)
        );
      }
    } else {
      candidateHospitals = this.hospitalsByCity.get('bengaluru') || this.hospitals.slice(0, 500);
    }

    // Step 1: Medical Specialty Matched Count in this location
    let specialtyMatchedCount = candidateHospitals.length;
    let normSpec = '';
    const canonicalSpec = normalizeSpecialtyKey(specialty);
    const targetSpecs = canonicalSpec
      ? Array.from(new Set([normalize(specialty), normalize(canonicalSpec)]))
      : (specialty ? [normalize(specialty)] : []);

    const matchesSpecialty = (h: HospitalRecord): boolean => {
      if (targetSpecs.length === 0) return true;
      const inSpecialties = h.specialties.some(s => {
        const ns = normalize(s);
        return targetSpecs.some(ts => ns.includes(ts) || ts.includes(ns));
      });
      if (inSpecialties) return true;
      if (specialty) {
        const nameMatch = calculateSpecialtyNameRelevance(h.hospital_name, specialty);
        if (nameMatch.matched) return true;
      }
      return false;
    };

    if (specialty && specialty.trim().length > 0) {
      normSpec = normalize(specialty);
      specialtyMatchedCount = candidateHospitals.filter(matchesSpecialty).length;
    }

    // Step 2: Contextual Procedure Matched Count in this location (P1.8)
    // If specialty is selected, procedure count must be calculated within the specialty context
    const contextualProcedureCandidates = normSpec
      ? candidateHospitals.filter(matchesSpecialty)
      : candidateHospitals;

    let procedureMatchedCount = contextualProcedureCandidates.length;
    if (procedure && procedure.trim().length > 0) {
      procedureMatchedCount = contextualProcedureCandidates.filter(h =>
        this.calculateHospitalEstimate(h, specialty, procedure, roomType).available
      ).length;
    }

    // Step 3: Apply Specialty Filter
    if (normSpec) {
      candidateHospitals = candidateHospitals.filter(matchesSpecialty);
    }

    // Step 4: Apply Query Search (name, address, locality, specialty)
    if (query && query.trim().length > 0) {
      const normQ = normalize(query);
      candidateHospitals = candidateHospitals.filter(h =>
        normalize(h.hospital_name).includes(normQ) ||
        normalize(h.address).includes(normQ) ||
        normalize(h.segment).includes(normQ) ||
        normalize(h.hospital_type).includes(normQ) ||
        h.specialties.some(s => normalize(s).includes(normQ))
      );
    }

    // Step 5: Classify Network Status for All Candidate Facilities
    const insurerName = policy.insurer || '';
    const aliases = policy.insurerAliases || [];

    const classifiedCandidates = candidateHospitals.map(h => ({
      hospital: h,
      networkInfo: getHospitalNetworkStatus(h, insurerName, aliases)
    }));

    // Explicit count of verified network facilities ONLY
    const networkFacilityCount = classifiedCandidates.filter(c => c.networkInfo.networkStatus === 'verified').length;

    // Step 6: Mode A — "Network hospitals only"
    if (networkOnly) {
      const verifiedHospitals = classifiedCandidates
        .filter(c => c.networkInfo.networkStatus === 'verified')
        .map(c => c.hospital);

      if (verifiedHospitals.length === 0) {
        return {
          hospitals: [],
          totalCount: 0,
          networkFacilityCount: 0,
          specialtyMatchedCount,
          procedureMatchedCount,
          cityAverageCost: 0,
          networkStatus: 'no_match',
          message: 'No verified network hospitals were found for this insurer in the selected location.'
        };
      }

      const ranked = this.rankHospitals(verifiedHospitals, policy, specialty, procedure, roomType);
      let cityAverageCost = 0;
      if (ranked.length > 0) {
        const sum = ranked.reduce((acc, curr) => acc + curr.estimate.totalCost, 0);
        cityAverageCost = Math.round(sum / ranked.length);
      }

      return {
        hospitals: ranked,
        totalCount: ranked.length,
        networkFacilityCount,
        specialtyMatchedCount,
        procedureMatchedCount,
        cityAverageCost,
        networkStatus: 'verified'
      };
    }

    // Step 7: Mode B & C — Default Insurance-Aware Discovery
    const targetHospitals = classifiedCandidates.map(c => c.hospital);
    const ranked = this.rankHospitals(targetHospitals, policy, specialty, procedure, roomType);

    let cityAverageCost = 0;
    if (ranked.length > 0) {
      const sum = ranked.reduce((acc, curr) => acc + curr.estimate.totalCost, 0);
      cityAverageCost = Math.round(sum / ranked.length);
    }

    return {
      hospitals: ranked,
      totalCount: ranked.length,
      networkFacilityCount,
      specialtyMatchedCount,
      procedureMatchedCount,
      cityAverageCost,
      networkStatus: networkFacilityCount > 0 ? 'verified' : (insurerName ? 'no_match' : 'unknown')
    };
  }
}


export const hospitalService = new HospitalService();
export { calculateSpecialtyNameRelevance, SPECIALTY_NAME_KEYWORDS } from '../config/specialtyNameKeywords.js';
