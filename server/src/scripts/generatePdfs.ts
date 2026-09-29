import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.resolve(__dirname, '../../../mock-policies');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function createStarHealthPdf() {
  const filePath = path.join(outputDir, 'star_health_optima.pdf');
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fontSize(20).fillColor('#0b4f6c').text('STAR HEALTH AND ALLIED INSURANCE CO. LTD.', { align: 'center' });
  doc.fontSize(11).fillColor('#666666').text('Regd. & Corporate Office: 1, New Tank Street, Valluvar Kottam High Road, Nungambakkam, Chennai - 600034', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(15).fillColor('#2E7D5B').text('POLICY SCHEDULE — FAMILY HEALTH OPTIMA INSURANCE PLAN', { align: 'center', underline: true });
  doc.moveDown(1);

  // Policy Details Table
  doc.fillColor('#000000').fontSize(10);
  doc.text('Policy Number: P/141234/01/2026/001234', { continued: true }).text('           UIN: SHAHLIP26046V092526');
  doc.text('Policy Period: From 00:00 hrs of 2026-04-01 to midnight of 2027-03-31');
  doc.text('Insured Person: R. Sharma (Age: 52 yrs, Relation: Self)');
  doc.text('Geographical Zone: Zone B | Third Party Administrator (TPA): Medi Assist');
  doc.text('Total Sum Insured: Rs. 3,00,000 (Rupees Three Lakhs Only)');
  doc.text('Cumulative Bonus: Rs. 15,000 | Compulsory Deductible: Rs. 0');
  doc.moveDown(1);

  // Section 1: Room Rent Table Keyed by Sum Insured
  doc.fontSize(12).fillColor('#0b4f6c').text('SECTION 1: HOSPITALIZATION & ROOM RENT ELIGIBILITY', { underline: true });
  doc.fontSize(10).fillColor('#000000');
  doc.moveDown(0.5);
  doc.text('Room rent, boarding and nursing expenses are subject to the following limits keyed by Sum Insured:');
  doc.moveDown(0.3);
  doc.text('• Sum Insured up to Rs. 3,00,000: Room rent up to Rs.3,000 per day');
  doc.text('• Sum Insured Rs. 4,00,000 to Rs. 5,00,000: Room rent up to Rs.5,000 per day');
  doc.text('• Sum Insured Rs. 10,00,000 and above: Single Standard A/C Room');
  doc.moveDown(0.5);
  doc.text('ICU Charges: ICU charges up to 2% of sum insured per day.');
  doc.moveDown(1);

  // Section 2: Proportionate Deduction Clause
  doc.fontSize(12).fillColor('#0b4f6c').text('SECTION 2: PROPORTIONATE DEDUCTION CLAUSE', { underline: true });
  doc.fontSize(10).fillColor('#000000');
  doc.moveDown(0.5);
  doc.text('Associated medical expenses (including nursing charges, surgeon/specialist fees, operation theatre and anesthesia charges) shall be paid in proportion to the eligible room rent limit if the insured occupies a room category costing higher than their eligible room rent per day.');
  doc.moveDown(1);

  // Section 3: Co-pay and Conditions
  doc.fontSize(12).fillColor('#0b4f6c').text('SECTION 3: CO-PAYMENT SCHEDULE', { underline: true });
  doc.fontSize(10).fillColor('#000000');
  doc.moveDown(0.5);
  doc.text('• Base Co-pay: A co-payment of 10% applies to each and every admissible claim under the policy.');
  doc.text('• Non-Network Co-pay: For non-network hospitalizations, a co-payment of 20% shall apply.');
  doc.text('• Age-based Co-pay: 20% co-payment for insured persons aged above 60 at the time of claim.');
  doc.text('• Zone Upgrade Co-pay: 15% co-pay for hospitalization in Zone A when policy is registered in Zone B.');
  doc.moveDown(1);

  // Section 4: Specific Sub-limits & Waiting Periods
  doc.fontSize(12).fillColor('#0b4f6c').text('SECTION 4: SUB-LIMITS & WAITING PERIODS', { underline: true });
  doc.fontSize(10).fillColor('#000000');
  doc.moveDown(0.5);
  doc.text('• Procedure Sub-Limits: Knee Replacement is capped at Rs.1,50,000 per hospitalization.');
  doc.text('• Initial Waiting Period: 30 days from policy commencement.');
  doc.text('• Pre-Existing Diseases: 3 years continuous coverage required.');
  doc.text('• Specified Procedures (including Joint Replacement): 2 years waiting period.');
  doc.text('• Maternity Waiting Period: 9 months.');
  doc.text('• Pre-hospitalization: 30 days | Post-hospitalization: 60 days | Daycare: Covered | Ambulance: Rs. 2,000');
  doc.text('• Pre-authorization requirement: 48 hours for planned hospitalization; Claim intimation: 24 hours for emergency.');
  doc.text('• Exclusions: cosmetic surgery, dental treatments (except due to accidental injury).');
  doc.moveDown(1);

  doc.fontSize(8).fillColor('#888888').text('This policy document is issued by Star Health and Allied Insurance Co. Ltd. under IRDAI registration no. 129.', { align: 'center' });

  doc.end();
  console.log(`[GeneratePDF] Generated ${filePath}`);
}

function createHdfcCorporatePdf() {
  const filePath = path.join(outputDir, 'hdfc_ergo_corporate.pdf');
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).fillColor('#003366').text('HDFC ERGO GENERAL INSURANCE COMPANY LIMITED', { align: 'center' });
  doc.fontSize(11).fillColor('#666666').text('Corporate Office: 165-166, Backbay Reclamation, H.T. Parekh Marg, Churchgate, Mumbai - 400020', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(15).fillColor('#2E7D5B').text('CERTIFICATE OF INSURANCE — CORPORATE GROUP HEALTH SHIELD', { align: 'center', underline: true });
  doc.moveDown(1);

  doc.fillColor('#000000').fontSize(10);
  doc.text('Policy Number: HDFC/GRP/2026/98214');
  doc.text('UIN: HDFHLGP21422V022021 | Employer / Group Holder: TechSolutions Global Pvt Ltd');
  doc.text('Primary Insured: Amit Verma (Age: 34) | Dependent: Pooja Verma (Age: 32, Relation: Spouse)');
  doc.text('Floater Sum Insured: Rs. 5,00,000 (Rupees Five Lakhs)');
  doc.text('Zone: Zone A | TPA: Vidal Health TPA');
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#003366').text('POLICY TERMS & CONDITIONS', { underline: true });
  doc.fontSize(10).fillColor('#000000');
  doc.moveDown(0.5);
  doc.text('1. Room Rent Limit: Room rent eligibility is 1% of Sum Insured per day. No separate ICU capping.');
  doc.text('2. Proportionate Deduction: Associated medical expenses shall be subject to proportionate deduction if room rent exceeds 1% of Sum Insured.');
  doc.text('3. Co-payment: Nil co-payment across all network hospitals.');
  doc.text('4. Deductible: Rs. 0.');
  doc.text('5. Restoration of Sum Insured: 100% restoration benefit available automatically upon complete exhaustion.');
  doc.text('6. Waiting Periods: Initial waiting period waived (0 days); Pre-existing diseases covered from day 1 (0 days); Maternity waiting period: 9 months.');
  doc.text('7. Pre-hospitalization: 30 days | Post-hospitalization: 60 days | Daycare: Covered | Ambulance: Rs. 2,500');
  doc.text('8. Network: all-network cashless access.');
  doc.moveDown(1);

  doc.fontSize(8).fillColor('#888888').text('HDFC ERGO General Insurance Company Limited. IRDAI Reg No. 146.', { align: 'center' });
  doc.end();
  console.log(`[GeneratePDF] Generated ${filePath}`);
}

function createPmjayPdf() {
  const filePath = path.join(outputDir, 'pmjay_ayushman_bharat.pdf');
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).fillColor('#b71c1c').text('GOVERNMENT OF INDIA — NATIONAL HEALTH AUTHORITY', { align: 'center' });
  doc.fontSize(11).fillColor('#666666').text('Ministry of Health and Family Welfare | Ayushman Bharat - PMJAY', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(15).fillColor('#2E7D5B').text('PRADHAN MANTRI JAN AROGYA YOJANA (AB-PMJAY) BENEFICIARY COVER', { align: 'center', underline: true });
  doc.moveDown(1);

  doc.fillColor('#000000').fontSize(10);
  doc.text('Beneficiary Registration ID: AB-PMJAY-2026-KA-0941');
  doc.text('Scheme Identifier: GOI-PMJAY-SCHEME-01');
  doc.text('Primary Beneficiary: K. Gowda (Age: 48, Head of Family)');
  doc.text('Coverage Level: Secondary & Tertiary Care Floater');
  doc.text('Annual Scheme Entitlement: Rs. 5,00,000 per family per year');
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#b71c1c').text('SCHEME BENEFIT GUIDELINES', { underline: true });
  doc.fontSize(10).fillColor('#000000');
  doc.moveDown(0.5);
  doc.text('1. Cashless Healthcare: 100% cashless service at all empanelled public and private hospitals (restricted-network).');
  doc.text('2. Room & Bed Charges: Standard hospitalization charges and package rates apply without room rent ceilings.');
  doc.text('3. ICU Charges: Fully included in pre-fixed surgical and medical package rates; no capping.');
  doc.text('4. Co-pay & Deductibles: 0% co-pay, 0% non-network co-pay, zero deductible.');
  doc.text('5. Proportionate Deduction: Does not apply. Empanelled hospitals cannot bill beneficiaries.');
  doc.text('6. Waiting Periods: Zero days waiting period. Pre-existing conditions covered from Day 1.');
  doc.text('7. Empanelled Hospitals: Coverage valid at empanelled hospitals only.');
  doc.moveDown(1);

  doc.fontSize(8).fillColor('#888888').text('Ayushman Bharat National Health Protection Mission — Transforming Indian Healthcare.', { align: 'center' });
  doc.end();
  console.log(`[GeneratePDF] Generated ${filePath}`);
}

function createEsiPdf() {
  const filePath = path.join(outputDir, 'esi_scheme.pdf');
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).fillColor('#1b5e20').text('EMPLOYEES STATE INSURANCE CORPORATION', { align: 'center' });
  doc.fontSize(11).fillColor('#666666').text('(Ministry of Labour & Employment, Government of India)', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(15).fillColor('#2E7D5B').text('ESIC STATUTORY MEDICAL BENEFIT RECORD', { align: 'center', underline: true });
  doc.moveDown(1);

  doc.fillColor('#000000').fontSize(10);
  doc.text('Insurance Person (IP) Number: ESI/IP/5210984321');
  doc.text('UIN / Scheme Ref: ESIC-STATUTORY-MED-01');
  doc.text('Insured Employee: M. Sundaram (Age: 39, Relation: Self)');
  doc.text('Branch Office: ESIC Sub-Regional Office, Bangalore');
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#1b5e20').text('STATUTORY MEDICAL BENEFIT ENTITLEMENTS', { underline: true });
  doc.fontSize(10).fillColor('#000000');
  doc.moveDown(0.5);
  doc.text('1. Complete Medical Coverage: Insured persons are entitled to full, comprehensive medical care without financial ceiling (unlimited sum insured).');
  doc.text('2. Hospitalization & Room Charges: Full accommodation provided at ESIC Model Hospitals and authorized tie-up institutions with no room rent cap.');
  doc.text('3. ICU and Special Care: Free and cashless ICU, OT, diagnostic, and specialty medical procedures.');
  doc.text('4. Co-pay & Deductible: Zero co-pay (0%) and zero deductible. Entirely cashless.');
  doc.text('5. Proportionate Deduction: None. Statutory rules prohibit proportionate deductions.');
  doc.text('6. Network Access: Restricted-network; valid at ESIC hospitals, dispensaries, and authorized tie-up network hospitals.');
  doc.moveDown(1);

  doc.fontSize(8).fillColor('#888888').text('Statutory benefit under Section 56-59 of The Employees State Insurance Act, 1948.', { align: 'center' });
  doc.end();
  console.log(`[GeneratePDF] Generated ${filePath}`);
}

createStarHealthPdf();
createHdfcCorporatePdf();
createPmjayPdf();
createEsiPdf();
console.log('All 4 mock policy PDFs successfully generated in mock-policies/');
