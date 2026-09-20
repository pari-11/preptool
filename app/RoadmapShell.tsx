'use client';

import { useState, type ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// Two-column roadmap layout with a collapsible stage sidebar. The sidebar folds to a slim rail
// with an always-visible toggle (no menu), and the roadmap takes the freed width. The choice is
// kept in a cookie so the server renders the right layout on the next visit, with no flash.
export function RoadmapShell({
  nav,
  initialCollapsed,
  children,
}: {
  nav: ReactNode;
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `roadmap-nav=${next ? 'collapsed' : 'open'}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
      <aside
        className={cn(
          'sticky top-[4.5rem] hidden h-[calc(100vh-5.5rem)] shrink-0 flex-col transition-[width] duration-200 lg:flex',
          collapsed ? 'w-10' : 'w-60'
        )}
      >
        <div className={cn('flex items-center pb-2', collapsed ? 'justify-center' : 'justify-between pl-2.5')}>
          {!collapsed && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stages</span>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand the stages sidebar' : 'Collapse the stages sidebar'}
            title={collapsed ? 'Show stages' : 'Hide stages'}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        {collapsed ? (
          <span className="mx-auto mt-2 select-none text-[11px] font-semibold uppercase tracking-wider text-muted-foreground [writing-mode:vertical-rl]">
            Stages
          </span>
        ) : (
          <div className="min-h-0 flex-1">{nav}</div>
        )}
      </aside>

      <div className={cn('min-w-0 flex-1', collapsed ? 'max-w-6xl' : 'max-w-5xl')}>{children}</div>
    </div>
  );
}
