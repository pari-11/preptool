import { companyInitials, companyTint } from '@/lib/companies';
import { cn } from '@/lib/utils';

// A company's logo, or its initials on a tinted square when no logo file exists. Whether a file
// exists is decided on the server (lib/companyLogos.ts) and passed in as `logo`, so there is no
// broken-image flash and this stays a server component.
export function CompanyLogo({
  name,
  logo,
  className,
}: {
  name: string;
  logo: string | null;
  className?: string;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small static asset, no optimisation needed
      <img
        src={logo}
        alt=""
        aria-hidden
        className={cn('size-4 shrink-0 rounded-[3px] object-contain', className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ backgroundColor: companyTint(name) }}
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] text-[8px] font-bold leading-none text-white',
        className
      )}
    >
      {companyInitials(name)}
    </span>
  );
}
