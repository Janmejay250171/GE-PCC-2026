const capabilities = [
  { label: "Complaints", mark: "circle" },
  { label: "Maintenance", mark: "square" },
  { label: "Rooms", mark: "diamond" },
  { label: "Notices", mark: "bar" },
  { label: "Accountability", mark: "cross" },
];

export default function CapabilityStrip() {
  return (
    <section className="strip" aria-label="System capabilities">
      {capabilities.map((item) => (
        <div className="strip-item" key={item.label}>
          <span className={`strip-mark strip-mark-${item.mark}`} aria-hidden="true" />
          <span className="strip-label">{item.label}</span>
        </div>
      ))}
    </section>
  );
}
