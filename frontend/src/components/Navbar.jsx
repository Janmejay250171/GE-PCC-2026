import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, Menu, X } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  currentView,
  onGoHome,
  onGoHowItWorks,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (callback) => {
    setMobileMenuOpen(false);
    if (callback) callback();
  };

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

        {/* Desktop Navigation Links */}
        <div className="nav-links desktop-nav-links">
          <LanguageSelector compact />

          <button
            type="button"
            onClick={onGoHome}
            className={`nav-link-btn ${currentView === 'upload' ? 'active' : ''}`}
          >
            {t('navbar.uploadPolicy')}
          </button>

          <button
            type="button"
            onClick={onGoHowItWorks}
            className={`nav-link-btn nav-link-btn-highlight ${currentView === 'how-it-works' ? 'active' : ''}`}
          >
            {t('navbar.howItWorks', 'How It Works')}
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

          {currentView !== 'upload' && currentView !== 'how-it-works' ? (
            <button
              type="button"
              onClick={onResetPolicy || onGoHome}
              className="pill-btn pill-btn-ghost nav-cta"
            >
              {t('navbar.changePolicy')}
            </button>
          ) : (
            <a
              href="#demo-section"
              onClick={(e) => {
                if (currentView === 'how-it-works') {
                  e.preventDefault();
                  onGoHome();
                  setTimeout(() => {
                    const el = document.getElementById('demo-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                }
              }}
              className="pill-btn pill-btn-primary nav-cta"
            >
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

        {/* Mobile Navbar Controls (Visible <= 920px) */}
        <div className="mobile-nav-controls">
          <LanguageSelector compact />

          {user ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="mobile-avatar-btn"
              title={`View Profile: ${user.name}`}
            >
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="pill-btn pill-btn-ghost mobile-login-btn"
              title="Sign in or create account"
            >
              <UserIcon size={15} />
            </button>
          )}

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-drawer-content">
          <button
            type="button"
            onClick={() => handleNavClick(onGoHome)}
            className={`mobile-nav-item ${currentView === 'upload' ? 'active' : ''}`}
          >
            {t('navbar.uploadPolicy')}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick(onGoHowItWorks)}
            className={`mobile-nav-item ${currentView === 'how-it-works' ? 'active' : ''}`}
            style={{
              background: 'var(--color-teal-light)',
              border: '1.5px solid var(--color-teal-border)',
              color: 'var(--color-primary)',
              fontWeight: 600
            }}
          >
            {t('navbar.howItWorks', 'How It Works')}
          </button>

          {activePolicy && (
            <button
              type="button"
              onClick={() => handleNavClick(onBackToPolicy)}
              className={`mobile-nav-item ${currentView === 'summary' ? 'active' : ''}`}
            >
              {t('navbar.policySummary')}
            </button>
          )}

          {activePolicy && activePolicy.confirmedByUser && (
            <>
              <button
                type="button"
                onClick={() => handleNavClick(onGoToHospitals)}
                className={`mobile-nav-item ${currentView === 'discovery' ? 'active' : ''}`}
              >
                {t('navbar.hospitals')}
              </button>
              <button
                type="button"
                onClick={() => handleNavClick(onGoToJourney)}
                className={`mobile-nav-item ${currentView === 'journey' ? 'active' : ''}`}
              >
                {t('navbar.careJourney')}
              </button>
            </>
          )}

          <div className="mobile-nav-divider" />

          {currentView !== 'upload' && currentView !== 'how-it-works' ? (
            <button
              type="button"
              onClick={() => handleNavClick(onResetPolicy || onGoHome)}
              className="pill-btn pill-btn-ghost mobile-cta-btn"
            >
              {t('navbar.changePolicy')}
            </button>
          ) : (
            <a
              href="#demo-section"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (currentView === 'how-it-works') {
                  e.preventDefault();
                  onGoHome();
                  setTimeout(() => {
                    const el = document.getElementById('demo-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                }
              }}
              className="pill-btn pill-btn-primary mobile-cta-btn"
            >
              {t('navbar.demoPolicies')}
            </a>
          )}

          {user && (
            <button
              type="button"
              onClick={() => handleNavClick(onOpenProfile)}
              className="mobile-profile-card"
            >
              <div className="mobile-profile-avatar">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="mobile-profile-info">
                <span className="mobile-profile-name">{user.name}</span>
                <span className="mobile-profile-email">{user.email}</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

