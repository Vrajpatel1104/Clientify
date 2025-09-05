import React from 'react';
import { LeadStatus, EmailStatus } from '@/types';
import { getStatusColor, getStatusIcon } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  type: 'lead' | 'email';
  status: LeadStatus | EmailStatus;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ type, status, showIcon = false, className }: StatusBadgeProps) {
  const colorClasses = getStatusColor(type, status);
  const icon = type === 'lead' ? getStatusIcon('lead', status as LeadStatus) : null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        colorClasses,
        className
      )}
    >
      {showIcon && icon && <span className="mr-1">{icon}</span>}
      {status}
    </span>
  );
}
