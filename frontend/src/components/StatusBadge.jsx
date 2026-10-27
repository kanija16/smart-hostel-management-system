import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStatusClass = (st) => {
    switch (st?.toLowerCase()) {
      case 'in progress':
        return 'in-progress';
      case 'resolved':
        return 'resolved';
      case 'rejected':
        return 'rejected';
      case 'submitted':
      default:
        return 'submitted';
    }
  };

  return (
    <span className={`badge-status ${getStatusClass(status)}`}>
      {status || 'Submitted'}
    </span>
  );
};
