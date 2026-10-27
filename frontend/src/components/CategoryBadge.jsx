import React from 'react';
import { 
  Wrench, 
  Zap, 
  Sparkles, 
  Hammer, 
  Wifi, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';

export const CategoryBadge = ({ category }) => {
  const getIcon = () => {
    switch (category) {
      case 'Plumbing':
        return <Wrench size={13} color="#0284c7" />;
      case 'Electrical':
        return <Zap size={13} color="#d97706" />;
      case 'Cleaning':
        return <Sparkles size={13} color="#059669" />;
      case 'Maintenance':
        return <Hammer size={13} color="#7c3aed" />;
      case 'Internet':
        return <Wifi size={13} color="#2563eb" />;
      case 'Security':
        return <ShieldCheck size={13} color="#dc2626" />;
      case 'Other':
      default:
        return <HelpCircle size={13} color="#64748b" />;
    }
  };

  return (
    <span className="badge-category">
      {getIcon()}
      {category || 'Other'}
    </span>
  );
};
