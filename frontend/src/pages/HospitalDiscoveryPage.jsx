import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  MapPin,
  Stethoscope,
  Bed,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Search,
  X,
  Star,
  SlidersHorizontal,
  ChevronDown,
  Bookmark,
  ExternalLink,
  AlertOctagon
} from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/maps';
import { useAuth } from '../context/AuthContext';
import {
  fetchCities,
  fetchTaxonomy,
  searchHospitals
} from '../services/hospitalApi';
import BillBreakdownModal from '../components/BillBreakdownModal';
import ScoreBreakdownModal from '../components/ScoreBreakdownModal';
import ProvenanceBadge from '../components/ProvenanceBadge';

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function HighlightText({ text, highlight }) {
  if (!highlight || !highlight.trim() || !text) {
    return <>{text}</>;
  }
  const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.trim().toLowerCase() ? (
          <mark key={i} style={{ background: '#fef08a', padding: '0 2px', borderRadius: '2px' }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

const COMMON_LOCALITIES = [
  'Whitefield', 'Indiranagar', 'Koramangala', 'Jayanagar',
  'Hebbal', 'Bannerghatta', 'Rajajinagar', 'Malleshwaram',
  'Electronic City', 'Yelahanka', 'HSR Layout', 'Marathahalli',
  'BTM Layout', 'Banashankari', 'Yeshwanthpur'
];

export default function HospitalDiscoveryPage({
  policy,
  onBackToPolicy,
  onResetPolicy,
  onTrackJourney,
  onRequireAuth
}) {
  const { t } = useTranslation();
  const { user, isHospitalSaved, toggleSaveHospital } = useAuth();

  // Filters
  const [selectedCity, setSelectedCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('General Ward');
  const [networkOnly, setNetworkOnly] = useState(() => Boolean(policy?.insurer));

  // Metadata
  const [cities, setCities] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [proceduresMap, setProceduresMap] = useState({});
  const [availableProcedures, setAvailableProcedures] = useState([]);

  // Results & Explicit Counts (Section 4, 12)
  const [hospitals, setHospitals] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [networkFacilityCount, setNetworkFacilityCount] = useState(0);
  const [specialtyMatchedCount, setSpecialtyMatchedCount] = useState(0);
  const [procedureMatchedCount, setProcedureMatchedCount] = useState(0);
  const [networkStatusMessage, setNetworkStatusMessage] = useState(null);
  const [cityAverageCost, setCityAverageCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('coverageFit');

  // Default sort is always Best Coverage Fit
  // User can manually toggle to specialtyFit if desired

  // Pagination
  const [displayCount, setDisplayCount] = useState(12);

  // Modals
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScoreForModal, setSelectedScoreForModal] = useState(null);

  // Click outside to close city dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch additional matching cities dynamically as user types
  useEffect(() => {
    const q = cityInput.trim().toLowerCase();
    if (!q || q.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const remote = await fetchCities(q);
        if (remote && remote.length > 0) {
          setCities((prev) => {
            const map = new Map(prev.map((c) => [c.name.toLowerCase(), c]));
            remote.forEach((r) => map.set(r.name.toLowerCase(), r));
            return Array.from(map.values()).sort((a, b) => b.count - a.count);
          });
        }
      } catch (err) {
        console.warn('City search error:', err);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [cityInput]);

  // Compute live matching cities according to current input text
  const matchingCities = useMemo(() => {
    const q = cityInput.trim().toLowerCase();
    if (!q) {
      return cities.slice(0, 15);
    }
    return cities
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 30);
  }, [cities, cityInput]);

  const handleSelectCity = (cityName) => {
    setCityInput(cityName);
    setSelectedCity(cityName);
    setIsCityDropdownOpen(false);
    setSortBy('coverageFit');
  };

  const handleClearCity = () => {
    setCityInput('');
    setSelectedCity('');
    setIsCityDropdownOpen(false);
  };

  const handleCityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingCities.length > 0) {
        handleSelectCity(matchingCities[0].name);
      } else if (cityInput.trim()) {
        handleSelectCity(cityInput.trim());
      }
    } else if (e.key === 'Escape') {
      setIsCityDropdownOpen(false);
    }
  };

  // Load initial cities & taxonomy
  useEffect(() => {
    async function loadMeta() {
      try {
        const [citiesData, taxData] = await Promise.all([
          fetchCities(),
          fetchTaxonomy()
        ]);
        setCities(citiesData);
        setSpecialties(taxData.specialties || []);
        setProceduresMap(taxData.proceduresBySpecialty || {});
      } catch (err) {
        console.error('Failed to load clinical metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Update available procedures when specialty changes
  useEffect(() => {
    if (selectedSpecialty && proceduresMap[selectedSpecialty]) {
      setAvailableProcedures(proceduresMap[selectedSpecialty]);
      if (selectedProcedure && !proceduresMap[selectedSpecialty].includes(selectedProcedure)) {
        setSelectedProcedure('');
      }
    } else {
      setAvailableProcedures([]);
      setSelectedProcedure('');
    }
  }, [selectedSpecialty, proceduresMap]);

  // Execute search whenever primary filters change
  useEffect(() => {
    if (!selectedCity || !selectedCity.trim()) {
      setHospitals([]);
      setTotalCount(0);
      setNetworkFacilityCount(0);
      setSpecialtyMatchedCount(0);
      setProcedureMatchedCount(0);
      setNetworkStatusMessage(null);
      setCityAverageCost(0);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 350);

    return () => clearTimeout(timer);
  }, [selectedCity, selectedSpecialty, selectedProcedure, selectedRoom, networkOnly]);

  const performSearch = async () => {
    if (!selectedCity || !selectedCity.trim()) {
      setHospitals([]);
      setTotalCount(0);
      setNetworkFacilityCount(0);
      setSpecialtyMatchedCount(0);
      setProcedureMatchedCount(0);
      setNetworkStatusMessage(null);
      setCityAverageCost(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await searchHospitals({
        policyId: policy._id,
        policy,
        city: selectedCity.trim(),
        specialty: selectedSpecialty || undefined,
        procedure: selectedProcedure || undefined,
        roomType: selectedRoom,
        networkOnly: Boolean(policy?.insurer) || networkOnly
      });

      setHospitals(res.hospitals || []);
      setTotalCount(res.totalCount || 0);
      setNetworkFacilityCount(res.networkFacilityCount || 0);
      setSpecialtyMatchedCount(res.specialtyMatchedCount || 0);
      setProcedureMatchedCount(res.procedureMatchedCount || 0);
      setNetworkStatusMessage(res.message || null);
      setCityAverageCost(res.cityAverageCost || 0);
      setDisplayCount(12);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search hospitals.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedCity('');
    setCityInput('');
    setIsCityDropdownOpen(false);
    setSelectedSpecialty('');
    setSelectedProcedure('');
    setSelectedRoom('General Ward');
    setNetworkOnly(Boolean(policy?.insurer));
    setSearchQuery('');
    setTypeFilter('all');
    setSortBy('coverageFit');
    setHospitals([]);
    setTotalCount(0);
    setNetworkFacilityCount(0);
    setSpecialtyMatchedCount(0);
    setProcedureMatchedCount(0);
    setNetworkStatusMessage(null);
  };

  // Filter & sort
  const filteredHospitals = useMemo(() => {
    let list = [...hospitals];

    // If an insurer policy is active, strictly filter to hospitals that accept this insurer in all sorting features
    if (policy?.insurer || networkOnly) {
      list = list.filter((item) => item.networkInfo?.networkStatus === 'verified');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) => {
        const h = item.hospital;
        const nameMatch = (h.hospital_name || '').toLowerCase().includes(q);
        const addrMatch = (h.address || '').toLowerCase().includes(q);
        const specMatch = (h.specialties || []).some((s) => s.toLowerCase().includes(q));
        return nameMatch || addrMatch || specMatch;
      });
    }

    if (typeFilter === 'topRated') {
      list = list.filter((item) => (item.hospital.rating || 0) >= 4.0);
    } else if (typeFilter === 'private') {
      list = list.filter((item) => (item.hospital.hospital_type || '').toLowerCase() === 'private');
    } else if (typeFilter === 'government') {
      list = list.filter((item) => (item.hospital.hospital_type || '').toLowerCase() === 'government');
    }

    if (selectedSpecialty && sortBy === 'specialtyFit') {
      const specialtyOnlyList = list.filter(
        (item) => item.specialtyNameMatch?.matched || item.specialtyNameRelevance?.matched
      );
      if (specialtyOnlyList.length > 0) {
        list = specialtyOnlyList;
      }
      list.sort((a, b) => a.rank - b.rank);
    } else if (sortBy === 'coverageFit' || sortBy === 'rank') {
      list.sort((a, b) => {
        const scoreA = a.score?.granularScore ?? a.score?.finalScore ?? 0;
        const scoreB = b.score?.granularScore ?? b.score?.finalScore ?? 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        const oopA = a.score?.patientPayable ?? 0;
        const oopB = b.score?.patientPayable ?? 0;
        if (oopA !== oopB) {
          return oopA - oopB;
        }
        return (b.hospital?.rating || 0) - (a.hospital?.rating || 0);
      });
    } else {
      list.sort((a, b) => a.rank - b.rank);
    }

    return list;
  }, [hospitals, searchQuery, typeFilter, sortBy, selectedSpecialty, policy?.insurer, networkOnly]);

  const displayedHospitals = filteredHospitals.slice(0, displayCount);

  const isCurrentSpecialtyExcluded = Boolean(
    selectedSpecialty &&
    policy?.exclusions &&
    Array.isArray(policy.exclusions) &&
    policy.exclusions.some((ex) => {
      const normEx = String(ex).toLowerCase().trim();
      const normSpec = selectedSpecialty.toLowerCase().trim();
      return normEx === normSpec || normSpec.includes(normEx) || normEx.includes(normSpec);
    })
  );

  const openBreakdownModal = (item) => {
    setSelectedHospitalForModal(item);
    setIsModalOpen(true);
  };

  return (
    <div className="discovery-page-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Policy Executive Context Strip */}
      <section
        className="features"
        style={{
          padding: '24px clamp(20px, 3.5vw, 36px)',
          borderRadius: 'var(--radius-lg)',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img
              src="/sehatsure-logo.png"
              alt="SehatSure"
              style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="pill-label" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>{t('discovery.activePolicyCoverage')}</span>
                {policy.insurer && (
                  <span className="pill-label" style={{ fontSize: '11px', fontWeight: 800, background: '#f1f5f9', color: '#0f172a', border: '1.5px solid #cbd5e1' }}>
                    {policy.insurer}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                {policy.insurer ? policy.insurer.toUpperCase() : 'ACTIVE POLICY'} • <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{policy.planName || 'Plan'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="pill-btn pill-btn-ghost"
              style={{ padding: '9px 18px', fontSize: '13px' }}
              onClick={onBackToPolicy}
            >
              {t('discovery.viewPolicyTerms')}
            </button>
            <button
              type="button"
              className="pill-btn pill-btn-primary"
              style={{ padding: '9px 20px', fontSize: '13px' }}
              onClick={onResetPolicy}
            >
              {t('discovery.changePolicy')}
            </button>
          </div>
        </div>

        {/* High-Visibility Policy Metrics (Sum Insured, Room Rent, Co-Pay, Exclusions) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            width: '100%',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          {/* Sum Insured */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('discovery.sumInsured')}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px', letterSpacing: '-0.02em' }}>
              ₹{policy.sumInsured ? Number(policy.sumInsured).toLocaleString('en-IN') : t('common.unlimited')}
            </div>
          </div>

          {/* Room Rent */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('discovery.roomRentLimit')}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px', letterSpacing: '-0.02em' }}>
              {policy.roomLimit ? (policy.roomLimit.type === 'amount' ? `₹${Number(policy.roomLimit.value).toLocaleString('en-IN')}/day` : t('discovery.percentOfSI', { percent: policy.roomLimit.value })) : t('discovery.noRoomLimit')}
            </div>
          </div>

          {/* Co-pay */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('discovery.baseCopay')}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px', letterSpacing: '-0.02em' }}>
              {policy.copay || 0}%
            </div>
          </div>

          {/* Excluded Treatments (if any) */}
          {policy.exclusions && policy.exclusions.length > 0 && (
            <div
              style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Excluded Treatments
                </span>
                <span style={{ fontSize: '10px', background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  Not Covered
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', marginTop: '6px', textTransform: 'capitalize' }}>
                {policy.exclusions.join(', ')}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filter Control Box */}
      <section className="features" style={{ padding: '32px clamp(20px, 4vw, 40px)', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="pill-label" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>
              {t('discovery.filterBadge')}
            </span>
            <h2 className="section-heading" style={{ textAlign: 'left', fontSize: '24px', fontWeight: 700, marginTop: '6px' }}>
              {selectedCity.trim() ? t('discovery.findHospitalsWithCity', { city: selectedCity.trim() }) : t('discovery.findHospitalsGeneral')}
            </h2>
          </div>

          {(selectedCity || selectedSpecialty || selectedProcedure || searchQuery || typeFilter !== 'all') && (
            <button
              type="button"
              className="pill-btn pill-btn-ghost pill-btn-sm"
              onClick={handleClearFilters}
            >
              <RotateCcw size={13} style={{ marginRight: '6px' }} />
              {t('discovery.resetFilters')}
            </button>
          )}
        </div>

        {/* 4 Primary Inputs Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* City */}
          <div className="field" ref={cityDropdownRef} style={{ position: 'relative' }}>
            <label className="field-label" style={{ fontSize: '12px', fontWeight: 600 }}>
              {t('discovery.city')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="field-input"
                placeholder={t('discovery.cityInputPlaceholder')}
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setIsCityDropdownOpen(true);
                  setSortBy('coverageFit');
                }}
                onFocus={() => setIsCityDropdownOpen(true)}
                onKeyDown={handleCityKeyDown}
                style={{ paddingRight: cityInput ? '32px' : '14px', fontSize: '14px' }}
                autoComplete="off"
              />
              {cityInput && (
                <button
                  type="button"
                  onClick={handleClearCity}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)'
                  }}
                  title={t('discovery.clearCity')}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {isCityDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.06)',
                  maxHeight: '280px',
                  overflowY: 'auto'
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2
                  }}
                >
                  <span>{cityInput.trim() ? t('discovery.citiesMatching', { query: cityInput.trim() }) : t('discovery.topCities')}</span>
                  <span>{t('discovery.citiesFound', { count: matchingCities.length })}</span>
                </div>

                {matchingCities.length > 0 ? (
                  matchingCities.map((c) => {
                    const isSelected = selectedCity.toLowerCase() === c.name.toLowerCase();
                    return (
                      <div
                        key={c.name}
                        onClick={() => handleSelectCity(c.name)}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isSelected ? '#f0fdf4' : 'transparent',
                          borderBottom: '1px solid var(--color-border)',
                          transition: 'background 0.1s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} style={{ color: isSelected ? '#16a34a' : 'var(--color-text-muted)', flexShrink: 0 }} />
                          <span style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 500, color: 'var(--color-text)' }}>
                            <HighlightText text={c.name} highlight={cityInput} />
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            color: isSelected ? '#166534' : 'var(--color-text-secondary)',
                            background: isSelected ? '#dcfce7' : 'var(--color-surface)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            fontWeight: 600
                          }}
                        >
                          {t('discovery.hospitalsCount', { count: Number(c.count).toLocaleString('en-IN') })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '16px 14px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {t('discovery.noCitiesMatching', { query: cityInput.trim() })}
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        className="pill-btn pill-btn-ghost pill-btn-sm"
                        onClick={() => handleSelectCity(cityInput.trim())}
                      >
                        {t('discovery.searchCityAnyway', { query: cityInput.trim() })}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Specialty */}
          <div className="field">
            <label className="field-label" style={{ fontSize: '12px', fontWeight: 600 }}>
              {t('discovery.specialtyDept')}
            </label>
            <select
              className="field-input"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              style={{ fontSize: '14px' }}
            >
              <option value="">{t('discovery.allSpecialties')}</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Procedure */}
          <div className="field">
            <label className="field-label" style={{ fontSize: '12px', fontWeight: 600 }}>
              {t('discovery.procedureSurgery')}
            </label>
            <select
              className="field-input"
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              disabled={!selectedSpecialty}
              style={{ fontSize: '14px' }}
            >
              <option value="">
                {selectedSpecialty ? t('discovery.allProceduresInDept') : t('discovery.selectSpecialtyFirst')}
              </option>
              {availableProcedures.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Room Category */}
          <div className="field">
            <label className="field-label" style={{ fontSize: '12px', fontWeight: 600 }}>
              {t('discovery.roomCategory')}
            </label>
            <select
              className="field-input"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={{ fontSize: '14px' }}
            >
              <option value="General Ward">{t('discovery.roomOptions.generalWard')}</option>
              <option value="Twin Sharing">{t('discovery.roomOptions.twinSharing')}</option>
              <option value="Single Private Room">{t('discovery.roomOptions.singlePrivate')}</option>
            </select>
          </div>
        </div>

        {/* Secondary: Search bar + quick filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <input
                type="text"
                className="field-input"
                placeholder={t('discovery.searchHospitalPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px', fontSize: '14px' }}
              />
              <Search
                size={16}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick Type Filter Pills: All, Private, Govt */}
            <div className="role-tabs" style={{ width: 'auto', marginBottom: 0 }}>
              {[
                { key: 'all', label: t('discovery.typeFilter.all') },
                { key: 'private', label: t('discovery.typeFilter.private') },
                { key: 'government', label: t('discovery.typeFilter.govt') }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`role-tab ${typeFilter === tab.key ? 'role-tab-active' : ''}`}
                  onClick={() => setTypeFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Network Mode Toggle Pill */}
            <button
              type="button"
              className={`pill-btn ${networkOnly ? 'pill-btn-primary' : 'pill-btn-ghost'}`}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: 'var(--radius-pill)',
                border: networkOnly ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                cursor: policy?.insurer ? 'default' : 'pointer'
              }}
              onClick={() => {
                if (!policy?.insurer) {
                  setNetworkOnly(!networkOnly);
                }
              }}
              title={
                policy?.insurer
                  ? `Showing exclusively verified ${policy.insurer} network hospitals`
                  : (networkOnly ? t('discovery.networkMatchToggleTitleOn') : t('discovery.networkMatchToggleTitleOff'))
              }
            >
              <ShieldCheck size={14} style={{ color: networkOnly ? '#fff' : '#16a34a' }} />
              <span>
                {policy?.insurer
                  ? `${policy.insurer} Network Only`
                  : (networkOnly ? t('discovery.networkMatchToggleOn') : t('discovery.networkMatchToggle'))}
              </span>
            </button>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{t('discovery.sortLabel')}</span>
              <select
                className="field-input"
                style={{ padding: '8px 14px', fontSize: '13px', width: 'auto' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="coverageFit">{t('discovery.sortOptions.coverageFit')}</option>
                {selectedSpecialty && (
                  <option value="specialtyFit">{t('discovery.sortOptions.specialtyFit')}</option>
                )}
              </select>
            </div>
          </div>

          {/* Quick Locality chips (shown when Bengaluru is entered) */}
          {selectedCity.trim().toLowerCase() === 'bengaluru' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('discovery.localitiesLabel')}</span>
              {COMMON_LOCALITIES.slice(0, 8).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`pill-label ${searchQuery.toLowerCase() === loc.toLowerCase() ? 'pill-btn-primary' : ''}`}
                  style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 12px' }}
                  onClick={() => setSearchQuery(searchQuery.toLowerCase() === loc.toLowerCase() ? '' : loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results Header Strip */}
      {selectedCity.trim() && !loading && hospitals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="strip" style={{ padding: '16px 24px', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="strip-mark strip-mark-circle" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {t('discovery.showingHospitals', { shown: filteredHospitals.length, total: totalCount, city: selectedCity.trim() })}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: networkFacilityCount > 0 ? '#dcfce7' : '#fee2e2',
                  color: networkFacilityCount > 0 ? '#15803d' : '#b91c1c',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ShieldCheck size={13} />
                {networkFacilityCount === 1 ? t('discovery.networkMatchCount', { count: networkFacilityCount }) : t('discovery.networkMatchesCount', { count: networkFacilityCount })}
              </span>
              {selectedSpecialty && sortBy === 'specialtyFit' ? (
                <span
                  className="pill-label"
                  style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    background: '#f0fdf4',
                    color: '#166534',
                    borderColor: '#bbf7d0',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {filteredHospitals.length === 1 ? t('discovery.specialtySpotlightFacility', { count: filteredHospitals.length }) : t('discovery.specialtySpotlightFacilities', { count: filteredHospitals.length })}
                </span>
              ) : selectedSpecialty ? (
                <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>
                  {t('discovery.specialtyMatchesCount', { count: specialtyMatchedCount })}
                </span>
              ) : null}
              {selectedProcedure && (
                <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>
                  {t('discovery.procedureMatchesCount', { count: procedureMatchedCount })}
                </span>
              )}
            </div>

            {cityAverageCost > 0 && (
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                {t('discovery.benchmarkAverage', { city: selectedCity.trim(), avg: formatINR(cityAverageCost) })}
              </div>
            )}
          </div>

          {/* Mode C Notice: When browsing all hospitals but 0 verified network matches exist */}
          {!networkOnly && networkFacilityCount === 0 && (
            <div
              className="form-alert"
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px'
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, color: '#d97706' }} />
              <div>
                <strong>{t('discovery.noVerifiedNetworkAlert', { insurer: policy.insurer || 'your insurer', city: selectedCity.trim() })}</strong>
                <div style={{ marginTop: '2px', opacity: 0.9 }}>
                  {t('discovery.noVerifiedNetworkSub')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-secondary)' }}>
          <div className="hero-emblem" style={{ margin: '0 auto 16px' }}>
            <div className="hero-emblem-ring" style={{ animation: 'spin 3s linear infinite' }} />
            <div className="hero-emblem-core" />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{t('discovery.calculatingCosts')}</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="form-alert form-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Specialty Exclusion Alert */}
      {isCurrentSpecialtyExcluded && (
        <div
          style={{
            background: '#fef2f2',
            border: '1.5px solid #fca5a5',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            color: '#991b1b',
            boxShadow: '0 2px 6px rgba(185, 28, 28, 0.08)'
          }}
        >
          <AlertOctagon size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>
              Specialty Exclusion: {selectedSpecialty} Treatments Are Not Covered by Your Policy
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>
              Your {policy.insurer || 'uploaded'} policy explicitly excludes claims for {selectedSpecialty}. Hospital bills for {selectedSpecialty} treatments are not admissible by your insurer and require 100% patient out-of-pocket payment.
            </div>
          </div>
        </div>
      )}

      {/* Hospital Cards Grid */}
      {!loading && displayedHospitals.length > 0 && (
        <div className="hospitals-grid">
          {displayedHospitals.map((item, idx) => {
            const h = item.hospital;
            const est = item.estimate;
            const score = item.score;
            const hasExcess = score.excessOverSI > 0;
            const netInfo = item.networkInfo || {
              networkStatus: 'unknown',
              matchedInsurer: null,
              matchMethod: 'insufficient_data',
              matchEvidence: null
            };
            const networkStatus = netInfo.networkStatus || 'unknown';
            const isVerified = networkStatus === 'verified';
            const isNoMatch = networkStatus === 'no_match';
            const isUnverified = networkStatus === 'unverified';
            const isSaved = isHospitalSaved(h.hospital_name, h.address);

            return (
              <div key={h.hospital_name + h.address} className="feature-card" style={{ gap: '16px', minWidth: 0, overflow: 'hidden', padding: '22px 20px', border: '1.5px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                {/* Header Row: #idx+1, Type, Metro/Tier, Rating, SehatSure Score, Spotlight, [rightest] Save Option */}
                {/* Header Row: Left Badges | Middle SehatSure Score | Right Save Option */}
                <div className="hospital-card-header">
                  {/* Left: Metadata Badges (#idx+1, Type, Metro/Tier, Rating) */}
                  <div className="hospital-card-header-left">
                    <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 800, background: '#f1f5f9', color: '#0f172a', border: '1.5px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                      #{idx + 1}
                    </span>
                    <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700, background: '#f8fafc', color: '#0f172a', border: '1.5px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                      {h.hospital_type || 'Private'}
                    </span>
                    <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700, background: '#f8fafc', color: '#0f172a', border: '1.5px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                      {h.tier || 'Metro 1'}
                    </span>
                    {h.rating > 0 && (
                      <span className="pill-label" style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 800, background: '#fffbeb', color: '#92400e', border: '1.5px solid #fde68a', whiteSpace: 'nowrap' }}>
                        ★ {Number(h.rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Middle: SehatSure Score (centered in this line) */}
                  <div className="hospital-card-header-middle">
                    {score && (score.granularScore !== undefined || score.finalScore !== undefined) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScoreForModal({
                            hospital: h,
                            score,
                            estimate: est,
                            networkInfo: netInfo
                          });
                        }}
                        className="pill-label pill-label-interactive"
                        style={{
                          fontSize: '11.5px',
                          padding: '3.5px 11px',
                          fontWeight: 800,
                          background: '#eff6ff',
                          color: '#1e40af',
                          border: '1.5px solid #93c5fd',
                          borderRadius: 'var(--radius-pill)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 3px rgba(37,99,235,0.08)'
                        }}
                        title={t('discovery.hospitalCard.fitScoreExplanation')}
                      >
                        <span>
                          {t('discovery.hospitalCard.fitScoreLabel', {
                            score: Number(score.granularScore ?? score.finalScore).toFixed(1)
                          }, `SehatSure Score : ${Number(score.granularScore ?? score.finalScore).toFixed(1)}`)}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Right: Save Option */}
                  <div className="hospital-card-header-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user && onRequireAuth) {
                          onRequireAuth();
                        }
                        toggleSaveHospital(h, est, score);
                      }}
                      style={{
                        background: isSaved ? '#eff6ff' : '#ffffff',
                        border: isSaved ? '1.5px solid #93c5fd' : '1.5px solid #cbd5e1',
                        borderRadius: 'var(--radius-pill)',
                        padding: '4px 12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isSaved ? '#1e40af' : '#0f172a',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                      }}
                      title={isSaved ? 'Hospital bookmarked in profile. Click to remove.' : 'Save this hospital to your profile'}
                    >
                      <Bookmark size={14} fill={isSaved ? '#1e40af' : 'none'} color={isSaved ? '#1e40af' : 'currentColor'} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>

                {/* Hospital Name & Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 className="feature-title" style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                      <HighlightText text={h.hospital_name} highlight={searchQuery} />
                    </h3>
                    {item.specialtyNameMatch?.matched && item.specialtyNameMatch.score > 0 && selectedSpecialty && (
                      <span
                        className="pill-label"
                        style={{
                          fontSize: '11px',
                          padding: '2.5px 8px',
                          fontWeight: 700,
                          background: '#f0fdf4',
                          color: '#166534',
                          border: '1.5px solid #bbf7d0',
                          cursor: 'help'
                        }}
                        title={item.specialtyNameMatch.explanation || t('discovery.hospitalCard.spotlightTooltip', { specialty: selectedSpecialty })}
                      >
                        🟢 {t('discovery.hospitalCard.spotlight')}
                      </span>
                    )}
                  </div>

                  {/* Clickable Address / Map Icon */}
                  <a
                    href={getGoogleMapsUrl({
                      hospital_name: h.hospital_name,
                      address: h.address,
                      city: h.city || selectedCity,
                      latitude: h.latitude,
                      longitude: h.longitude
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hospital-map-link"
                    style={{ fontSize: '13px', lineHeight: 1.45, color: '#334155' }}
                    title={h.address ? `Open "${h.hospital_name}" in Google Maps (${h.address})` : `Open "${h.hospital_name}" in Google Maps`}
                  >
                    <span className="hospital-map-pin-btn" style={{ width: '20px', height: '20px' }} title="Open in Google Maps">
                      <MapPin size={13} />
                    </span>
                    <span
                      className="hospital-address-text"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        lineHeight: 1.45,
                        fontSize: '13px',
                        color: '#334155',
                        minWidth: 0,
                        flex: 1
                      }}
                    >
                      <HighlightText text={h.address} highlight={searchQuery} />
                    </span>
                    <ExternalLink size={12} style={{ flexShrink: 0, marginTop: '2px', opacity: 0.7 }} />
                  </a>
                </div>

                {/* Specialties preview */}
                {h.specialties && h.specialties.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {h.specialties.slice(0, 3).map((sp) => (
                      <span key={sp} className="asset-chip" style={{ fontSize: '11.5px', padding: '4px 10px', fontWeight: 600, color: '#0f172a', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                        {sp}
                      </span>
                    ))}
                    {h.specialties.length > 3 && (
                      <span className="asset-chip" style={{ fontSize: '11.5px', padding: '4px 10px', fontWeight: 600, color: '#334155', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                        +{h.specialties.length - 3} {t('common.more', 'more')}
                      </span>
                    )}
                  </div>
                )}

                {/* Accepted Insurers & Authoritative Network Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isVerified ? (
                      <ShieldCheck size={15} style={{ color: '#16a34a' }} />
                    ) : isNoMatch ? (
                      <ShieldAlert size={15} style={{ color: '#dc2626' }} />
                    ) : isUnverified ? (
                      <AlertTriangle size={15} style={{ color: '#d97706' }} />
                    ) : (
                      <HelpCircle size={15} style={{ color: '#64748b' }} />
                    )}
                    <span>{t('discovery.hospitalCard.acceptedInsurers')}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(() => {
                      const allInsurers = (h.insurers && h.insurers.length > 0) ? h.insurers : [];
                      if (allInsurers.length === 0) {
                        return (
                          <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                            {t('discovery.hospitalCard.noInsurerData')}
                          </span>
                        );
                      }

                      // Helper to check if this hospital insurer matches the user's policy
                      const isInsurerMatching = (insName) => {
                        if (!isVerified) return false;
                        const i = insName.toLowerCase().trim();
                        if (netInfo.matchEvidence && i === netInfo.matchEvidence.toLowerCase().trim()) return true;
                        if (netInfo.matchedInsurer && (i.includes(netInfo.matchedInsurer.toLowerCase().trim()) || netInfo.matchedInsurer.toLowerCase().trim().includes(i))) return true;
                        const polIns = (policy.insurer || '').toLowerCase().trim();
                        if (polIns && (i.includes(polIns) || polIns.includes(i))) return true;
                        if (i.includes('hdfc') && (polIns.includes('hdfc') || (netInfo.matchEvidence && netInfo.matchEvidence.toLowerCase().includes('hdfc')))) return true;
                        if (i.includes('star') && polIns.includes('star')) return true;
                        if (i.includes('care') && polIns.includes('care')) return true;
                        if (i.includes('icici') && polIns.includes('icici')) return true;
                        return false;
                      };

                      // Sort so the matched policy insurer (e.g. HDFC, Star Health) appears first, and all other accepted insurers remain clearly visible
                      const sorted = [...allInsurers].sort((a, b) => {
                        const aMatch = isInsurerMatching(a);
                        const bMatch = isInsurerMatching(b);
                        if (aMatch && !bMatch) return -1;
                        if (!aMatch && bMatch) return 1;
                        return a.localeCompare(b);
                      });

                      return sorted.map((ins) => {
                        const isThisInsurerMatched = isInsurerMatching(ins);
                        return (
                          <span
                            key={ins}
                            style={{
                              fontSize: '13px',
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-pill)',
                              border: isThisInsurerMatched ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
                              background: isThisInsurerMatched ? '#f0fdf4' : '#f8fafc',
                              color: isThisInsurerMatched ? '#14532d' : '#0f172a',
                              fontWeight: isThisInsurerMatched ? 800 : 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            {isThisInsurerMatched && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />}
                            {ins}
                          </span>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Financial Overview Box */}
                <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('discovery.hospitalCard.patientShare')}
                      </span>
                      <div style={{ fontSize: '23px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginTop: '3px' }}>
                        {formatINR(score.patientPayable)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>{t('discovery.hospitalCard.treatmentCost')}</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {formatINR(est.totalCost)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }} title={`Estimated using ${est.level}-level reference data`}>
                        {est.level === 'procedure'
                          ? t('discovery.hospitalCard.procedureEst')
                          : est.level === 'specialty'
                            ? t('discovery.hospitalCard.specialtyEst')
                            : t('discovery.hospitalCard.tierEst')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '8px', lineHeight: 1.45 }}>
                    <span>
                      {isVerified ? (
                        <>{t('discovery.hospitalCard.estInsurerShare')} <strong style={{ color: '#15803d' }}>{formatINR(score.insurerEstimatedShare)}</strong></>
                      ) : isNoMatch ? (
                        score.isCopayUncertain ? (
                          <>{t('discovery.hospitalCard.estNonNetworkShare')} <strong style={{ color: '#475569' }}>{t('discovery.hospitalCard.termsUnstated')}</strong></>
                        ) : (
                          <>{t('discovery.hospitalCard.estNonNetworkShare')} <strong style={{ color: '#0f172a' }}>{formatINR(score.insurerEstimatedShare)}</strong></>
                        )
                      ) : (
                        <>{t('discovery.hospitalCard.estInsurerShare')} <strong style={{ color: '#475569' }}>{t('discovery.hospitalCard.networkUnverified')}</strong></>
                      )}
                    </span>
                    <span>{t('discovery.hospitalCard.roomLabel')} <strong>{selectedRoom}</strong></span>
                  </div>

                  {isCurrentSpecialtyExcluded && (
                    <div style={{ marginTop: '3px', fontSize: '11.5px', color: '#991b1b', background: '#fef2f2', padding: '5px 8px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 700 }}>
                      🚫 {selectedSpecialty} Excluded by Policy Terms — 100% Patient Out-of-Pocket
                    </div>
                  )}

                  {hasExcess && (
                    <div style={{ marginTop: '3px', fontSize: '11.5px', color: '#991b1b', background: '#fdf2f2', padding: '5px 8px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 600 }}>
                      {t('discovery.hospitalCard.exceedsSI', { amount: formatINR(score.excessOverSI) })}
                    </div>
                  )}
                  {score.isSumInsuredUnknown && (
                    <div style={{ marginTop: '3px', fontSize: '11.5px', color: '#92400e', background: '#fef3c7', padding: '5px 8px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: 600 }}>
                      {t('discovery.hospitalCard.siNotSpecified')}
                    </div>
                  )}
                  {score.isCopayUncertain && !isVerified && (
                    <div style={{ marginTop: '3px', fontSize: '11.5px', color: '#92400e', background: '#fef3c7', padding: '5px 8px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: 600 }}>
                      {t('discovery.hospitalCard.nonNetworkCopayUnstated')}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginTop: '2px' }}>
                  <button
                    type="button"
                    className="pill-btn pill-btn-primary"
                    style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 700 }}
                    onClick={() => openBreakdownModal(item)}
                  >
                    {t('discovery.hospitalCard.viewBreakdown')}
                  </button>
                  <button
                    type="button"
                    className="pill-btn pill-btn-ghost"
                    style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', border: '1.5px solid #cbd5e1' }}
                    onClick={() => onTrackJourney && onTrackJourney(item.hospital, selectedProcedure, selectedRoom)}
                    title={t('discovery.hospitalCard.trackJourneyTitle')}
                  >
                    {t('discovery.hospitalCard.trackJourney')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State: Prompt when no city is entered */}
      {!selectedCity.trim() && !loading && (
        <div className="features" style={{ textAlign: 'center', padding: '70px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div className="hero-emblem" style={{ margin: '0 auto 20px', width: '56px', height: '56px' }}>
            <MapPin size={26} style={{ color: 'var(--color-text-primary)' }} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
            {t('discovery.emptyCityTitle')}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '10px auto 24px', lineHeight: 1.5, fontSize: '14px' }}>
            {t('discovery.emptyCityDesc')}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('discovery.popularCities')}</span>
            {['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'].map((cityName) => (
              <button
                key={cityName}
                type="button"
                className="pill-label"
                style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '12px' }}
                onClick={() => handleSelectCity(cityName)}
              >
                {cityName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State: When city is entered but no results match filters */}
      {selectedCity.trim() && !loading && displayedHospitals.length === 0 && (
        <div className="features" style={{ textAlign: 'center', padding: '60px 20px' }}>
          {networkOnly ? (
            <>
              <div className="hero-emblem" style={{ margin: '0 auto 20px', width: '56px', height: '56px' }}>
                <ShieldAlert size={26} style={{ color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>
                {t('discovery.noNetworkHospitalsTitle', { insurer: policy.insurer || 'this insurer', city: selectedCity.trim() })}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '8px auto 20px', lineHeight: 1.5 }}>
                {networkStatusMessage || 'None of the hospitals in this location have confirmed empanelment with your insurer. You can toggle "Verified Network Only" off to discover all hospitals in this city.'}
              </p>
              <button
                type="button"
                className="pill-btn pill-btn-primary"
                onClick={() => setNetworkOnly(false)}
              >
                {t('discovery.browseAllHospitals', { city: selectedCity.trim() })}
              </button>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{t('discovery.noHospitalsMatchedTitle', { city: selectedCity.trim() })}</h3>
              <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '8px auto 20px' }}>
                {t('discovery.noHospitalsMatchedDesc')}
              </p>
              <button type="button" className="pill-btn pill-btn-primary" onClick={handleClearFilters}>
                {t('discovery.clearAllFilters')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Pagination Load More */}
      {!loading && displayedHospitals.length < filteredHospitals.length && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button
            type="button"
            className="pill-btn pill-btn-ghost"
            onClick={() => setDisplayCount((prev) => prev + 12)}
          >
            {t('discovery.loadMore', { count: filteredHospitals.length - displayedHospitals.length })}
          </button>
        </div>
      )}

      {/* Bill Breakdown Modal */}
      {selectedHospitalForModal && (
        <BillBreakdownModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hospitalName={selectedHospitalForModal.hospital.hospital_name}
          hospitalAddress={selectedHospitalForModal.hospital.address}
          hospitalSegment={selectedHospitalForModal.hospital.segment}
          hospitalTier={selectedHospitalForModal.hospital.tier}
          hospitalRating={selectedHospitalForModal.hospital.rating}
          hospitalInsurers={selectedHospitalForModal.hospital.insurers}
          initialRoomType={selectedRoom}
          policyId={policy._id}
          policy={policy}
          specialty={selectedSpecialty}
          procedure={selectedProcedure}
          onTrackJourney={onTrackJourney}
        />
      )}

      {/* SehatSure Score Breakdown Modal */}
      {selectedScoreForModal && (
        <ScoreBreakdownModal
          isOpen={!!selectedScoreForModal}
          onClose={() => setSelectedScoreForModal(null)}
          data={selectedScoreForModal}
          policy={policy}
          onOpenBillBreakdown={() => {
            setSelectedHospitalForModal({
              hospital: selectedScoreForModal.hospital,
              estimate: selectedScoreForModal.estimate
            });
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
