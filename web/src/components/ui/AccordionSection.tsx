'use client';

import { ReactNode } from 'react';

interface AccordionSectionProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  /** Extra classes for the content wrapper, e.g. a min-height to avoid layout jump. */
  contentClassName?: string;
  children?: ReactNode;
}

// The repeated ▶/▼ toggle header + collapsible body used for each dashboard tab.
export function AccordionSection({ label, isOpen, onToggle, contentClassName = '', children }: AccordionSectionProps) {
  return (
    <div className="w-full">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full text-left font-serif text-2xl hover:text-gray-600 transition-colors whitespace-nowrap"
      >
        <span className="text-lg mr-2" aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
        {label}
      </button>
      {isOpen && <div className={`flex flex-col w-full py-4 ${contentClassName}`}>{children}</div>}
    </div>
  );
}
