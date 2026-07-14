import React from 'react';

const Skeleton = ({ width, height, borderRadius = '8px', style = {} }) => (
  <div
    style={{
      width: width || '100%',
      height: height || '16px',
      borderRadius,
      background: 'linear-gradient(90deg, rgba(148,163,184,0.08) 25%, rgba(148,163,184,0.18) 50%, rgba(148,163,184,0.08) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }}
  />
);

export const SkeletonCard = ({ style = {} }) => (
  <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.1)', ...style }}>
    <Skeleton width="60%" height="14px" />
    <Skeleton width="40%" height="20px" style={{ marginTop: '10px' }} />
    <Skeleton width="80%" height="12px" style={{ marginTop: '10px' }} />
  </div>
);

export const SkeletonList = ({ count = 4 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default Skeleton;
