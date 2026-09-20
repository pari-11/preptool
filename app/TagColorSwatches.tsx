'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TAG_COLOR_KEYS, tagStyle } from '@/lib/tags';

// The ten tag colours as round swatches; the selected one carries a tick and a ring.
export function TagColorSwatches({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="group" aria-label={label}>
      {TAG_COLOR_KEYS.map((key) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={`Colour ${key}`}
            aria-pressed={selected}
            title={key}
            className={cn(
              'flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-popover transition-transform hover:scale-110',
              tagStyle(key).dot,
              selected && 'ring-2 ring-foreground/70'
            )}
          >
            {selected && <Check className="size-3.5 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
