import React from 'react';

export const MetricCard = ({ title, value, icon: Icon, color = '#3b82f6', subtitle }) => {
  return (
    <div className="metric-card">
      <div className="metric-icon-wrap" style={{ backgroundColor: `${color}15`, color }}>
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <div className="metric-val">{value}</div>
        <div className="metric-lbl">{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{subtitle}</div>}
      </div>
    </div>
  );
};
