import React from 'react';
import { useTranslation } from 'react-i18next';

const BADGE_CONFIG = {
  'POLICY-DERIVED': {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    labelKey: 'provenance.policyDerived',
    tooltipKey: 'provenance.tooltips.policyDerived'
  },
  'DATASET-DERIVED': {
    bg: '#dbeafe',
    color: '#1d4ed8',
    border: '#bfdbfe',
    labelKey: 'provenance.datasetDerived',
    tooltipKey: 'provenance.tooltips.datasetDerived'
  },
  'MODELLED ESTIMATE': {
    bg: '#fef3c7',
    color: '#b45309',
    border: '#fde68a',
    labelKey: 'provenance.modelledEstimate',
    tooltipKey: 'provenance.tooltips.modelledEstimate'
  },
  'SYSTEM ASSUMPTION': {
    bg: '#ffedd5',
    color: '#c2410c',
    border: '#fed7aa',
    labelKey: 'provenance.systemAssumption',
    tooltipKey: 'provenance.tooltips.systemAssumption'
  },
  'SIMULATED DEMO EVENT': {
    bg: '#f3e8ff',
    color: '#7e22ce',
    border: '#e9d5ff',
    labelKey: 'provenance.simulatedDemo',
    tooltipKey: 'provenance.tooltips.simulatedDemo'
  },
  'USER-CONFIRMED': {
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
    labelKey: 'provenance.userConfirmed',
    tooltipKey: 'provenance.tooltips.userConfirmed'
  },
  'UNKNOWN': {
    bg: '#f3f4f6',
    color: '#4b5563',
    border: '#e5e7eb',
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
