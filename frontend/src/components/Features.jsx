const features = [
  {
    index: "01",
    title: "Complaints",
    desc: "Raise and track hostel issues without manual registers.",
    icon: "icon-complaints",
  },
  {
    index: "02",
    title: "Maintenance",
    desc: "Follow repair progress from assignment to resolution.",
    icon: "icon-maintenance",
  },
  {
    index: "03",
    title: "Room & Assets",
    desc: "Connect rooms with the assets and facilities inside them.",
    icon: "icon-rooms",
  },
  {
    index: "04",
    title: "Accountability",
    desc: "Keep every status change, assignment and resolution traceable.",
    icon: "icon-accountability",
  },
];

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="features-head">
        <h2 className="section-heading">
          Everything your hostel needs,
          <br />
          in one connected system.
        </h2>
        <p className="section-sub">
          From reporting an issue to verified resolution, every step stays
          clear and accountable.
        </p>
      </div>

      <div className="features-grid">
        {features.map((f) => (
          <div className="feature-card" key={f.index}>
            <span className="feature-index">{f.index}</span>
            <span className={`feature-icon ${f.icon}`} aria-hidden="true" />
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
