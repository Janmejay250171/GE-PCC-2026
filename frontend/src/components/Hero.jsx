export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-emblem" aria-hidden="true">
        <span className="hero-emblem-ring" />
        <span className="hero-emblem-core" />
      </div>

      <span className="pill-label">Smart Hostel • Campus</span>

      <h1 className="hero-heading">
        Everything about your
        <br />
        hostel, in one place.
      </h1>

      <p className="hero-sub">
        Manage complaints, rooms, maintenance, notices and hostel services
        through one simple platform.
      </p>

      <div className="hero-actions">
        <a href="#login" className="pill-btn pill-btn-primary">
          Sign In
        </a>
        <a href="#features" className="pill-btn pill-btn-ghost">
          Explore the system
        </a>
      </div>

      <div className="hero-visual" role="img" aria-label="Abstract room status card">
        <div className="visual-card">
          <div className="visual-card-header">
            <span className="visual-tag">HOSTEL B</span>
            <span className="visual-room">B-312 · Bed 01</span>
          </div>

          <div className="visual-assets">
            <span className="asset-chip">Fan</span>
            <span className="asset-chip">Tube Light</span>
            <span className="asset-chip">Tap</span>
          </div>

          <div className="visual-status">
            <span className="status-label">Complaint</span>
            <span className="status-value">
              <span className="status-dot" />
              In Progress
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
