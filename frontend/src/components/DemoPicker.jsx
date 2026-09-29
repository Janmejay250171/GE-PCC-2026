import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export default function DemoPicker({ demos, onSelectDemo, disabled, isLoggedIn = true, onRequireAuth }) {
  const { t } = useTranslation();

  const handleDemoClick = (key) => {
    if (disabled) return;
    if (!isLoggedIn) {
      if (onRequireAuth) {
        onRequireAuth('Please log in first to test and explore demo policies.');
      }
      return;
    }
    onSelectDemo(key);
  };

  return (
    <div id="demo-section" className="demo-picker-section">
      <div className="demo-divider-wrap">
        <div className="demo-divider-line" />
        <span className="pill-label">{t('upload.demoSectionTitle')}</span>
        <div className="demo-divider-line" />
      </div>

      <div className="features-grid">
        {demos.map((demo) => (
          <div
            key={demo.key}
            className="feature-card demo-card-interactive"
            onClick={() => handleDemoClick(demo.key)}
            role="button"
            tabIndex={0}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span className="pill-label" style={{ fontSize: '11px', padding: '4px 12px' }}>
                {demo.badge || demo.policyType}
              </span>
              <span className="feature-index">SAMPLE</span>
            </div>

            <h3 className="feature-title" style={{ fontSize: '17px', marginTop: '4px' }}>
              {demo.title}
            </h3>

            <p className="feature-desc" style={{ flex: 1, fontSize: '13px' }}>
              {demo.description}
            </p>

            <div className="demo-card-action">
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('upload.loadPolicy', 'Load this policy')}</span>
              <span className="demo-arrow-circle">
                <ArrowRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
