type StatItem = {
  label: string;
  value: number | string;
  helper?: string;
};

export function StatTiles({ items }: { items: StatItem[] }) {
  return (
    <div className="stat-tiles">
      {items.map((item) => (
        <div key={item.label} className="stat-tile">
          <p className="hint">{item.label}</p>
          <p className="metric">{item.value}</p>
          {item.helper && <p className="subtle">{item.helper}</p>}
        </div>
      ))}
    </div>
  );
}
