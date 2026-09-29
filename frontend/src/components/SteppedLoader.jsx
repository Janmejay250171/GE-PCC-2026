import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function SteppedLoader() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = [
    { key: 'uploading', label: t('upload.analyzing', 'Uploading Document…'), desc: t('upload.transmitting', 'Securely transmitting your policy document') },
    { key: 'reading', label: t('upload.extracting', 'Reading Your Policy…'), desc: t('upload.extractingDesc', 'Extracting room limits, co-pay clauses, sub-limits and deductions') },
    { key: 'validating', label: t('upload.validating', 'Validating Coverage…'), desc: t('upload.validatingDesc', 'Cross-referencing insurance parameters and preparing summary') }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setActiveIndex(1);
    }, 2400);

    const timer2 = setTimeout(() => {
      setActiveIndex(2);
    }, 6500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const activeStep = steps[activeIndex];

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '440px', textAlign: 'center', alignItems: 'center' }}>
        <div className="hero-emblem" style={{ margin: '8px 0 16px' }}>
          <div className="hero-emblem-ring" style={{ animation: 'spin 4s linear infinite' }} />
          <div className="hero-emblem-core" />
        </div>

        <h3 className="modal-title" style={{ fontSize: '20px' }}>
          {activeStep.label}
        </h3>
        <p className="modal-sub" style={{ textAlign: 'center', maxWidth: '320px', margin: '4px auto 20px' }}>
          {activeStep.desc}
        </p>

        <div className="stepped-list-wrap">
          {steps.map((step, idx) => {
            const isDone = idx < activeIndex;
            const isActive = idx === activeIndex;
            return (
              <div
                key={step.key}
                className={`stepped-item ${isActive ? 'stepped-active' : ''} ${isDone ? 'stepped-done' : ''}`}
              >
                {isDone ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--color-text)' }} />
                ) : isActive ? (
                  <Loader2 size={16} className="spin-icon" style={{ color: 'var(--color-text)' }} />
                ) : (
                  <div className="stepped-dot" />
                )}
                <span className="stepped-text">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
