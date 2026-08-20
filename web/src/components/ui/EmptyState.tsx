import { HTMLAttributes } from 'react';

// Boxed placeholder for a whole section with nothing to show.
export function EmptyState({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-8 border border-black text-center font-mono text-gray-500 ${className}`}
      {...props}
    />
  );
}
