import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { cleanRawJsonText, normalizeExtractionPayload } from './normalizerService.js';
import { ExtractedPolicyZod } from '../schemas/policySchema.js';
import { extractTextFromPdf } from './pdfService.js';

export const EXTRACTION_PROMPT = `You extract structured terms from Indian health insurance policy documents.

Return ONLY a JSON object matching the schema below. No markdown, no code fences,
no commentary.

RULES
1. Fill a field ONLY if it is explicitly stated in the document. If it is not
   stated, set it to null. Never guess, never infer from typical market values.
2. For every field you fill, add an entry to sourceSnippets with the exact
   sentence or table row (max 20 words) that you took it from.
3. For every field you fill, add an entry to confidence with one of:
   "high"   - stated explicitly and unambiguously
   "medium" - stated but needs interpretation (e.g. a table row you had to match)
   "low"    - implied or ambiguous
4. Room rent and ICU limits are often given as a table keyed by sum insured.
   Find the row matching THIS policy's sum insured and use that row only.
   - "Rs.3,000 per day"        -> {"type":"amount","value":3000}
   - "1% of sum insured"       -> {"type":"percent","value":1}
   - "Single Standard A/C Room"-> {"type":"category","value":"Single Standard A/C Room"}
   - no limit mentioned        -> {"type":"none","value":null}
5. Co-pay: put the base co-pay percentage in "copay". If the document states a
   different co-pay for non-network hospitals, put it in "nonNetworkCopay".
   Put conditional co-pays (age-based, zone-based) in copayConditions.
6. "proportionateDeduction": Set to true ONLY if the document explicitly mandates that associated medical expenses, doctor fees, or surgery charges shall be paid in proportion to the eligible room rent limit. If the document states a specific room-sharing rule (e.g. insurer pays 50% of eligible room amount) or uses non-committal/speculative language like "may be subject to" without an active deduction formula across medical fees, set "proportionateDeduction" to false.
7. exclusions: list all clinical departments, medical specialties, or specific procedures that are excluded or not covered under this policy (e.g. cardiology, neurology, orthopedics, oncology, general surgery, gynecology, urology, maternity, dental, cataract, cosmetic, etc.). For standard non-medical/statutory exclusions (like war, criminal acts, self-inflicted injury, alcohol/drug abuse), set "hasOtherExclusions" to true rather than listing them individually.
8. Amounts: return plain integers in rupees. "3 Lakhs" -> 300000. No symbols,
   no commas, no strings.
9. Percentages: plain numbers. "10%" -> 10.
10. Dates: "YYYY-MM-DD".
11. policyType: "private" for retail individual/family plans, "corporate" for
    group or employer plans, "pmjay" for Ayushman Bharat, "esi" for ESI/ESIC.
12. insurerAliases: every longer or legal form of the insurer's name that
    appears in the document.
13. deductible: compulsory deductible amount in rupees. If the policy states Nil,
    None, Zero, or if no deductible is mentioned in the document, set deductible to 0.
    Only set to a positive integer if a specific compulsory deductible is explicitly mandated.

SCHEMA
{
  "insurer": "string or null",
  "insurerAliases": ["string"],
  "planName": "string or null",
  "policyType": "private | corporate | pmjay | esi | null",
  "policyNumber": "string or null",
  "uin": "string or null",
  "policyStartDate": "YYYY-MM-DD or null",
  "policyEndDate": "YYYY-MM-DD or null",
  "zone": "Zone A | Zone B | Zone C | null",
  "networkType": "all-network | restricted-network | reimbursement-only | null",
  "tpa": "string or null",
  "insuredPersons": [{ "name": "string", "age": 0, "relation": "string" }],
  "sumInsured": "number (in rupees) or null",
  "roomLimit": { "type": "amount | percent | category | none", "value": "number or string or null" },
  "icuLimit": { "type": "amount | percent | category | none", "value": "number or string or null" },
  "copay": "number (percentage) or null",
  "nonNetworkCopay": null,
  "copayConditions": { "conditionName": 0 },
  "deductible": 0,
  "proportionateDeduction": null,
  "subLimits": { "procedureName": 0 },
  "restorationBenefit": null,
  "cumulativeBonus": null,
  "exclusions": ["string"],
  "hasOtherExclusions": null,
  "waitingPeriods": {
    "initial": "string or null",
    "preExisting": "string or null",
    "maternity": "string or null",
    "procedures": { "procedureName": "string" }
  },
  "preHospitalizationDays": null,
  "postHospitalizationDays": null,
  "daycareCovered": null,
  "ambulanceLimit": null,
  "preAuthHours": null,
  "claimIntimationHours": null,
  "sourceSnippets": { "fieldName": "exact source snippet" },
  "confidence": { "fieldName": "high | medium | low" }
}`;

export interface ExtractionResult {
  data: Record<string, any>;
  validationError?: string;
  isPartialFallback?: boolean;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private primaryModel = config.geminiModel || 'gemini-3.1-flash-lite';
  private fallbackModel = 'gemini-3.5-flash-lite';

