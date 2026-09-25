import Link from 'next/link';
import { getCompanyDirectory } from '@/lib/companyDirectory';
import { companySlug } from '@/lib/companies';
import { logoSrc } from '@/lib/companyLogos';
import { CompanyDirectoryList } from '@/app/CompanyDirectoryList';

export default async function CompaniesPage() {
  const companies = await getCompanyDirectory();
  const logos = Object.fromEntries(companies.map((c) => [companySlug(c.name), logoSrc(companySlug(c.name))]));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse any company's roadmap coverage and off-roadmap questions. Pick target companies on your{' '}
          <Link href="/profile" className="font-medium text-primary underline-offset-2 hover:underline">
            profile
          </Link>
          .
        </p>
      </header>

      <CompanyDirectoryList companies={companies} logos={logos} />
    </div>
  );
}
