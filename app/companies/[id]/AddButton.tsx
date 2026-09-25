'use client';

import { useTransition } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setCompanyPreferred } from '@/app/actions';

// The same Add/Added toggle as app/PersonalisationList.tsx, standalone here since this is a
// third surface for one flag (Company.is_preferred) rather than a new concept.
export function AddButton({ companyId, name, isPreferred }: { companyId: string; name: string; isPreferred: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={isPreferred ? 'secondary' : 'outline'}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setCompanyPreferred(companyId, !isPreferred);
        })
      }
      aria-pressed={isPreferred}
      aria-label={isPreferred ? `Remove ${name}` : `Add ${name}`}
      className="w-[4.5rem] shrink-0"
    >
      {isPreferred ? (
        <>
          <Check /> Added
        </>
      ) : (
        <>
          <Plus /> Add
        </>
      )}
    </Button>
  );
}