  constructor(apiKey?: string) {
    const key = apiKey || config.geminiApiKey;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
    }
  }

  public setApiKey(key: string) {
    this.genAI = new GoogleGenerativeAI(key);
  }

  private getModel(modelName: string) {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    return this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json', temperature: 0 }
    });
  }

  public async extractPolicy(pdfBuffer: Buffer): Promise<ExtractionResult> {
    if (!this.genAI) {
      const key = config.geminiApiKey || process.env.GEMINI_API_KEY;
      if (key) {
        this.genAI = new GoogleGenerativeAI(key);
      }
    }

    if (!this.genAI) {
      console.warn('[GeminiService] No API key set. Returning blank partial schema.');
      return {
        data: normalizeExtractionPayload({}),
        isPartialFallback: true,
        validationError: 'GEMINI_API_KEY is not set.'
      };
    }

    let extractedText = '';
    try {
      extractedText = await extractTextFromPdf(pdfBuffer);
    } catch (e: any) {
      console.warn('[GeminiService] pdf-parse extraction notice:', e.message);
    }

    const hasText = Boolean(extractedText && extractedText.trim().length > 50);
    const base64Pdf = !hasText ? pdfBuffer.toString('base64') : '';

    const runCall = async (modelName: string, promptText: string): Promise<string> => {
      const model = this.getModel(modelName);
      const parts = hasText
        ? [{ text: `Document content:\n${extractedText.trim()}\n\n${promptText}` }]
        : [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: promptText }];

      let lastError: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await model.generateContent(parts);
          return result.response.text();
        } catch (err: any) {
          lastError = err;
          const isTransient = /503|429|demand|temporar|timeout|econnreset|hang up/i.test(err.message || '');
          if (isTransient && attempt < 3) {
            const delay = attempt * 1500;
            console.warn(`[GeminiService] ${modelName} transient error (attempt ${attempt}/3): ${err.message}. Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    };

    let rawOutput = '';
    try {
      rawOutput = await runCall(this.primaryModel, EXTRACTION_PROMPT);
    } catch (err: any) {
      console.warn(`[GeminiService] Primary model ${this.primaryModel} failed: ${err.message}. Trying fallback ${this.fallbackModel}...`);
      try {
        rawOutput = await runCall(this.fallbackModel, EXTRACTION_PROMPT);
      } catch (fallbackErr: any) {
        console.error('[GeminiService] Fallback model also failed:', fallbackErr.message);
        return {
          data: normalizeExtractionPayload({}),
          isPartialFallback: true,
          validationError: fallbackErr.message
        };
      }
    }

    // Attempt 1: Parse and validate
    let parsed: any;
    try {
      const cleaned = cleanRawJsonText(rawOutput);
      parsed = JSON.parse(cleaned);
    } catch (parseError: any) {
      console.warn('[GeminiService] JSON parse failed on initial response, retrying once...');
    }

    if (parsed) {
      const normalized = normalizeExtractionPayload(parsed);
      const valResult = ExtractedPolicyZod.safeParse(normalized);
      if (valResult.success) {
        return { data: valResult.data };
      }

      console.warn('[GeminiService] Initial extraction validation failed. Retrying once with error feedback...');
      const errorMsg = valResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');

      try {
        const retryPrompt = `${EXTRACTION_PROMPT}\n\nIMPORTANT: Your previous response failed validation with these errors: ${errorMsg}. Return corrected JSON only.`;
        const retryOutput = await runCall(this.primaryModel, retryPrompt);
        const retryCleaned = cleanRawJsonText(retryOutput);
        const retryParsed = JSON.parse(retryCleaned);
        const retryNorm = normalizeExtractionPayload(retryParsed);
        const retryVal = ExtractedPolicyZod.safeParse(retryNorm);

        if (retryVal.success) {
          return { data: retryVal.data };
        } else {
          return {
            data: retryNorm,
            isPartialFallback: true,
            validationError: retryVal.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          };
        }
      } catch (retryError: any) {
        console.error('[GeminiService] Retry failed:', retryError.message);
        return {
          data: normalized,
          isPartialFallback: true,
          validationError: errorMsg
        };
      }
    }

    // If initial JSON parsing failed completely, retry once
    try {
      const retryPrompt = `${EXTRACTION_PROMPT}\n\nIMPORTANT: Your previous response was not valid JSON. Return valid JSON only with NO markdown fences.`;
      const retryOutput = await runCall(this.primaryModel, retryPrompt);
      const retryCleaned = cleanRawJsonText(retryOutput);
      const retryParsed = JSON.parse(retryCleaned);
      const retryNorm = normalizeExtractionPayload(retryParsed);
      return { data: retryNorm };
    } catch (secondFail: any) {
      return {
        data: normalizeExtractionPayload({}),
        isPartialFallback: true,
        validationError: 'Could not parse structured JSON from document.'
      };
    }
  }
}

export const geminiService = new GeminiService();
