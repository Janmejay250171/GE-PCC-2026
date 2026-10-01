import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadPage from './pages/UploadPage';
import CoverageSummaryPage from './pages/CoverageSummaryPage';
import HospitalDiscoveryPage from './pages/HospitalDiscoveryPage';
import CareJourneyPage from './pages/CareJourneyPage';
import HowItWorksPage from './pages/HowItWorksPage';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { useAuth } from './context/AuthContext';
import { getPolicy } from './services/api';

export default function App() {
  const { user, linkCurrentPolicy } = useAuth();

  // Auth & Profile Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalPrompt, setAuthModalPrompt] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Restore session from localStorage if available
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/how-it-works') {
      return 'how-it-works';
    }
    try {
      const saved = localStorage.getItem('sehatsure_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentView && parsed.activePolicy) return parsed.currentView;
      }
    } catch {}
    return 'upload';
  });

  const [activePolicy, setActivePolicy] = useState(() => {
    try {
      const saved = localStorage.getItem('sehatsure_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activePolicy) return parsed.activePolicy;
      }
    } catch {}
    return null;
  });

  const [journeyHospital, setJourneyHospital] = useState(() => {
    try {
      const saved = localStorage.getItem('sehatsure_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.journeyHospital) return parsed.journeyHospital;
      }
    } catch {}
    return null;
  });

  const [journeyProcedure, setJourneyProcedure] = useState(() => {
    try {
      const saved = localStorage.getItem('sehatsure_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.journeyProcedure !== undefined) return parsed.journeyProcedure;
      }
    } catch {}
    return '';
  });

  const [journeyRoom, setJourneyRoom] = useState(() => {
    try {
      const saved = localStorage.getItem('sehatsure_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.journeyRoom) return parsed.journeyRoom;
      }
    } catch {}
    return 'General Ward';
  });

  // Protect unauthenticated access: require login before accessing summary, discovery or journey
  useEffect(() => {
    if (!user && currentView !== 'upload' && currentView !== 'how-it-works') {
      setCurrentView('upload');
      handleOpenAuth('login', 'Please log in first to access your insurance policy.');
    }
  }, [user, currentView]);

  // Sync active session state to localStorage
  useEffect(() => {
    try {
      if (activePolicy) {
        localStorage.setItem(
          'sehatsure_session',
          JSON.stringify({
            currentView,
            activePolicy,
            journeyHospital,
            journeyProcedure,
            journeyRoom
          })
        );
      }
    } catch (e) {
      console.warn('Could not persist session to localStorage:', e);
    }
  }, [currentView, activePolicy, journeyHospital, journeyProcedure, journeyRoom]);

  // Check URL path for direct policy navigation or how-it-works
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      if (path === '/how-it-works') {
        setCurrentView('how-it-works');
        return;
      }
      const match = path.match(/\/policy\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const policyId = match[1];
        getPolicy(policyId)
          .then((doc) => {
            setActivePolicy(doc);
            if (doc.confirmedByUser) {
              setCurrentView((prev) => (prev === 'journey' ? 'journey' : 'discovery'));
            } else {
              setCurrentView('summary');
            }
          })
          .catch((err) => {
            console.warn('Could not fetch policy from URL:', err);
          });
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  const handleGoHowItWorks = () => {
    setCurrentView('how-it-works');
    window.history.pushState({}, '', '/how-it-works');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePolicyLoaded = (policy) => {
    setActivePolicy(policy);
    setJourneyHospital(null);
    setJourneyProcedure('');
    setJourneyRoom('General Ward');
    setCurrentView('summary');
    window.history.pushState({}, '', `/policy/${policy._id}`);
    if (user && policy._id) {
      linkCurrentPolicy(policy._id);
    }
  };

  const handlePolicyConfirmed = (confirmed) => {
    setActivePolicy(confirmed);
    setCurrentView('discovery');
    if (user && confirmed._id) {
      linkCurrentPolicy(confirmed._id);
    }
  };

  const handleGoHome = () => {
    setCurrentView('upload');
    setActivePolicy(null);
    setJourneyHospital(null);
    setJourneyProcedure('');
    setJourneyRoom('General Ward');
    try {
      localStorage.removeItem('sehatsure_session');
    } catch {}
    window.history.pushState({}, '', '/');
  };

  const handleTrackCareJourney = (hospital, procedure, roomType) => {
    if (hospital) setJourneyHospital(hospital);
    if (procedure) setJourneyProcedure(procedure);
    if (roomType) setJourneyRoom(roomType);
    setCurrentView('journey');
  };

  const handleGoToJourney = () => {
    if (!journeyHospital) {
      setJourneyHospital({
        hospital_name: 'Apollo Hospitals',
        address: 'Bannerghatta Road, Bengaluru',
        city: 'bengaluru'
      });
    }
    setCurrentView('journey');
  };

  const handleOpenAuth = (mode = 'login', promptMessage = null) => {
    setAuthModalMode(mode);
    setAuthModalPrompt(promptMessage);
    setIsAuthModalOpen(true);
  };

  const handleOpenProfile = () => {
    setIsProfileModalOpen(true);
  };

  // When clicking any policy from the profile modal, always open the summary page directly
  const handleSelectPolicyFromProfile = (policy) => {
    setActivePolicy(policy);
    setJourneyHospital(null);
    setJourneyProcedure('');
    setJourneyRoom('General Ward');
    setCurrentView('summary');
    window.history.pushState({}, '', `/policy/${policy._id || ''}`);
  };

  const handleTrackJourneyFromProfile = (savedHosp) => {
    setJourneyHospital({
      hospital_name: savedHosp.hospital_name,
      address: savedHosp.address,
      city: savedHosp.city,
      segment: savedHosp.segment,
      hospital_type: savedHosp.hospital_type,
      tier: savedHosp.tier
    });
    setJourneyProcedure('');
    setJourneyRoom('General Ward');
    setCurrentView('journey');
  };

  const handleDeletePolicyFromProfile = (deletedPolicyId) => {
    if (activePolicy && activePolicy._id === deletedPolicyId) {
      setActivePolicy(null);
      setJourneyHospital(null);
      setJourneyProcedure('');
      setJourneyRoom('General Ward');
      if (currentView === 'summary' || currentView === 'discovery' || currentView === 'journey') {
        setCurrentView('upload');
      }
      try {
        localStorage.removeItem('sehatsure_session');
      } catch {}
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <div className="app-shell">
      <Navbar
        currentView={currentView}
        activePolicy={activePolicy}
        onGoHome={handleGoHome}
        onGoHowItWorks={handleGoHowItWorks}
        onBackToPolicy={() => setCurrentView('summary')}
        onResetPolicy={handleGoHome}
        onGoToHospitals={() => setCurrentView('discovery')}
        onGoToJourney={handleGoToJourney}
        onOpenAuth={(mode) => handleOpenAuth(mode)}
        onOpenProfile={handleOpenProfile}
      />

      <div className="page">
        <div className="canvas">
          <main>
            {currentView === 'how-it-works' && (
              <HowItWorksPage onGoHome={handleGoHome} />
            )}

            {currentView === 'upload' && (
              <UploadPage
                onPolicyLoaded={handlePolicyLoaded}
                onRequireAuth={(msg) => handleOpenAuth('login', msg)}
              />
            )}

            {currentView === 'summary' && activePolicy && (
              <CoverageSummaryPage
                policy={activePolicy}
                onPolicyConfirmed={handlePolicyConfirmed}
                onBackToUpload={handleGoHome}
              />
            )}

            {currentView === 'discovery' && activePolicy && (
              <HospitalDiscoveryPage
                policy={activePolicy}
                onBackToPolicy={() => setCurrentView('summary')}
                onResetPolicy={handleGoHome}
                onTrackJourney={handleTrackCareJourney}
                onRequireAuth={() => handleOpenAuth('signup', 'Please sign up or log in to bookmark hospitals.')}
              />
            )}

            {currentView === 'journey' && activePolicy && (
              <CareJourneyPage
                policy={activePolicy}
                hospital={journeyHospital}
                procedure={journeyProcedure}
                roomType={journeyRoom}
                onBackToHospitals={() => setCurrentView('discovery')}
                onBackToPolicy={() => setCurrentView('summary')}
              />
            )}
          </main>
        </div>
      </div>

      {/* Authentication Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalPrompt(null);
        }}
        initialMode={authModalMode}
        promptMessage={authModalPrompt}
      />

      {/* User Profile Modal (My Policies & Saved Hospitals) */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        activePolicy={activePolicy}
        onSelectPolicy={handleSelectPolicyFromProfile}
        onGoToUpload={() => {
          setIsProfileModalOpen(false);
          setCurrentView('upload');
        }}
        onSelectHospitalForDiscovery={() => {
          setIsProfileModalOpen(false);
          setCurrentView('discovery');
        }}
        onTrackJourneyWithHospital={handleTrackJourneyFromProfile}
        onDeletePolicy={handleDeletePolicyFromProfile}
      />
    </div>
  );
}

