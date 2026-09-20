'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { TagInfo } from '@/lib/tags';
import { ManageTagsDialog } from './ManageTagsDialog';

type TagsContextValue = { tags: TagInfo[]; openManage: () => void };

// All tags, passed once from the server so each roadmap row doesn't carry its own copy. It also
// hosts the one "Manage tags" dialog, outside every popover: a dialog rendered inside a popover
// would count as an outside click and close the popover (and itself) underneath.
const TagsContext = createContext<TagsContextValue>({ tags: [], openManage: () => {} });

export function TagsProvider({ tags, children }: { tags: TagInfo[]; children: ReactNode }) {
  const [manageOpen, setManageOpen] = useState(false);
  const value = useMemo(() => ({ tags, openManage: () => setManageOpen(true) }), [tags]);

  return (
    <TagsContext.Provider value={value}>
      {children}
      <ManageTagsDialog tags={tags} open={manageOpen} onOpenChange={setManageOpen} />
    </TagsContext.Provider>
  );
}

export function useTags() {
  return useContext(TagsContext).tags;
}

export function useOpenManageTags() {
  return useContext(TagsContext).openManage;
}
