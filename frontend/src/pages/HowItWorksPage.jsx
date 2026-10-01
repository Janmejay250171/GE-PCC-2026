import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Database,
  ExternalLink,
  Calculator,
  Building2,
  Info,
  Eye,
  X
} from 'lucide-react';
import Footer from '../components/Footer';

export default function HowItWorksPage({ onGoHome }) {
  const { t } = useTranslation();
  const [enlargedImage, setEnlargedImage] = useState(null);

  const databaseUrl = 'https://cloud.mongodb.com/v2/6a9d3db249e0752ff873ec0f#/explorer/6a9d3dfbfafdddd2d2997237';

  const dataSources = [
    {
      id: 'hosp-dataset',
      badge: 'Primary Dataset',
      type: '52K Hospitals',
      name: 'Hospital Dataset',
      description: 'Standardized national dataset of 52,000+ hospitals across Indian states and cities with geographic tier classifications, specialty tags, and empanelment mappings.',
      reference: '52K hospitals',
      url: null
    },
    {
      id: 'icici-lombard',
      badge: 'Network List',
      type: 'Insurer Network',
      name: 'ICICI Lombard Network',
      description: 'Official published empanelled cashless hospital directory for ICICI Lombard General Insurance.',
      reference: 'ICICI_Lombard.Updated.pdf',
      url: 'https://healthstatic.policybazaar.com/health-insurance/Network_Lists/ICICI_Lombard.Updated.pdf'
    },
    {
      id: 'aditya-birla',
      badge: 'Network List',
      type: 'Insurer Network',
      name: 'Aditya Birla Network',
      description: 'Published empanelled cashless hospital network directory for Aditya Birla Health Insurance.',
      reference: 'Aditya_Birla.pdf',
      url: 'https://healthstatic.policybazaar.com/health-insurance/Network_Lists/health-insuranceNetwork_Lists/Aditya_Birla.pdf'
    },
    {
      id: 'hdfc-ergo',
      badge: 'Network List',
      type: 'Insurer Network',
      name: 'HDFC Network',
      description: 'Cashless network hospital directory for HDFC ERGO General Insurance policies.',
      reference: 'HDFC-Network-Hopital-List-ditto.pdf',
      url: 'https://joinditto.in/articles/content/files/2026/05/HDFC-Network-Hopital-List-ditto.pdf'
    },
    {
      id: 'niva-bupa',
      badge: 'Network List',
      type: 'Insurer Network',
      name: 'Niva Bupa Network',
      description: 'Empanelled network hospital directory for Niva Bupa Health Insurance (formerly Max Bupa).',
      reference: 'Niva_Bupa_(formerly_known_as_Max_Bupa).pdf',
      url: 'https://healthstatic.policybazaar.com/health-insurance/Network_Lists/Niva_Bupa_(formerly_known_as_Max_Bupa).pdf'
    },
    {
      id: 'star-health',
      badge: 'Network List',
      type: 'Insurer Network',
      name: 'Star Health Network',
      description: 'Cashless tie-up hospital list for Star Health and Allied Insurance.',
      reference: 'Star_Health1.pdf',
      url: 'https://healthstatic.policybazaar.com/health-insurance/Network_Lists/Star_Health1.pdf'
    },
    {
      id: 'pmjay-dataset',
      badge: 'Government Dataset',
      type: 'Public Scheme',
      name: 'PMJAY Hospital Dataset',
      description: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana empanelled healthcare providers dataset.',
      reference: 'synthetic_pmjay_dataset.csv',
      url: 'https://github.com/AditiRoy171/pmjay_hospital_recommender/blob/main/synthetic_pmjay_dataset.csv'
    },
    {
      id: 'cghs-rates',
      badge: 'Government Benchmark',
      type: 'Statutory Rates',
      name: 'CGHS Cost / Rates',
      description: 'Central Government Health Scheme baseline package rates for medical and surgical procedures across city tiers.',
      reference: 'cghshospitals.com/rates',
      url: 'https://cghshospitals.com/rates'
    },
    {
      id: 'apollo-room-rates',
      badge: 'Pricing Reference',
      type: 'Inpatient Tariff',
      name: 'Room Cost Reference — Apollo Hospital Cost Breakdown',
      description: 'Published itemized room and inpatient accommodation tariff schedule used as an empirical reference for hospital accommodation pricing across ward tiers.',
      reference: 'fittour.in/guides/apollo-hospital-cost-breakdown',
      url: 'https://fittour.in/guides/apollo-hospital-cost-breakdown'
    }
  ];

  const dbScreenshots = [
    {
      id: 'screenshot-1',
      badge: 'Policies Collection',
      title: 'Database Screenshot 1',
      recordId: '_id: "pol_demo_hdfc"',
      description: 'MongoDB mock database sample policy record (HDFC ERGO Corporate Group Health Shield).',
      src: '/mock-db-policy.png'
    },
    {
      id: 'screenshot-2',
      badge: 'Hospitals Collection',
      title: 'Database Screenshot 2',
      recordId: "ObjectId('6abc1d0bde1df00826528017a')",
      description: 'MongoDB mock database sample hospital record (St. Joseph Hospital, Hoshiarpur).',
      src: '/mock-db-hospital.png'
    },
    {
      id: 'screenshot-3',
      badge: 'Procedure Costs Collection',
      title: 'Database Screenshot 3',
      recordId: "ObjectId('6abc1d7a96b678beb17bbc9a')",
      description: 'MongoDB mock database sample procedure cost record (Angiography in Metro 1).',
      src: '/mock-db-procedure.png'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* 1. Page Header */}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(36px, 5vw, 56px) clamp(20px, 4vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-soft)'
        }}
      >
        <span
          className="pill-label"
          style={{
            background: 'var(--color-teal-light)',
            color: 'var(--color-primary)',
            borderColor: 'var(--color-teal-border)',
            fontSize: '11px',
            padding: '4px 12px',
            fontWeight: 700
          }}
        >
          {t('howItWorks.badge', 'TRANSPARENCY & METHODOLOGY')}
        </span>

        <h1
          className="section-heading"
          style={{
            margin: 0,
            fontSize: 'clamp(30px, 4vw, 44px)',
            fontWeight: 800,
            color: 'var(--color-text)',
            letterSpacing: '-0.03em'
          }}
        >
          {t('howItWorks.title', 'How SehatSure Works')}
        </h1>

        <p
          className="section-sub"
          style={{
            margin: 0,
            maxWidth: '680px',
            fontSize: 'clamp(15px, 1.4vw, 17px)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55
          }}
        >
          {t(
            'howItWorks.subtitle',
            'Hospital Data, Cost Estimation & Final Mock Database Architecture'
          )}
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="#sources"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            {t('howItWorks.navSources', '1. Data Sources')}
          </a>
          <a
            href="#costing-engine"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            {t('howItWorks.navCosting', '2. Costing Engine')}
          </a>
          <a
            href="#worked-example"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            {t('howItWorks.navExample', '3. Knee Replacement Example')}
          </a>
          <a
            href="#mock-database"
            className="pill-btn pill-btn-ghost pill-btn-sm"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            {t('howItWorks.navDatabase', '4. Final Mock Database')}
          </a>
        </div>
      </section>

      {/* 2. Hospital Dataset & Data Sources */}
      <section
        id="sources"
        className="features"
        style={{
          padding: 'clamp(32px, 4vw, 48px) clamp(20px, 4vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Database size={18} color="var(--color-primary)" />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Hospital Dataset & Data Sources
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--color-text)' }}>
            Hospital Dataset & Data Sources
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Reference datasets used for hospital networks, government benchmarks and cost estimation.
          </p>
        </div>

        <div className="hiw-source-grid">
          {dataSources.map((s) => (
            <div key={s.id} className="hiw-source-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span
                  className="pill-label"
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    fontWeight: 700,
                    background: 'var(--color-teal-light)',
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-teal-border)'
                  }}
                >
                  {s.badge}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {s.type}
                </span>
              </div>

              <div style={{ marginTop: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px', color: 'var(--color-text)' }}>
                  {s.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {s.description}
                </p>
              </div>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={s.reference}
                >
                  {s.reference}
                </span>

                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hiw-source-link"
                    title={`Open source: ${s.name}`}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>Source</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      padding: '2px 6px',
                      background: 'var(--color-bg)',
                      borderRadius: '4px'
                    }}
                  >
                    Internal DB
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Cost Estimation Engine — How It Works (7 Steps) */}
      <section
        id="costing-engine"
        className="features"
        style={{
          padding: 'clamp(32px, 4vw, 48px) clamp(20px, 4vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Calculator size={18} color="var(--color-primary)" />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Methodology & Calculations
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--color-text)' }}>
            Cost Estimation Engine — How It Works
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            End-to-end multi-tier pricing, accommodation modeling, and deterministic bill construction.
          </p>
        </div>

        <div className="hiw-method-grid">
          {/* Step 1 */}
          <div className="hiw-method-card">
            <div className="hiw-step-number">1</div>
            <div>
              <h3 className="hiw-step-title">Procedure & City-Tier Benchmark Foundation</h3>
              <p className="hiw-step-body">
                Procedure costs are modeled across eight geographic tiers: <strong>Metro 1, Metro 2, Large City 1, Large City 2, City 1, City 2, Town 1 and Town 2</strong>. CGHS rates are used as a base benchmark, while procedure prices are researched/benchmarked across representative cities to create realistic low, mean and high ranges.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="hiw-method-card">
            <div className="hiw-step-number">2</div>
            <div>
              <h3 className="hiw-step-title">Procedure-Specific Estimated Stay</h3>
              <p className="hiw-step-body">
                The engine fixes an estimated inpatient stay for each procedure from the benchmark data. For example, <strong>Metro 1 Knee Replacement uses a 4-day estimated stay</strong>. This stay is used when calculating accommodation charges.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="hiw-method-card">
            <div className="hiw-step-number">3</div>
            <div>
              <h3 className="hiw-step-title">Tier-Wise Room-Cost Estimation</h3>
              <p className="hiw-step-body">
                Room costs are estimated from approximate city-level prices and mapped to the same eight geographic tiers. They are categorized into: <strong>General Ward, Twin Sharing and Single Private Room</strong>. The FitTour — Apollo Hospital Cost Breakdown is used as a supporting reference for understanding approximate hospital room pricing. These are benchmark estimates, not exact hospital quotations.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="hiw-method-card">
            <div className="hiw-step-number">4</div>
            <div>
              <h3 className="hiw-step-title">Room Charge Calculation</h3>
              <p className="hiw-step-body">
                The selected tier-wise daily room rate is multiplied by the procedure's estimated stay. For Metro 1 Knee Replacement:
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  marginTop: '10px'
                }}
              >
                <div style={{ background: 'var(--color-bg)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>General Ward</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>₹2,500/day</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-primary)', fontWeight: 700 }}>4 days = ₹10,000</div>
                </div>
                <div style={{ background: 'var(--color-teal-light)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-teal-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Twin Sharing</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>₹5,750/day</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-primary)', fontWeight: 700 }}>4 days = ₹23,000</div>
                </div>
                <div style={{ background: 'var(--color-bg)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Single Private Room</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text)' }}>₹12,000/day</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-primary)', fontWeight: 700 }}>4 days = ₹48,000</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="hiw-method-card">
            <div className="hiw-step-number">5</div>
            <div>
              <h3 className="hiw-step-title">Hospital-Specific Procedure Pricing</h3>
              <p className="hiw-step-body">
                Exact tier + specialty + procedure data is selected first, with specialty/tier averages as fallbacks. Private hospitals use segment positions:
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' }}>
                <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>Budget / Local: 0.25</span>
                <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>Standard Private: 0.40</span>
                <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>Established: 0.50</span>
                <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>Premium: 0.65</span>
                <span className="pill-label" style={{ fontSize: '11px', padding: '3px 8px' }}>Luxury: 0.80</span>
              </div>
              <p className="hiw-step-body" style={{ margin: 0 }}>
                A <strong>deterministic ±5% hash-based variation</strong> differentiates hospitals without randomness.
              </p>
            </div>
          </div>

          {/* Step 6: Highlighted Formula Card */}
          <div className="hiw-method-card hiw-method-highlight">
            <div className="hiw-step-number" style={{ background: 'var(--color-primary)', color: '#ffffff' }}>6</div>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h3 className="hiw-step-title" style={{ color: 'var(--color-primary)', margin: 0 }}>
                  Final Bill Calculation Formula
                </h3>
                <span className="pill-label" style={{ fontSize: '10px', padding: '2px 8px', background: '#ffffff', color: 'var(--color-primary)', borderColor: 'var(--color-teal-border)' }}>
                  Deterministic Engine
                </span>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid var(--color-teal-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  margin: '12px 0 8px',
                  fontFamily: 'monospace',
                  fontSize: 'clamp(12px, 1.2vw, 14px)',
                  lineHeight: 1.6,
                  color: 'var(--color-text)',
                  boxShadow: 'var(--shadow-soft)'
                }}
              >
                <div style={{ color: 'var(--color-text-secondary)' }}>Procedure charges</div>
                <div style={{ color: 'var(--color-primary)' }}>+ 20% doctor/specialist fees</div>
                <div style={{ color: 'var(--color-primary)' }}>+ 10% medicines/diagnostics</div>
                <div style={{ color: 'var(--color-primary)' }}>+ (selected room rate × estimated stay)</div>
                <div style={{ borderTop: '1.5px solid var(--color-border)', marginTop: '8px', paddingTop: '8px', fontWeight: 800, color: 'var(--color-text)' }}>
                  = Total Estimated Hospital Bill
                </div>
              </div>
            </div>
          </div>

          {/* Step 7 */}
          <div className="hiw-method-card" style={{ gridColumn: '1 / -1' }}>
            <div className="hiw-step-number">7</div>
            <div>
              <h3 className="hiw-step-title">Insurance Impact Calculation</h3>
              <p className="hiw-step-body">
                Policy exclusions, room-rent caps, proportionate deductions, procedure sublimits, deductibles, co-pay, sum-insured excess and modeled non-medical expenses are then applied to estimate insurer and patient shares.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Knee Replacement Example in Metro 1 */}
      <section
        id="worked-example"
        className="features"
        style={{
          padding: 'clamp(32px, 4vw, 48px) clamp(20px, 4vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Building2 size={18} color="var(--color-primary)" />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Benchmark Reference Model
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--color-text)' }}>
            Example: Knee Replacement in Metro 1
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Benchmark: low ₹50,000, mean ₹2,70,000, high ₹4,00,000, estimated stay 4 days, with room rates of ₹2,500/day general, ₹5,750/day twin sharing and ₹12,000/day private.
          </p>
        </div>

        {/* Table of Components */}
        <div className="table-responsive" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Component</th>
                <th style={{ width: '35%' }}>Calculation</th>
                <th style={{ width: '25%', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Procedure</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>Mean benchmark</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹2,70,000</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Doctor fees</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>20% × procedure</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹54,000</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Medicines & diagnostics</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>10% × procedure</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹27,000</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Twin-sharing room</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>₹5,750 × 4 days</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹23,000</td>
              </tr>
              <tr style={{ background: 'var(--color-teal-light)' }}>
                <td style={{ fontWeight: 800, color: 'var(--color-text)' }}>TOTAL</td>
                <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>All components</td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '16px', color: 'var(--color-primary)' }}>
                  ₹3,74,000
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mandatory Disclaimer from PDF */}
        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontSize: '12.5px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.5
          }}
        >
          <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            *The ₹2,70,000 procedure amount is used only for demonstrating bill construction; the live engine uses hospital segment position and deterministic variation.
          </span>
        </div>
      </section>

      {/* 5. Final Mock Database Look (Replacing AI & Policy Analysis) */}
      <section
        id="mock-database"
        className="features"
        style={{
          padding: 'clamp(32px, 4vw, 48px) clamp(20px, 4vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Database size={18} color="var(--color-primary)" />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Database Architecture
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--color-text)' }}>
            Final Mock Database Look
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            The following screenshots show the final MongoDB mock database structure and sample records used in the project.
          </p>
        </div>

        {/* Database Link Banner */}
        <div
          style={{
            background: 'var(--color-mint-light, #ECFDF5)',
            border: '1.5px solid var(--color-mint-border, #A7F3D0)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-soft)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px', flex: 1 }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>
              Database Link
            </span>
            <a
              href={databaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '13px',
                fontFamily: 'monospace',
                color: 'var(--color-primary, #0F766E)',
                textDecoration: 'underline',
                wordBreak: 'break-all',
                fontWeight: 600
              }}
              title="Open MongoDB Atlas Cloud Explorer"
            >
              {databaseUrl}
            </a>
          </div>

          <a
            href={databaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pill-btn"
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-pill)',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              boxShadow: 'var(--shadow-soft)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Open Database Explorer</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* 3-Column Screenshots Grid */}
        <div className="hiw-source-grid">
          {dbScreenshots.map((item) => (
            <div key={item.id} className="hiw-source-card" style={{ gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  className="pill-label"
                  style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    fontWeight: 700,
                    background: '#EEF2FF',
                    color: '#4338CA',
                    borderColor: '#C7D2FE',
                    textTransform: 'none'
                  }}
                >
                  {item.badge}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: 'var(--color-text)' }}>
                  {item.title}
                </h3>
                <div
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--color-text-secondary)',
                    display: 'inline-block',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.recordId}
                >
                  {item.recordId}
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0', lineHeight: 1.5 }}>
                {item.description}
              </p>

              {/* Interactive Image Container with Hover Overlay */}
              <div
                className="hiw-db-image-container"
                onClick={() => setEnlargedImage(item)}
                title="Click to Enlarge Screenshot"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="hiw-db-image"
                />
                <div className="hiw-db-image-overlay">
                  <Eye size={26} color="#FFFFFF" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                    Click to Enlarge Screenshot
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Data & Methodology Note */}
      <section
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="var(--color-text-secondary)" />
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
            Data & Methodology Note
          </h3>
        </div>

        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <li>Hospital and network information comes from referenced public sources and empanelment schedules.</li>
          <li>Cost estimates are benchmark estimates based on procedure city tiers, not exact hospital quotations.</li>
          <li>Room-cost values are approximate reference values modeled from published tariffs.</li>
          <li>Estimates are not exact hospital quotations; final bills depend on treating physician ledger and clinical exigencies.</li>
          <li>The live engine uses hospital segment position and deterministic hash variation where applicable to eliminate random jitter.</li>
        </ul>
      </section>

      {/* Image Modal for Enlarging Screenshots */}
      {enlargedImage && (
        <div
          className="modal-backdrop"
          onClick={() => setEnlargedImage(null)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="modal-dialog modal-dialog-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '980px', width: '92vw', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className="pill-label"
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: '#EEF2FF',
                      color: '#4338CA',
                      borderColor: '#C7D2FE'
                    }}
                  >
                    {enlargedImage.badge}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>
                    {enlargedImage.title}
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {enlargedImage.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnlargedImage(null)}
                className="modal-close-btn"
                aria-label="Close image modal"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                width: '100%',
                maxHeight: '75vh',
                overflowY: 'auto',
                background: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '16px'
              }}
            >
              <img
                src={enlargedImage.src}
                alt={enlargedImage.title}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
