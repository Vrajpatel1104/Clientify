import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-b-2 border-blue-600',
          sizeClasses[size],
          className
        )}
      />
      {text && (
        <span className="ml-2 text-gray-600 text-sm">{text}</span>
      )}
    </div>
  );
}
