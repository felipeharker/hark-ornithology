import { HTMLAttributes } from 'react';

// Bordered white container - the site's standard "card" surface.
export function Panel({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border border-black bg-white ${className}`} {...props} />;
}

export function SectionHeading({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-xl font-bold font-serif border-b border-black pb-2 mb-4 ${className}`} {...props} />;
}
