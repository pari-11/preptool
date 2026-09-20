'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type NavChild = { anchor: string; label: string; title: string };
export type NavItem =
  | { type: 'stage'; anchor: string; label: string; title: string }
  | { type: 'group'; anchor: string; title: string; solved: number; total: number; children: NavChild[] };

// Stage sidebar. Follows the scroll position: the last stage whose top has passed under the
// header is highlighted, and the sidebar scrolls itself to keep that entry in view.
export function RoadmapNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const anchors = useMemo(
    () => items.flatMap((i) => (i.type === 'stage' ? [i.anchor] : i.children.map((c) => c.anchor))),
    [items]
  );

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = anchors[0] ?? null;
      for (const id of anchors) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) current = id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [anchors]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !active) return;
    const link = nav.querySelector<HTMLElement>(`[data-anchor="${active}"]`);
    if (!link) return;
    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;
    if (top < nav.scrollTop + 40 || bottom > nav.scrollTop + nav.clientHeight - 40) {
      nav.scrollTo({ top: top - nav.clientHeight / 2, behavior: 'smooth' });
    }
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label="Stages"
      className="scroll-thin relative h-full overflow-y-auto pr-2 text-sm"
    >
      <ul className="flex flex-col gap-0.5">
        {items.map((item) =>
          item.type === 'stage' ? (
            <li key={item.anchor}>
              <a
                href={`#${item.anchor}`}
                data-anchor={item.anchor}
                title={`${item.label} — ${item.title}`}
                className={cn(
                  'flex items-baseline gap-2 rounded-md px-2.5 py-1.5 transition-colors',
                  active === item.anchor
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="shrink-0 font-medium">{item.label}</span>
                <span className="truncate text-[13px] opacity-80">{item.title}</span>
              </a>
            </li>
          ) : (
            <li key={item.anchor} className="mt-1.5">
              <a
                href={`#${item.anchor}`}
                title={item.title}
                className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <span className="truncate">{item.title}</span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {item.solved}/{item.total}
                </span>
              </a>
              <ul className="ml-4 flex flex-col gap-0.5 border-l pl-1.5">
                {item.children.map((child) => (
                  <li key={child.anchor}>
                    <a
                      href={`#${child.anchor}`}
                      data-anchor={child.anchor}
                      title={`${child.label} — ${child.title}`}
                      className={cn(
                        'flex items-baseline gap-2 rounded-md px-2 py-1 transition-colors',
                        active === child.anchor
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span className="shrink-0 text-xs font-medium">{child.label}</span>
                      <span className="truncate text-[13px] opacity-80">{child.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}
