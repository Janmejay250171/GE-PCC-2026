import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, X, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import ProvenanceBadge from './ProvenanceBadge';

export default function WhyExplanationModal({ explanation, onClose, provenance = 'POLICY-DERIVED' }) {
  const { t } = useTranslation();
  if (!explanation) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          width: '100%',
          maxWidth: '560px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--color-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={20} style={{ color: 'var(--color-text)' }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('whyModal.algorithmicTransparency', 'Algorithmic Transparency')}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                {t('whyModal.whyTitle', 'Why am I seeing this?')}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ProvenanceBadge type={provenance} />
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--color-text-muted)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>
              {explanation.title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {t('whyModal.subtitleNote', 'This explanation is deterministically generated from your active policy schedule clauses and current journey selections.')}
            </div>
          </div>

          {/* Structured Side-by-Side Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                {t('whyModal.policyDocClause', 'Policy Document Clause')}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                {explanation.policyValue}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {explanation.policyRule}
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#92400e', letterSpacing: '0.05em' }}>
                {t('whyModal.currentJourneyInput', 'Current Journey Input')}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                {explanation.patientValue}
              </div>
              <div style={{ fontSize: '11px', color: '#78350f', marginTop: '4px' }}>
                {t('whyModal.selectedCategory', 'Selected Category')}
              </div>
            </div>
          </div>

          {/* Implication */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#991b1b', letterSpacing: '0.04em' }}>
              <ShieldAlert size={14} /> {t('whyModal.financialImplication', 'Expected Financial Implication')}
            </div>
            <div style={{ fontSize: '13px', color: '#7f1d1d', marginTop: '6px', lineHeight: 1.5 }}>
              {explanation.consequence}
            </div>
          </div>

          {/* Recommended Action */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#166534', letterSpacing: '0.04em' }}>
              <CheckCircle2 size={14} /> {t('whyModal.plainLanguageAction', 'Plain-Language Recommended Action')}
            </div>
            <div style={{ fontSize: '13px', color: '#14532d', marginTop: '6px', lineHeight: 1.5, fontWeight: 500 }}>
              {explanation.suggestedAction}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--color-surface)' }}>
          <button
            type="button"
            className="pill-btn pill-btn-primary pill-btn-sm"
            onClick={onClose}
          >
            {t('whyModal.understood', 'Understood')}
          </button>
        </div>
      </div>
    </div>
  );
}
