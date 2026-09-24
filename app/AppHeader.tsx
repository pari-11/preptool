'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Route, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, isActive: (p: string) => p === '/' },
  {
    href: '/roadmap',
    label: 'Roadmap',
    icon: Route,
    isActive: (p: string) => p.startsWith('/roadmap') || p.startsWith('/problems'),
  },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Route className="size-4" />
          </span>
          PrepTool
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon, isActive }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                isActive(pathname)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/profile"
            aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              pathname.startsWith('/profile')
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <UserRound className="size-4" />
            Profile
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
