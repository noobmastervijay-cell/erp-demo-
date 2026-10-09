import React from 'react';

interface BadgeProps {
  variant?: 'active' | 'inactive' | 'suspended' | 'admin' | 'hod' | 'staff' | 'info' | 'warning' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  className = '',
}) => {
  const variants = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    suspended: 'bg-rose-50 text-rose-700 border-rose-200',
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    hod: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    staff: 'bg-blue-50 text-blue-700 border-blue-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
