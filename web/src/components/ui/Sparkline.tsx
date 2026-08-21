interface SparklinePoint {
  date: string;
  count: number;
}

// Compact cumulative-observations line, matching the reference's inline
// figure: a bordered 220x56 viewBox with one ink polyline + endpoint dot.
export function Sparkline({ data }: { data: SparklinePoint[] }) {
  const width = 220;
  const height = 56;
  const pad = 4;

  const values = data.reduce<number[]>((acc, d) => {
    acc.push((acc[acc.length - 1] || 0) + d.count);
    return acc;
  }, []);
  const max = Math.max(1, ...values);

  const points = values.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * (width - pad * 2) + pad : width / 2;
    const y = height - pad - (v / max) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = points[points.length - 1]?.split(',').map(Number);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', border: '1px solid var(--color-divider)', background: 'var(--color-bg)' }}
    >
      {points.length > 1 && (
        <polyline points={points.join(' ')} fill="none" stroke="var(--color-text)" strokeWidth="2" />
      )}
      {last && <circle cx={last[0]} cy={last[1]} r="3" fill="var(--color-text)" />}
    </svg>
  );
}
