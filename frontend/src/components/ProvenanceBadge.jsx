import React from 'react';
import { useTranslation } from 'react-i18next';

const BADGE_CONFIG = {
  'POLICY-DERIVED': {
    bg: '#ecfdf5',
    color: '#16a34a',
    border: '#a7f3d0',
    labelKey: 'provenance.policyDerived',
    tooltipKey: 'provenance.tooltips.policyDerived'
  },
  'DATASET-DERIVED': {
    bg: '#f0fdfa',
    color: '#0f766e',
    border: '#ccfbf1',
    labelKey: 'provenance.datasetDerived',
    tooltipKey: 'provenance.tooltips.datasetDerived'
  },
  'MODELLED ESTIMATE': {
    bg: '#fef3c7',
    color: '#d97706',
    border: '#fde68a',
    labelKey: 'provenance.modelledEstimate',
    tooltipKey: 'provenance.tooltips.modelledEstimate'
  },
  'SYSTEM ASSUMPTION': {
    bg: '#fffbeb',
    color: '#b45309',
    border: '#fde68a',
    labelKey: 'provenance.systemAssumption',
    tooltipKey: 'provenance.tooltips.systemAssumption'
  },
  'SIMULATED DEMO EVENT': {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
    labelKey: 'provenance.simulatedDemo',
    tooltipKey: 'provenance.tooltips.simulatedDemo'
  },
  'USER-CONFIRMED': {
    bg: '#ecfdf5',
    color: '#16a34a',
    border: '#a7f3d0',
    labelKey: 'provenance.userConfirmed',
    tooltipKey: 'provenance.tooltips.userConfirmed'
  },
  'UNKNOWN': {
    bg: '#f1f5f9',
    color: '#64748b',
    border: '#e2e8f0',
    labelKey: 'provenance.unknown',
    tooltipKey: 'provenance.tooltips.unknown'
  }
};

export default function ProvenanceBadge({ type = 'MODELLED ESTIMATE', size = 'sm', style = {} }) {
  const { t } = useTranslation();
  const normKey = String(type || '').toUpperCase().trim();

  // Suppress USER-CONFIRMED and POLICY-DERIVED badges everywhere
  if (
    normKey === 'POLICY-DERIVED' ||
    normKey === 'POLICY DERIVED' ||
    normKey === 'USER-CONFIRMED' ||
    normKey === 'USER CONFIRMED'
  ) {
    return null;
  }

  const cfg = BADGE_CONFIG[normKey] || BADGE_CONFIG['UNKNOWN'];

  const isMini = size === 'xs';
  const label = t(cfg.labelKey, cfg.labelKey);
  const tooltip = t(cfg.tooltipKey, cfg.tooltipKey);

  return (
    <span
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: isMini ? '9px' : '10px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        padding: isMini ? '1px 5px' : '2px 7px',
        borderRadius: '4px',
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        lineHeight: 1.2,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {label}
    </span>
  );
}
