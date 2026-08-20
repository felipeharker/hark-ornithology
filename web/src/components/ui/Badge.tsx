import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** `inverted` (black on white) calls more attention, for status flags. */
  variant?: 'default' | 'inverted';
}

export function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  const variantClass = variant === 'inverted' ? 'bg-black text-white' : 'bg-white text-black';
  return (
    <span
      className={`text-xs font-mono inline-block px-2 py-1 border border-black ${variantClass} ${className}`}
      {...props}
    />
  );
}
