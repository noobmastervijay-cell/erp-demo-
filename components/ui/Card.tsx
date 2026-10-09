import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`border-b border-slate-100 px-6 py-4 font-semibold text-slate-900 ${className}`}>
    {children}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-6 ${className}`}>{children}</div>;

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  colorBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorBg = 'bg-smit-900 text-white',
}) => {
  return (
    <Card className="overflow-hidden">
      <CardBody className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h4 className="mt-1.5 text-2xl font-bold text-smit-900">{value}</h4>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          {trend && <p className="mt-1 text-xs font-medium text-emerald-600">{trend}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorBg} shadow-sm`}>
          {icon}
        </div>
      </CardBody>
    </Card>
  );
};
