import React from 'react';
import { AlertCircle, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const p = priority?.toLowerCase() || 'low';

  const renderIcon = () => {
    switch (p) {
      case 'critical':
        return <ShieldAlert size={13} />;
      case 'high':
        return <AlertTriangle size={13} />;
      case 'medium':
        return <Clock size={13} />;
      case 'low':
      default:
        return <AlertCircle size={13} />;
    }
  };

  return (
    <span className={`badge-priority ${p}`}>
      {renderIcon()}
      {priority || 'Low'}
    </span>
  );
};
