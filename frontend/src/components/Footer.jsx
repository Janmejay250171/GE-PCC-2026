import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/sehatsure-logo.png" alt="SehatSure" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
        <span className="footer-brand">{t('footer.brand', 'SEHATSURE HEALTHCARE DECISION SUPPORT')}</span>
      </div>
      <div className="footer-right">
        <span className="footer-copy">{t('footer.copy', 'Reference Procedure & Hospital Cost Distribution Database')}</span>
      </div>
    </footer>
  );
}
