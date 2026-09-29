import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../i18n/config';

export default function LanguageSelector({ compact = false }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="language-selector-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('languages.select')}
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '4px 10px' : '6px 12px',
          borderRadius: 'var(--radius-pill)',
          background: isOpen ? 'var(--color-surface)' : 'transparent',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none'
        }}
      >
        <Globe size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        <span style={{ fontWeight: 800 }}>{currentLang.nativeName}</span>
        <ChevronDown size={12} style={{ color: 'var(--color-text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t('languages.select')}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '6px',
            minWidth: '150px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)',
              padding: '4px 8px 6px',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            {t('languages.select')}
          </div>

          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                role="menuitem"
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isSelected ? 'var(--color-surface)' : 'transparent',
                  color: isSelected ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  fontSize: '13px',
                  fontWeight: isSelected ? 800 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--color-surface)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600 }}>{lang.nativeName}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{lang.label}</span>
                </div>
                {isSelected && <Check size={14} style={{ color: '#16a34a' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
