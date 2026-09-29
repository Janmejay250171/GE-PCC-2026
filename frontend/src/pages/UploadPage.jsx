import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UploadZone from '../components/UploadZone';
import DemoPicker from '../components/DemoPicker';
import SteppedLoader from '../components/SteppedLoader';
import { uploadPolicyPdf, createPolicyFromDemo, getDemoPolicies } from '../services/api';
import { AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UploadPage({ onPolicyLoaded, onRequireAuth }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [demos, setDemos] = useState([]);

  useEffect(() => {
    getDemoPolicies()
      .then(setDemos)
      .catch((err) => {
        console.warn('Could not fetch demo policies dynamically:', err);
        setDemos([
          {
            id: 'pol_demo_star',
            key: 'star-health',
            title: 'Star Health (Private)',
            insurer: 'Star Health',
            planName: 'Family Health Optima',
            policyType: 'private',
            description: 'Retail family floater with ₹3,00,000 Sum Insured, ₹3,000/day room limit, 10% co-pay, and proportionate deduction clause.',
            badge: 'Retail Floater'
          },
          {
            id: 'pol_demo_hdfc',
            key: 'hdfc-ergo',
            title: 'HDFC ERGO (Corporate Group)',
            insurer: 'HDFC ERGO',
            planName: 'Corporate Group Health Shield',
            policyType: 'corporate',
            description: 'Employer-provided policy with ₹5 Lakh Sum Insured, 1% room rent cap, zero co-pay, and restoration benefit.',
            badge: 'Employer Group'
          },
          {
            id: 'pol_demo_pmjay',
            key: 'pmjay',
            title: 'PM-JAY (Ayushman Bharat)',
            insurer: 'National Health Authority',
            planName: 'Pradhan Mantri Jan Arogya Yojana',
            policyType: 'pmjay',
            description: 'Government scheme: ₹5,00,000 cashless family cover, no room limit, zero co-pay at empanelled network hospitals.',
            badge: 'Govt Scheme'
          },
          {
            id: 'pol_demo_esi',
            key: 'esi',
            title: 'ESI (Employee State Insurance)',
            insurer: 'Employees State Insurance Corporation',
            planName: 'ESIC Medical Benefit Scheme',
            policyType: 'esi',
            description: 'Statutory cover: full coverage at ESIC hospitals and tie-up centers, unlimited SI, zero room rent cap or co-pay.',
            badge: 'Statutory Cover'
          }
        ]);
      });
  }, []);

  const handleFileUpload = async (file) => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Please log in first to upload and analyze your insurance policy.');
      }
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await uploadPolicyPdf(file);
      onPolicyLoaded(response.policy);
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'Could not analyze document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoSelect = async (key) => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth('Please log in first to test and explore demo policies.');
      }
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await createPolicyFromDemo(key);
      onPolicyLoaded(response.policy);
    } catch (err) {
      console.error('Demo policy error:', err);
      setErrorMessage(err.message || 'Failed to load demo policy.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="upload-page-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {isProcessing && <SteppedLoader />}

      {/* Capability Strip */}
      <div className="strip">
        <div className="strip-item">
          <span className="strip-mark strip-mark-circle" />
          <span className="strip-label">{t('upload.features.extractionTitle')}</span>
        </div>
        <div className="strip-item">
          <span className="strip-mark strip-mark-diamond" />
          <span className="strip-label">{t('upload.features.matchingTitle')}</span>
        </div>
        <div className="strip-item">
          <span className="strip-mark strip-mark-bar" />
          <span className="strip-label">{t('upload.features.costTitle')}</span>
        </div>
        <div className="strip-item">
          <span className="strip-mark strip-mark-cross" />
          <span className="strip-label">{t('common.verified')}</span>
        </div>
      </div>

      {/* Login Required Notice when logged out */}
      {!user && (
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '1.5px solid #bfdbfe',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e3a8a' }}>
                Please Log In First
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                You must be logged in to upload policy PDFs, view coverage calculations, and explore network hospitals.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="pill-btn pill-btn-primary"
            style={{ fontWeight: 700, padding: '9px 18px', fontSize: '13.5px' }}
            onClick={() => onRequireAuth?.('Please log in first to upload and analyze your insurance policy.')}
          >
            Log In / Sign Up
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="form-alert form-alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Document Processing Notice: </strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div id="upload-card">
        <UploadZone
          onFileSelected={handleFileUpload}
          disabled={isProcessing}
          isLoggedIn={!!user}
          onRequireAuth={onRequireAuth}
        />
      </div>

      {/* Demo Policies */}
      <DemoPicker
        demos={demos}
        onSelectDemo={handleDemoSelect}
        disabled={isProcessing}
        isLoggedIn={!!user}
        onRequireAuth={onRequireAuth}
      />
    </div>
  );
}
