/**
 * Client-Side Journey Guidance Engine
 * Evaluates care journey events against policy limits, room caps, and network status.
 * Produces deterministic insurance-aware guidance, alerts, and "Why am I seeing this?" policy breakdowns.
 */

export function evaluateClientJourneyEvent({
  event,
  policy,
  hospital,
  procedure = 'General Consultation',
  roomType = 'General Ward',
  isEmergency = false
}) {
  const eventType = event.eventType || 'ADMISSION_COMPLETED';
  const timestamp = event.timestamp || new Date().toISOString();
  const patientId = event.patientId || 'patient_pcc_demo';
  const metadata = event.metadata || {};

  const hospitalName = hospital?.hospital_name || 'Medical Center';
  const networkStatus = hospital?.networkInfo?.networkStatus || 'unknown';
  const isNetworkMatch = networkStatus === 'verified';

  // Room limits
  const currentRoom = metadata.newRoom || roomType || 'General Ward';
  const roomLimit = policy?.roomLimit;
  const sumInsured = policy?.sumInsured || 0;

  let roomLimitDaily = 999999;
  let roomLimitLabel = 'No Capping (Unlimited)';
  let isRoomLimitPolicyDerived = false;

  if (roomLimit) {
    isRoomLimitPolicyDerived = true;
    if (roomLimit.type === 'amount' && roomLimit.value) {
      roomLimitDaily = Number(roomLimit.value);
      roomLimitLabel = `₹${roomLimitDaily.toLocaleString('en-IN')}/day`;
    } else if (roomLimit.type === 'percent' && roomLimit.value) {
      const pct = Number(roomLimit.value);
      if (sumInsured > 0) {
        roomLimitDaily = Math.round((sumInsured * pct) / 100);
        roomLimitLabel = `${pct}% of SI (₹${roomLimitDaily.toLocaleString('en-IN')}/day)`;
      } else {
        roomLimitLabel = `${pct}% of Sum Insured`;
      }
    } else if (roomLimit.type === 'category' && roomLimit.value) {
      roomLimitLabel = String(roomLimit.value);
      if (roomLimitLabel.toLowerCase().includes('general')) roomLimitDaily = 3000;
      else if (roomLimitLabel.toLowerCase().includes('twin')) roomLimitDaily = 5000;
    }
  }

  // Room rate evaluation
  let roomRate = metadata.newRate;
  if (!roomRate) {
    if (hospital?.estimate?.roomCostPerDay) {
      roomRate = hospital.estimate.roomCostPerDay;
    } else if (currentRoom.toLowerCase().includes('private') || currentRoom.toLowerCase().includes('single')) {
      roomRate = 10000;
    } else if (currentRoom.toLowerCase().includes('twin')) {
      roomRate = 5000;
    } else {
      roomRate = 3000;
    }
  }

  const roomRentExcessPerDay = Math.max(0, roomRate - roomLimitDaily);
  const hasRoomExcess = roomRentExcessPerDay > 0;
  const proportionateDeductionActive = Boolean(policy?.proportionateDeduction && hasRoomExcess);

  // Financial Estimates
  const stayDays = Math.max(1, Math.round(hospital?.estimate?.estimatedStayDays || 2));
  const roomCharges = roomRate * stayDays;
  const procedureCharges = hospital?.estimate?.treatmentCost || 40000;
  const doctorFees = Math.round(procedureCharges * 0.20);
  const medicineCharges = Math.round(procedureCharges * 0.10);
  const estimatedBill = roomCharges + procedureCharges + doctorFees + medicineCharges;

  const totalRoomRentExcess = roomRentExcessPerDay * stayDays;
  let proportionateDisallowance = 0;
  if (proportionateDeductionActive && roomRate > 0) {
    const allowedRatio = Math.min(1, roomLimitDaily / roomRate);
    const associateMedicalExpenses = procedureCharges + doctorFees;
    proportionateDisallowance = Math.round(associateMedicalExpenses * (1 - allowedRatio));
  }

  const eligibleAmount = Math.max(0, estimatedBill - totalRoomRentExcess - proportionateDisallowance);
  const deductibleApplied = typeof policy?.deductible === 'number' && policy.deductible > 0
    ? Math.min(eligibleAmount, policy.deductible)
    : 0;

  const remainingAfterDeductible = Math.max(0, eligibleAmount - deductibleApplied);
  const copayPct = isNetworkMatch ? (policy?.copay || 0) : (policy?.nonNetworkCopay ?? policy?.copay ?? 0);
  const copayAmount = Math.round(remainingAfterDeductible * (copayPct / 100));

  const remainingClaim = Math.max(0, remainingAfterDeductible - copayAmount);
  const excessOverSumInsured = sumInsured > 0 ? Math.max(0, remainingClaim - sumInsured) : 0;

  const insurerEstimatedShare = Math.max(0, remainingClaim - excessOverSumInsured);
  const patientPayable = Math.max(0, estimatedBill - insurerEstimatedShare);

  const updatedFinancialSnapshot = {
    estimatedBill,
    roomCharges,
    roomRatePerDay: roomRate,
    procedureCharges,
    doctorFees,
    medicineCharges,
    roomRentExcess: totalRoomRentExcess,
    proportionateDisallowance,
    deductibleApplied: policy?.deductible !== null && policy?.deductible !== undefined ? deductibleApplied : null,
    copayAmount,
    excessOverSumInsured,
    patientPayable,
    insurerEstimatedShare,
    sumInsuredRemaining: sumInsured > 0 ? Math.max(0, sumInsured - insurerEstimatedShare) : undefined,
    provenance: 'MODELLED ESTIMATE'
  };

  let stage = 'ADMISSION';
  let severity = 'INFO';
  let requiresAction = false;
  let title = '';
  let summary = '';
  const implications = [];
  const recommendedActions = [];
  let whyExplanation = null;
  let alert = null;
  const provenance = 'SIMULATED DEMO EVENT';

  if (isEmergency || event.isEmergency) {
    implications.push('EMERGENCY CARE PRINCIPLE: Immediate clinical stabilization supersedes financial optimization.');
    recommendedActions.push('Proceed with immediate emergency admission. Present insurance card to hospital cashless desk within 24 hours of admission.');
  }

  switch (eventType) {
    case 'ADMISSION_COMPLETED': {
      stage = 'ADMISSION';
      if (isEmergency) {
        severity = 'INFO';
        title = 'Emergency Admission Initiated';
        summary = 'Patient admitted under emergency protocol. Cashless intimation window: within 24 hours.';
        implications.push('Insurance verification should not delay immediate medical attention.');
        recommendedActions.push('Intimate insurer/TPA within 24 hours with emergency admission slip.');
      } else if (isNetworkMatch) {
        severity = 'INFO';
        title = 'Admission Verified Against Dataset';
        summary = `${hospitalName} matched network dataset for ${policy?.insurer || 'your insurer'}. Cashless desk initiated.`;
        implications.push('Cashless admission is feasible through hospital TPA desk subject to TPA approval.');
        recommendedActions.push('Carry original government ID and policy card to cashless desk.');
      } else {
        severity = 'ATTENTION';
        title = 'No Verified Network Match in Reference Dataset';
        summary = `${hospitalName} is not listed in reference dataset as network facility for ${policy?.insurer || 'your insurer'}.`;
        implications.push('Cashless facility may be unavailable. Upfront payment and subsequent reimbursement may apply.');
        recommendedActions.push('Check with hospital billing desk if cashless tie-up exists, or prepare for reimbursement submission.');
      }

      whyExplanation = {
        title: 'Admission Network & Coverage Eligibility',
        policyRule: `Insurer: ${policy?.insurer || 'Unspecified'} • Policy Type: ${policy?.policyType || 'Private'}`,
        policyValue: `Pre-Auth Window: ${policy?.preAuthHours != null ? `${policy.preAuthHours}h prior` : 'Standard 24-48h'}`,
        patientValue: `Hospital: ${hospitalName} (${networkStatus.toUpperCase()})`,
        consequence: isNetworkMatch
          ? 'Cashless desk can process pre-authorization directly.'
          : 'Reimbursement protocol applies if hospital does not have an active cashless desk for this insurer.',
        suggestedAction: 'Verify empanelment desk before formal room allotment.'
      };
      break;
    }

    case 'PREAUTH_REQUESTED': {
      stage = 'ADMISSION';
      severity = 'INFO';
      title = 'Pre-Authorization Submitted to TPA';
      summary = 'Initial cashless request transmitted to Third-Party Administrator.';
      implications.push('TPA typically reviews planned admissions within 2 to 6 hours.');
      recommendedActions.push('Obtain TPA cashless pre-auth docket tracking number from hospital desk.');

      whyExplanation = {
        title: 'Cashless Pre-Authorization Submission',
        policyRule: 'Pre-admission cashless approval required by insurer.',
        policyValue: `Pre-auth window: ${policy?.preAuthHours || 24} hours`,
        patientValue: `Initial estimate: ₹${estimatedBill.toLocaleString('en-IN')}`,
        consequence: 'Admission proceeds on cashless basis once authorization letter is received.',
        suggestedAction: 'Wait for TPA initial confirmation before settling admission deposit.'
      };
      break;
    }

    case 'PREAUTH_PENDING': {
      stage = 'ADMISSION';
      severity = 'ATTENTION';
      title = 'Pre-Authorization Awaiting TPA Decision';
      summary = 'Your hospital admission is currently awaiting authorization from insurer/TPA.';
      implications.push('This is informational only. Final authorization remains with the insurer/TPA.');
      recommendedActions.push('Hospital may request a temporary refundable security deposit pending authorization.');

      whyExplanation = {
        title: 'Pending TPA Cashless Evaluation',
        policyRule: 'IRDAI mandates timely initial pre-auth response within 1 hour of complete file submission.',
        policyValue: 'TPA Queue Review',
        patientValue: 'Status: PENDING',
        consequence: 'Hospital may pause room assignment until provisional authorization is logged.',
        suggestedAction: 'Request hospital insurance coordinator to escalate with TPA desk if pending > 3 hours.'
      };

      alert = {
        id: `alert_${Date.now()}`,
        eventId: event.id || `evt_${Date.now()}`,
        stage,
        severity,
        title,
        message: summary,
        whyExplanation,
        actionable: 'Contact hospital TPA desk to confirm all requested diagnostic records were transmitted.',
        provenance: 'SIMULATED DEMO EVENT',
        timestamp,
        resolved: false
      };
      break;
    }

    case 'PREAUTH_APPROVED': {
      stage = 'ADMISSION';
      severity = 'INFO';
      title = 'Cashless Pre-Authorization Approved';
      summary = `Provisional cashless approval confirmed by simulated TPA feed for ₹${(metadata.approvedAmount || insurerEstimatedShare).toLocaleString('en-IN')}.`;
      implications.push('Hospital will not demand cash deposits for approved medical expenses.');
      recommendedActions.push('Ensure room selection adheres to approved room category to prevent disallowances.');

      whyExplanation = {
        title: 'Pre-Authorization Approval',
        policyRule: 'Sum Insured limit and initial eligibility confirmed.',
        policyValue: `SI: ₹${sumInsured.toLocaleString('en-IN')}`,
        patientValue: `Approved Amount: ₹${(metadata.approvedAmount || insurerEstimatedShare).toLocaleString('en-IN')}`,
        consequence: 'Admission desk confirms cashless billing track.',
        suggestedAction: 'Collect copy of pre-authorization sanction letter from hospital TPA desk.'
      };
      break;
    }

    case 'PREAUTH_REJECTED': {
      stage = 'ADMISSION';
      severity = 'CRITICAL';
      requiresAction = true;
      title = 'Cashless Pre-Authorization Declined by TPA';
      summary = 'Simulated TPA feed rejected initial cashless request. Cashless facility unavailable for this admission.';
      implications.push('Rejection of cashless does NOT mean denial of insurance coverage.');
      implications.push('You must pay hospital bills directly and submit an itemized reimbursement claim post-discharge.');
      recommendedActions.push('Ask treating doctor for an explicit clinical letter detailing the medical necessity to file for post-discharge reimbursement.');

      whyExplanation = {
        title: 'Why Cashless Was Declined',
        policyRule: 'Cashless requires real-time TPA empanelment and immediate policy schedule verification.',
        policyValue: `Policy: ${policy?.insurer || 'Your Insurer'}`,
        patientValue: 'Cashless Request: REJECTED',
        consequence: 'All hospital bills must be settled out-of-pocket at discharge. File reimbursement within policy time limits.',
        suggestedAction: 'Preserve every stamped bill, doctor prescription, and diagnostic report for post-discharge reimbursement.'
      };

      alert = {
        id: `alert_${Date.now()}`,
        eventId: event.id || `evt_${Date.now()}`,
        stage,
        severity,
        title,
        message: 'Cashless pre-authorization was declined. Admission continues on reimbursement track.',
        whyExplanation,
        actionable: 'Prepare for out-of-pocket settlement and preserve all original discharge records.',
        provenance: 'SIMULATED DEMO EVENT',
        timestamp,
        resolved: false
      };
      break;
    }

    case 'ROOM_ASSIGNED':
    case 'ROOM_CHANGED': {
      stage = 'ADMISSION';
      const newRoom = metadata.newRoom || currentRoom;
      const newRate = metadata.newRate || roomRate;

      if (hasRoomExcess) {
        severity = 'ATTENTION';
        requiresAction = true;
        title = 'Room Category Exceeds Policy Limit';
        summary = `Your selected ${newRoom} (₹${newRate.toLocaleString('en-IN')}/day) exceeds your policy room limit of ${roomLimitLabel}.`;
        implications.push(`Daily room rent excess of ₹${roomRentExcessPerDay.toLocaleString('en-IN')}/day must be borne by patient.`);

        if (proportionateDeductionActive) {
          implications.push(
            `Proportionate Deduction Warning: Associated doctor fees and procedure charges may be reduced proportionately by up to ₹${proportionateDisallowance.toLocaleString('en-IN')}.`
          );
        }
        recommendedActions.push('Consider choosing an eligible room category (General Ward or Twin Sharing) to avoid proportionate deductions.');
        recommendedActions.push('Confirm financial implication with insurer/TPA before proceeding if feasible.');

        whyExplanation = {
          title: 'Why this alert: Room Rent Cap Exceeded',
          policyRule: `Policy Room Rent Clause: ${roomLimitLabel}`,
          policyValue: `Allowed Limit: ₹${roomLimitDaily.toLocaleString('en-IN')}/day`,
          patientValue: `Selected Room (${newRoom}): ₹${newRate.toLocaleString('en-IN')}/day`,
          consequence: proportionateDeductionActive
            ? `Breaching room limit triggers proportionate reduction across doctor fees and surgery costs (estimated ₹${proportionateDisallowance.toLocaleString('en-IN')} out-of-pocket impact).`
            : `Direct room rent excess of ₹${roomRentExcessPerDay.toLocaleString('en-IN')}/day is not reimbursable.`,
          suggestedAction: 'Opt for an eligible room tier to eliminate both the excess and proportionate penalties.'
        };

        alert = {
          id: `alert_${Date.now()}`,
          eventId: event.id || `evt_${Date.now()}`,
          stage,
          severity,
          title: 'Room Rent Exceeds Policy Limit',
          message: `Selected room (₹${newRate.toLocaleString('en-IN')}/day) exceeds policy limit of ${roomLimitLabel}. Proportionate deductions may apply.`,
          whyExplanation,
          actionable: 'Downgrade room tier or confirm out-of-pocket financial liability with TPA desk.',
          provenance: isRoomLimitPolicyDerived ? 'POLICY-DERIVED' : 'MODELLED ESTIMATE',
          timestamp,
          resolved: false
        };
      } else {
        severity = 'INFO';
        title = 'Eligible Room Category Assigned';
        summary = `Selected ${newRoom} (₹${newRate.toLocaleString('en-IN')}/day) adheres to policy limit (${roomLimitLabel}).`;
        implications.push('Zero room rent excess and zero proportionate deductions on this room category.');
        recommendedActions.push('Proceed with admission.');

        whyExplanation = {
          title: 'Room Category Complies with Policy Limit',
          policyRule: `Policy Room Limit: ${roomLimitLabel}`,
          policyValue: `Allowed: ₹${roomLimitDaily.toLocaleString('en-IN')}/day`,
          patientValue: `Selected Room: ₹${newRate.toLocaleString('en-IN')}/day`,
          consequence: 'No proportionate deductions will be levied on operative and medical charges.',
          suggestedAction: 'Confirm with ward nurse that billing remains pegged to this room category.'
        };
      }
      break;
    }

    case 'INVESTIGATION_INITIATED':
    case 'INVESTIGATION_COMPLETED': {
      stage = 'INVESTIGATION';
      severity = 'INFO';
      title = eventType === 'INVESTIGATION_INITIATED' ? 'Diagnostic Investigations Initiated' : 'Diagnostic Investigations Completed';
      summary = 'Diagnostic and laboratory scans are being conducted in accordance with clinical requirements.';
      implications.push(`Pre-hospitalization window under policy: ${policy?.preHospitalizationDays || 30} days.`);
      implications.push('Investigations pertinent to the primary admitted diagnosis are eligible under policy terms.');
      recommendedActions.push('Ensure treating specialist writes prescription notes for all tests.');
      recommendedActions.push('Retain original film/plates, digital reports, and lab cash receipts.');

      whyExplanation = {
        title: 'Diagnostic Investigations & Pre-Hospitalization Clause',
        policyRule: `Pre-Hospitalization Coverage: ${policy?.preHospitalizationDays || 30} Days`,
        policyValue: 'Clinical diagnostic tests related to primary illness covered.',
        patientValue: 'Inpatient Diagnostic Evaluation',
        consequence: 'Diagnostic tests related to active treatment are admissible subject to non-medical consumable deductions.',
        suggestedAction: 'Collect certified lab reports prior to surgery scheduling.'
      };
      break;
    }

    case 'PROCEDURE_PLANNED': {
      stage = 'PROCEDURE';
      severity = 'INFO';
      title = 'Procedure Scheduled';
      summary = `Scheduled procedure: ${procedure}. Reference procedure charge: ₹${procedureCharges.toLocaleString('en-IN')}.`;
      implications.push(`Daycare coverage: ${policy?.daycareCovered ? 'Covered per policy' : '24-hour stay mandatory per policy terms'}.`);
      implications.push(`Expected patient share based on current room and copay: ₹${patientPayable.toLocaleString('en-IN')}.`);
      recommendedActions.push('Verify if treating surgeon requires implant pre-authorization.');

      whyExplanation = {
        title: 'Procedure Authorization & Cost Planning',
        policyRule: `Sum Insured: ₹${sumInsured.toLocaleString('en-IN')} • Co-pay: ${copayPct}%`,
        policyValue: `Procedure Base Cost: ₹${procedureCharges.toLocaleString('en-IN')}`,
        patientValue: `Procedure: ${procedure}`,
        consequence: 'Operative charges will be audited against Sum Insured and room tier.',
        suggestedAction: 'Obtain written cost estimate from surgeon for TPA ledger review.'
      };
      break;
    }

    case 'PROCEDURE_AUTHORIZED': {
      stage = 'PROCEDURE';
      severity = 'INFO';
      title = 'Procedure Coverage Authorized';
      summary = 'TPA confirmed authorization for surgical and operative charges.';
      implications.push('Surgeon and operative fees approved within policy sum insured boundaries.');
      recommendedActions.push('Proceed with scheduled clinical protocol.');

      whyExplanation = {
        title: 'Procedure Authorization Confirmed',
        policyRule: 'Inpatient surgical treatment approved by insurer audit.',
        policyValue: 'Authorized',
        patientValue: procedure,
        consequence: 'Hospital billing will charge approved procedure codes to insurance ledger.',
        suggestedAction: 'Keep copy of surgical authorization in patient file.'
      };
      break;
    }

    case 'PROCEDURE_COMPLETED': {
      stage = 'PROCEDURE';
      severity = 'INFO';
      title = 'Procedure Completed Successfully';
      summary = `Clinical procedure completed. Estimated patient exposure: ₹${patientPayable.toLocaleString('en-IN')}.`;
      implications.push('Insurance ledger updated with operative charges and anaesthetist fees.');
      if (sumInsured > 0) {
        implications.push(`Estimated remaining Sum Insured: ₹${Math.max(0, sumInsured - insurerEstimatedShare).toLocaleString('en-IN')}.`);
      }
      recommendedActions.push('Request implant warranty sticker and batch numbers if surgical implants were used.');

      whyExplanation = {
        title: 'Procedure Settlement & Sum Insured Consumption',
        policyRule: 'Admissible surgical expenses deducted from policy Sum Insured.',
        policyValue: `SI: ₹${sumInsured.toLocaleString('en-IN')}`,
        patientValue: `Consumed Share: ₹${insurerEstimatedShare.toLocaleString('en-IN')}`,
        consequence: 'Remaining policy balance protects subsequent admissions within the policy year.',
        suggestedAction: 'Request interim hospital billing ledger to review updated accruals.'
      };
      break;
    }

    case 'ADDITIONAL_EXPENSE': {
      stage = 'BILLING';
      const expenseType = metadata.expenseType || 'Pharmacy / Consumables';
      const expenseAmount = metadata.expenseAmount || 5000;
      severity = 'ATTENTION';
      title = 'Additional Hospital Accrual Logged';
      summary = `Additional expense logged: ${expenseType} (₹${Number(expenseAmount).toLocaleString('en-IN')}).`;
      implications.push('Non-medical items (gloves, PPE, administrative fees) are non-admissible under standard insurance regulations.');
      recommendedActions.push('Review itemized pharmacy slips at billing counter to identify non-admissible consumables.');

      whyExplanation = {
        title: 'Non-Admissible Consumables & Ancillary Expenses',
        policyRule: 'IRDAI non-medical items list (syringes, gloves, toiletries) are excluded from coverage.',
        policyValue: 'Excluded Consumables Clause',
        patientValue: `Expense: ${expenseType} (₹${Number(expenseAmount).toLocaleString('en-IN')})`,
        consequence: 'Non-admissible charges must be settled out-of-pocket before discharge.',
        suggestedAction: 'Inquire if generic pharmacy items are available from the in-house pharmacy.'
      };
      break;
    }

    case 'BILLING_INITIATED':
    case 'FINAL_BILL': {
      stage = 'BILLING';
      severity = hasRoomExcess ? 'ATTENTION' : 'INFO';
      title = 'Interim Reference Bill Compiled';
      summary = `Interim estimated bill: ₹${estimatedBill.toLocaleString('en-IN')}. Estimated insurer share: ₹${insurerEstimatedShare.toLocaleString('en-IN')}.`;
      implications.push('This is an indicative reference estimate, not a binding final bill.');
      if (deductibleApplied > 0) {
        implications.push(`Compulsory policy deductible applied: ₹${deductibleApplied.toLocaleString('en-IN')}.`);
      }
      if (copayAmount > 0) {
        implications.push(`Mandatory co-payment (${copayPct}%): ₹${copayAmount.toLocaleString('en-IN')}.`);
      }
      if (proportionateDisallowance > 0) {
        implications.push(`Proportionate deduction from room cap breach: ₹${proportionateDisallowance.toLocaleString('en-IN')}.`);
      }
      recommendedActions.push('Verify itemized bill with hospital billing coordinator before TPA final transmission.');

      whyExplanation = {
        title: 'Bill Audit & Out-of-Pocket Breakdown',
        policyRule: `Deductible: ₹${deductibleApplied} • Co-pay: ${copayPct}% • Proportionate Active: ${proportionateDeductionActive}`,
        policyValue: `Total Estimated Bill: ₹${estimatedBill.toLocaleString('en-IN')}`,
        patientValue: `Estimated Patient Payable: ₹${patientPayable.toLocaleString('en-IN')}`,
        consequence: 'Patient pays non-admissible items, co-pay, and room excess out-of-pocket.',
        suggestedAction: 'Review bill line-by-line before signing discharge voucher.'
      };
      break;
    }

    case 'DISCHARGE_INITIATED': {
      stage = 'DISCHARGE';
      severity = 'INFO';
      title = 'Discharge Protocol Initiated';
      summary = 'Doctor has signed discharge order. Hospital billing is compiling final dossier for TPA approval.';
      implications.push('TPA final cashless clearance generally takes 3 to 5 hours from final bill transmission.');
      implications.push(`Post-hospitalization claim window: ${policy?.postHospitalizationDays || 60} days from discharge.`);
      recommendedActions.push('Obtain signed original discharge summary, consolidated final bill, and payment receipts before departure.');

      whyExplanation = {
        title: 'Discharge Clearance & Claim Retainers',
        policyRule: `Post-Hospitalization Window: ${policy?.postHospitalizationDays || 60} Days`,
        policyValue: 'Mandatory documentation for claim adjudication.',
        patientValue: 'Discharge in Progress',
        consequence: 'Missing documents will cause delays or rejection of post-hospitalization medicine claims.',
        suggestedAction: 'Collect complete original discharge packet before leaving the hospital premises.'
      };
      break;
    }

    case 'CLAIM_SUBMITTED':
    case 'CLAIM_UNDER_REVIEW':
    case 'CLAIM_SETTLED':
    case 'CLAIM_PARTIALLY_SETTLED':
    case 'CLAIM_REJECTED': {
      stage = 'RECOVERY';
      if (eventType === 'CLAIM_SETTLED') {
        severity = 'INFO';
        title = 'Simulated Claim Settled by Insurer';
        summary = `Simulated claim settled. Insurer paid: ₹${insurerEstimatedShare.toLocaleString('en-IN')}. Patient out-of-pocket: ₹${patientPayable.toLocaleString('en-IN')}.`;
        implications.push('Claim adjudication completed in simulated demo mode.');
        recommendedActions.push('Preserve claim settlement letter for annual tax deduction and medical records.');
      } else if (eventType === 'CLAIM_REJECTED') {
        severity = 'CRITICAL';
        requiresAction = true;
        title = 'Simulated Claim Rejected by Insurer';
        summary = 'Simulated feed received claim rejection notice.';
        implications.push('Insurer audit cited non-disclosure or documentation deficiency in simulated review.');
        recommendedActions.push('File a grievance with insurer grievance cell within 30 days accompanied by doctor clarification.');
      } else {
        severity = 'INFO';
        title = 'Claim Docket Submitted for Audit';
        summary = 'Post-discharge reimbursement docket submitted for adjudication.';
        implications.push('Standard claim turnaround time is 15 to 30 days under IRDAI regulations.');
        recommendedActions.push('Track claim docket number on insurer web portal or TPA mobile application.');
      }

      whyExplanation = {
        title: 'Post-Discharge Claim Adjudication (Simulated)',
        policyRule: `Post-Hospitalization Window: ${policy?.postHospitalizationDays || 60} Days`,
        policyValue: `Claim Event: ${eventType}`,
        patientValue: `Net Settled Share: ₹${insurerEstimatedShare.toLocaleString('en-IN')}`,
        consequence: 'Concludes the inpatient care insurance lifecycle.',
        suggestedAction: 'Archive digital copies of all claim submissions.'
      };
      break;
    }

    case 'POST_DISCHARGE': {
      stage = 'RECOVERY';
      severity = 'INFO';
      title = 'Post-Discharge Followup & Recovery';
      summary = `Submit recovery medicine receipts within your ${policy?.postHospitalizationDays || 60}-day post-hospitalization window.`;
      implications.push('Post-hospitalization diagnostic tests and doctor consults are reimbursable per policy terms.');
      recommendedActions.push('Preserve all follow-up prescriptions and chemist bills with batch numbers.');

      whyExplanation = {
        title: 'Post-Hospitalization Reimbursement Protocol',
        policyRule: `Post-Hospitalization Coverage: ${policy?.postHospitalizationDays || 60} Days`,
        policyValue: 'Recovery medication and checkup claims admissible.',
        patientValue: 'Post-Discharge Phase',
        consequence: 'Submitting consolidated bills within the window ensures timely reimbursement.',
        suggestedAction: 'Submit a consolidated post-hospitalization claim 45 days after discharge.'
      };
      break;
    }

    default: {
      stage = 'ADMISSION';
      severity = 'INFO';
      title = 'Care Journey Update';
      summary = 'An event occurred in the care journey timeline.';
      whyExplanation = {
        title: 'Event Recorded',
        policyRule: 'Care journey tracking',
        policyValue: 'Standard',
        patientValue: eventType,
        consequence: 'Timeline updated.',
        suggestedAction: 'Continue tracking journey milestones.'
      };
    }
  }

  const insuranceImpact = {
    hasImpact: hasRoomExcess || severity !== 'INFO',
    severity,
    title,
    summary,
    implications,
    recommendedActions,
    whyExplanation,
    financialDelta: {
      updatedOutofPocket: patientPayable,
      roomRentExcessPerDay,
      proportionateDisallowance,
      difference: totalRoomRentExcess + proportionateDisallowance
    },
    provenance
  };

  const normalizedEvent = {
    id: event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    patientId,
    timestamp,
    eventType,
    stage,
    source: event.source || 'SIMULATED_HOSPITAL_FEED',
    status: event.status || 'COMPLETED',
    metadata,
    insuranceImpact,
    requiresAction,
    severity,
    isEmergency,
    provenance
  };

  return {
    normalizedEvent,
    insuranceImpact,
    alert,
    updatedFinancialSnapshot,
    stageTransition: stage
  };
}
