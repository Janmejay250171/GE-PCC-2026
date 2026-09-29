import React from 'react';
import { useTranslation } from 'react-i18next';
import { User as UserIcon } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  currentView,
  onGoHome,
  onBackToPolicy,
  onResetPolicy,
  activePolicy,
  onGoToHospitals,
  onGoToJourney,
  onOpenAuth,
  onOpenProfile
}) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="navbar-wrapper">
      <div className="navbar-inner">
        <div className="brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>
          <img
            src="/sehatsure-logo.png"
            alt="SehatSure Logo"
            className="brand-logo-img"
          />
          <div className="brand-text">
            <span className="brand-name">{t('common.appName')}</span>
            <span className="brand-sub">{t('common.appTagline')}</span>
          </div>
        </div>

        <div className="nav-links">
          <LanguageSelector compact />

          <button
            type="button"
            onClick={onGoHome}
            className={`nav-link-btn ${currentView === 'upload' ? 'active' : ''}`}
          >
            {t('navbar.uploadPolicy')}
          </button>

          {activePolicy && (
            <button
              type="button"
              onClick={onBackToPolicy}
              className={`nav-link-btn ${currentView === 'summary' ? 'active' : ''}`}
            >
              {t('navbar.policySummary')}
            </button>
          )}

          {activePolicy && activePolicy.confirmedByUser && (
            <>
              <button
                type="button"
                onClick={onGoToHospitals}
                className={`nav-link-btn ${currentView === 'discovery' ? 'active' : ''}`}
              >
                {t('navbar.hospitals')}
              </button>
              <button
                type="button"
                onClick={onGoToJourney}
                className={`nav-link-btn ${currentView === 'journey' ? 'active' : ''}`}
              >
                {t('navbar.careJourney')}
              </button>
            </>
          )}

          {currentView !== 'upload' ? (
            <button
              type="button"
              onClick={onResetPolicy || onGoHome}
              className="pill-btn pill-btn-ghost nav-cta"
            >
              {t('navbar.changePolicy')}
            </button>
          ) : (
            <a href="#demo-section" className="pill-btn pill-btn-primary nav-cta">
              {t('navbar.demoPolicies')}
            </a>
          )}

          {/* Profile / Auth Button at end of Navbar */}
          {user ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="nav-link-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 5px',
                borderRadius: 'var(--radius-pill)',
                background: '#f8fafc',
                border: '1px solid var(--color-border)',
                cursor: 'pointer'
              }}
              title={`View Profile: ${user.name} (${user.email})`}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '12px'
                }}
              >
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                {user.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="pill-btn pill-btn-ghost nav-cta"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              title="Sign in or create account"
            >
              <UserIcon size={14} />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

