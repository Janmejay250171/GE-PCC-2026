/**
 * Care Journey Advisor
 * Generates dynamic, context-aware guidance and financial trade-offs
 * across the 4 stages of a hospital care journey.
 *
 * Implements strict provenance classification:
 * - 'Policy-derived': Directly established from uploaded policy document fields
 * - 'Reference guidance': Industry standard advisory / reference timelines
 * - 'Modelled estimate': Synthetic reference cost / non-medical assumptions
 * - 'System assumption': Operational fallback assumptions
 *
 * Guarantees are strictly removed; all authorization and coverage statements are conditional.
 */

export function getCareJourneyPlan({ policy, hospital, procedure, roomType }) {
  const sumInsured = policy?.sumInsured;
  const copayPercent = policy?.copay;
  const roomLimit = policy?.roomLimit;
  const insurerName = policy?.insurer || 'Your Insurer';

  // Room limit calculation
  let roomLimitDaily = 0;
  let roomLimitLabel = null;
  let isRoomLimitPolicyDerived = false;

  if (roomLimit) {
    isRoomLimitPolicyDerived = true;
    if (roomLimit.type === 'amount') {
      roomLimitDaily = Number(roomLimit.value) || 0;
      roomLimitLabel = `₹${roomLimitDaily.toLocaleString('en-IN')}/day`;
    } else if (roomLimit.type === 'percent') {
      const pct = Number(roomLimit.value) || 0;
      if (sumInsured) {
        roomLimitDaily = Math.round((sumInsured * pct) / 100);
        roomLimitLabel = `${pct}% of SUM INSURED(SI) (₹${roomLimitDaily.toLocaleString('en-IN')}/day)`;
      } else {
        roomLimitLabel = `${pct}% of Sum Insured`;
      }
    } else if (roomLimit.type === 'none') {
      roomLimitLabel = 'No Sub-Limit per Policy';
    } else if (roomLimit.type === 'category') {
      roomLimitLabel = String(roomLimit.value || 'Specified Room Category');
    }
  }

  const selectedRoomName = roomType || 'General Ward';
  const isPrivateSelected = selectedRoomName.toLowerCase().includes('single') || selectedRoomName.toLowerCase().includes('private');

  const hospitalName = hospital?.hospital_name || 'Medical Center';
  const networkStatus = hospital?.networkInfo?.networkStatus || 'unknown';
  const isVerified = networkStatus === 'verified';
  const isNoMatch = networkStatus === 'no_match';

  return [
    {
      id: 'admission',
      stageNumber: 1,
      title: 'Admission & Cashless Desk',
      subtitle: 'Pre-Admission • Pre-authorization & Room Allotment',
      badge: 'Pre-Admission',
      duration: 'Day 0 to Day 1',
      summary: 'Seek initial cashless pre-authorization and choose an eligible room category to prevent proportionate deduction disallowances.',
      expectedCoverage: [
        {
          label: 'Pre-Authorization Target',
          value: policy?.preAuthHours != null
            ? `${policy.preAuthHours} Hours Prior`
            : 'Not established from uploaded policy',
          detail: policy?.preAuthHours != null
            ? `Policy document specifies pre-authorization submission ${policy.preAuthHours} hours prior to scheduled admission.`
            : 'Reference guidance: TPAs typically request 24–48 hours advance notice for scheduled admissions.',
          provenance: policy?.preAuthHours != null ? 'Policy-derived' : 'Reference guidance'
        },
        {
          label: 'Eligible Room Rent Limit',
          value: roomLimitLabel || 'Not established from uploaded policy',
          detail: isRoomLimitPolicyDerived
            ? roomLimitDaily > 0
              ? `Your policy establishes a room limit of ${roomLimitLabel}. Exceeding this may trigger proportionate billing disallowances.`
              : `Your policy room limit rule is: ${roomLimitLabel}.`
            : 'Reference guidance: Review policy schedule for daily room sub-limits (commonly 1% of Sum Insured or Single Private Room).',
          provenance: isRoomLimitPolicyDerived ? 'Policy-derived' : 'Reference guidance'
        },
        {
          label: 'Cashless Desk Network',
          value: isVerified
            ? 'Verified Network Partner'
            : isNoMatch
              ? 'Non-Network / Reimbursement'
              : 'Network Unverified',
          detail: isVerified
            ? `Verified network empanelment with ${insurerName} at ${hospitalName}. Initial pre-authorization is subject to TPA and hospital evaluation.`
            : `Cashless facility is not verified for ${insurerName}. You may need to pay upfront and file for reimbursement per policy terms.`,
          provenance: 'Reference guidance'
        }
      ],
      alternatives: [
        {
          title: 'Room Category Selection Impact',
          type: isPrivateSelected && roomLimitDaily > 0 ? 'warning' : 'recommendation',
          highlight: isPrivateSelected && roomLimitDaily > 0
            ? 'Warning: Single Private Room may breach your limit'
            : 'Room category selection guidance',
          explanation: isPrivateSelected && roomLimitDaily > 0
            ? `If Single Private Room exceeds your limit of ${roomLimitLabel}, the insurer may apply proportionate deductions across doctor fees, OT charges, and nursing costs.`
            : roomLimitLabel
              ? `Choosing a room category that adheres to your policy limit (${roomLimitLabel}) helps prevent proportionate billing disallowances.`
              : 'Verify room rent caps in your policy schedule prior to admission to prevent proportionate disallowances.',
          provenance: isRoomLimitPolicyDerived ? 'Policy-derived' : 'Reference guidance'
        },
        {
          title: 'Emergency vs Planned Admission',
          type: 'info',
          highlight: policy?.preAuthHours ? `Planned: ${policy.preAuthHours}h prior • Emergency: within 24h` : 'Planned: Advance notice • Emergency: Prompt intimation',
          explanation: 'Submitting pre-authorization documents in advance may help the hospital and TPA determine the expected cashless authorization before admission. Final authorization is subject to hospital/TPA approval.',
          provenance: 'Reference guidance'
        }
      ],
      checklist: [
        { id: 'c1_2', text: `Verify that chosen room (${selectedRoomName}) adheres to your policy limit (${roomLimitLabel || 'Check Policy'}).` },
        { id: 'c1_3', text: 'Carry original Government Photo ID (Aadhaar / Voter ID) and Policy Schedule PDF.' },
        { id: 'c1_4', text: 'Ensure treating doctor fills diagnosis and estimated cost on the initial pre-auth request.' }
      ]
    },
    {
      id: 'investigation',
      stageNumber: 2,
      title: 'Diagnostics & Clinical Labs',
      subtitle: 'In-Hospital Tests • Radiology & Pathology Scans',
      badge: 'Diagnostics',
      duration: 'Day 1',
      summary: 'Track pre-admission diagnostic tests and verify that all in-hospital tests correlate with the primary admitted diagnosis.',
      expectedCoverage: [
        {
          label: 'Pre-Hospitalization Window',
          value: policy?.preHospitalizationDays != null
            ? `${policy.preHospitalizationDays} Days`
            : 'Not established from uploaded policy',
          detail: policy?.preHospitalizationDays != null
            ? `Policy document specifies a ${policy.preHospitalizationDays}-day pre-hospitalization window for admissible diagnostic tests.`
            : 'Reference guidance: Indian health policies commonly cover 30 to 60 days of pre-admission testing subject to policy terms.',
          provenance: policy?.preHospitalizationDays != null ? 'Policy-derived' : 'Reference guidance'
        },
        {
          label: 'In-Patient Diagnostics',
          value: 'Subject to Policy Terms',
          detail: 'Prescribed investigations pertinent to the primary admitted diagnosis are typically admissible subject to policy limits.',
          provenance: 'Reference guidance'
        },
        {
          label: 'Non-Medical Consumables Allowance',
          value: '≈ 5% Modelled Allowance',
          detail: 'Reference estimate for non-medical consumables (syringes, gloves, sanitizer) that are commonly excluded from claim settlement.',
          provenance: 'Modelled estimate'
        }
      ],
      alternatives: [
        {
          title: 'External NABL Lab Reports vs In-House Scans',
          type: 'recommendation',
          highlight: 'Cost consideration for pre-admission scans',
          explanation: 'Diagnostic scans done at accredited outside diagnostic centers before admission often cost less than hospital in-house rates, and may be claimed under pre-hospitalization cover if prescribed by your treating doctor.',
          provenance: 'Reference guidance'
        },
        {
          title: 'Routine Health Check Tests',
          type: 'warning',
          highlight: 'Unrelated tests may be disallowed by insurers',
          explanation: 'Only investigations directly pertinent to the primary admitting diagnosis are typically admissible. Disallowances may occur if general health check panels are bundled without clinical indication.',
          provenance: 'Reference guidance'
        }
      ],
      checklist: [
        { id: 'c2_1', text: 'Ensure every blood test, X-ray, or CT scan has a signed doctor prescription note.' },
        { id: 'c2_2', text: 'Preserve physical and digital copies of all lab reports with diagnostic values.' },
        { id: 'c2_3', text: 'Keep original payment receipts and doctor referral slips for all pre-admission tests.' }
      ]
    },
    {
      id: 'procedure',
      stageNumber: 3,
      title: 'Procedure, Surgery & OT Stay',
      subtitle: 'Surgery, Anaesthesia, OT, & Intensive Care',
      badge: 'Active Treatment',
      duration: 'Day 2 to Day 3',
      summary: 'Review procedure pricing, surgeon charges, implant cappings, and applicable co-payment rules.',
      expectedCoverage: [
        {
          label: 'Surgeon & OT Charges',
          value: sumInsured != null
            ? `Covered up to SI (₹${Number(sumInsured).toLocaleString('en-IN')})`
            : 'Not established from uploaded policy',
          detail: sumInsured != null
            ? `Operative and anaesthetist fees covered subject to your extracted Sum Insured limit.`
            : 'Reference guidance: Operative fees are covered subject to policy Sum Insured and room-rent sub-limits.',
          provenance: sumInsured != null ? 'Policy-derived' : 'Reference guidance'
        },
        {
          label: 'Base Co-Payment Share',
          value: copayPercent !== null && copayPercent !== undefined
            ? `${copayPercent}% Co-Pay`
            : 'Not established from uploaded policy',
          detail: copayPercent !== null && copayPercent !== undefined
            ? `Policy document specifies a ${copayPercent}% patient co-payment on admissible expenses.`
            : 'Reference guidance: Co-payment rules vary by insurer, age band, and network tier; review policy schedule.',
          provenance: copayPercent !== null && copayPercent !== undefined ? 'Policy-derived' : 'Reference guidance'
        },
        {
          label: 'Day-Care Surgery Eligibility',
          value: policy?.daycareCovered === true
            ? 'Covered per Policy'
            : policy?.daycareCovered === false
              ? 'Excluded per Policy'
              : 'Not established from uploaded policy',
          detail: policy?.daycareCovered === true
            ? 'Policy document explicitly confirms coverage for daycare procedures without mandatory 24-hour stay.'
            : policy?.daycareCovered === false
              ? 'Policy document indicates daycare procedures without 24h stay are excluded.'
              : 'Reference guidance: Many health policies cover listed day-care procedures; verify your specific policy terms.',
          provenance: policy?.daycareCovered !== null && policy?.daycareCovered !== undefined ? 'Policy-derived' : 'Reference guidance'
        }
      ],
      alternatives: [
        {
          title: 'Day-Care Treatment vs 24-Hour Stay',
          type: 'recommendation',
          highlight: 'Evaluate same-day discharge if eligible',
          explanation: 'For modern minimally invasive or day-care procedures, check if same-day discharge is clinically suitable and covered under your policy terms, which may help avoid inpatient room rent deductions.',
          provenance: 'Reference guidance'
        },
        {
          title: 'Implants & Medical Consumables Pricing',
          type: 'info',
          highlight: 'NPPA Reference Price Cappings',
          explanation: 'Cardiac stents, orthopedic knee implants, and intraocular lenses are subject to government price caps. Ask the hospital billing coordinator for standard in-formulary implants to avoid out-of-pocket variance.',
          provenance: 'Reference guidance'
        }
      ],
      checklist: [
        { id: 'c3_1', text: 'Ask treating surgeon whether the procedure qualifies for Daycare settlement under policy rules.' },
        { id: 'c3_2', text: 'Verify batch number and sticker for any implant placed in the patient medical record.' },
        { id: 'c3_3', text: 'Request an interim ledger from hospital billing counter to monitor ongoing accruals.' }
      ]
    },
    {
      id: 'recovery',
      stageNumber: 4,
      title: 'Discharge, Settlement & Post-Care',
      subtitle: 'Discharge & Post-Discharge • Final Cashless Approval & Medicine Claims',
      badge: 'Discharge & Recovery',
      duration: 'Day 3 to Day 60',
      summary: 'Navigate the TPA final settlement process and claim post-hospitalization recovery medicines.',
      expectedCoverage: [
        {
          label: 'Final Cashless Approval',
          value: 'TPA Settlement Review',
          detail: 'Hospital billing desk submits final summary; final cashless approval amount is determined by insurer/TPA audit.',
          provenance: 'Reference guidance'
        },
        {
          label: 'Post-Hospitalization Window',
          value: policy?.postHospitalizationDays != null
            ? `${policy.postHospitalizationDays} Days`
            : 'Not established from uploaded policy',
          detail: policy?.postHospitalizationDays != null
            ? `Policy document specifies a ${policy.postHospitalizationDays}-day window for post-hospitalization claims.`
            : 'Reference guidance: Policies typically allow 60 to 90 days for post-discharge medication and diagnostic claims.',
          provenance: policy?.postHospitalizationDays != null ? 'Policy-derived' : 'Reference guidance'
        },
        {
          label: 'Non-Medical Deductions',
          value: '≈ 5% Modelled Allowance',
          detail: 'Modelled reference assumption for non-admissible hospital administrative and consumable charges.',
          provenance: 'Modelled estimate'
        }
      ],
      alternatives: [
        {
          title: 'Managing the Discharge Buffer',
          type: 'info',
          highlight: 'Plan 3–5 hours for TPA final clearance',
          explanation: 'After your doctor approves discharge, the hospital billing desk compiles pharmacy ledgers and submits the final summary to the insurance TPA. TPA review typically takes 3 to 5 hours. Plan your transportation accordingly.',
          provenance: 'Reference guidance'
        },
        {
          title: 'Submitting Post-Hospitalization Claims',
          type: 'recommendation',
          highlight: 'Retain prescriptions and original receipts',
          explanation: 'Retain every prescription and stamped payment receipt for recovery medicines. Submit them as a consolidated reimbursement claim within your policy claim window.',
          provenance: 'Reference guidance'
        }
      ],
      checklist: [
        { id: 'c4_1', text: 'Obtain signed, stamped original Discharge Summary before leaving the hospital.' },
        { id: 'c4_2', text: 'Collect consolidated itemized hospital bill with breakup of pharmacy and OT charges.' },
        { id: 'c4_3', text: 'Collect indoor case record summary and implant warranty stickers (if applicable).' },
        { id: 'c4_4', text: 'Submit post-hospitalization bills within the stipulated claim submission window.' }
      ]
    }
  ];
}
