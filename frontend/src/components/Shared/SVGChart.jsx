import React from 'react';

export default function SVGChart({ type = 'bar', data = [], title = '' }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'hsl(var(--muted))',
        fontSize: '0.875rem',
        border: '1px dashed hsl(var(--border))',
        borderRadius: 'var(--radius)'
      }}>
        No data available for chart.
      </div>
    );
  }

  // Color Palette
  const colors = [
    'hsl(221.2 83.2% 53.3%)', // primary blue
    'hsl(199 89% 48%)',       // accent cyan
    'hsl(142.1 76.2% 36.3%)', // success green
    'hsl(38 92% 50%)',        // warning amber
    'hsl(346.8 77.2% 49.8%)', // danger red
    'hsl(262 83% 58%)'        // purple
  ];

  if (type === 'donut') {
    const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
    let accumulatedAngle = 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))' }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Donut SVG */}
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="50" fill="transparent" stroke="hsl(var(--secondary))" strokeWidth="20" />
            {data.map((item, index) => {
              const count = item.count || 0;
              if (count === 0 || total === 0) return null;
              
              const percentage = count / total;
              const strokeLength = percentage * 2 * Math.PI * 50;
              const strokeOffset = (1 - accumulatedAngle) * 2 * Math.PI * 50;
              accumulatedAngle += percentage;

              return (
                <circle
                  key={index}
                  cx="75"
                  cy="75"
                  r="50"
                  fill="transparent"
                  stroke={colors[index % colors.length]}
                  strokeWidth="20"
                  strokeDasharray={`${strokeLength} ${2 * Math.PI * 50}`}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 75 75)"
                  style={{
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              );
            })}
            <circle cx="75" cy="75" r="35" fill="hsl(var(--card))" />
            <text x="75" y="78" textAnchor="middle" style={{
              fill: 'hsl(var(--foreground))',
              fontSize: '1rem',
              fontWeight: 700
            }}>
              {total}
            </text>
          </svg>

          {/* Legends */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
            {data.map((item, index) => {
              const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      backgroundColor: colors[index % colors.length]
                    }} />
                    <span>{item.department || item.status || item.role || 'Other'}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{item.count} ({percent}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default: Bar Chart
  const maxVal = Math.max(...data.map(item => item.count || 0), 1);
  const chartHeight = 160;
  const barWidth = 36;
  const barGap = 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--muted))' }}>{title}</h4>
      <div style={{ width: '100%', overflowX: 'auto', paddingTop: '10px' }}>
        <svg width="100%" height="220" style={{ minWidth: `${data.length * (barWidth + barGap) + 50}px` }}>
          {/* Y Axis Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = 30 + (1 - ratio) * chartHeight;
            const gridVal = Math.round(ratio * maxVal);
            return (
              <g key={index}>
                <line x1="30" y1={y} x2="100%" y2={y} stroke="hsl(var(--border) / 0.5)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="5" y={y + 4} style={{ fill: 'hsl(var(--muted))', fontSize: '0.75rem' }}>{gridVal}</text>
              </g>
            );
          })}

          {/* Bar Chart Rects */}
          {data.map((item, index) => {
            const count = item.count || 0;
            const valRatio = count / maxVal;
            const rectHeight = valRatio * chartHeight;
            const x = 40 + index * (barWidth + barGap);
            const y = 30 + chartHeight - rectHeight;

            return (
              <g key={index} className="bar-group">
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[index % colors.length]} />
                    <stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                
                {/* The Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={rectHeight}
                  fill={`url(#grad-${index})`}
                  rx="6"
                  style={{
                    transition: 'all 0.5s ease',
                    cursor: 'pointer'
                  }}
                />

                {/* Top tooltip value */}
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" style={{
                  fill: 'hsl(var(--foreground))',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {count}
                </text>

                {/* Bottom X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={30 + chartHeight + 20}
                  textAnchor="middle"
                  style={{
                    fill: 'hsl(var(--muted))',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  {item.department ? (item.department.length > 8 ? item.department.substring(0, 7) + '..' : item.department) : (item.status || 'Other')}
                </text>
              </g>
            );
          })}

          {/* X Axis Line */}
          <line x1="30" y1={30 + chartHeight} x2="100%" y2={30 + chartHeight} stroke="hsl(var(--border))" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
