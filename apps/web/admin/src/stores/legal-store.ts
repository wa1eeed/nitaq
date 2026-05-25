'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_LEGAL_DOCS, DEFAULT_SEO_CONFIG,
  type LegalDocId, type LegalDocument, type SeoConfig,
} from '@naqla/shared-utils';

interface LegalState {
  docs: Record<LegalDocId, LegalDocument>;
  seo: SeoConfig;

  saveDraft: (id: LegalDocId, content: string) => void;
  publish: (id: LegalDocId) => void;
  discardDraft: (id: LegalDocId) => void;
  resetDoc: (id: LegalDocId) => void;

  updateSeo: (patch: Partial<SeoConfig>) => void;
  resetSeo: () => void;
}

const bumpVersion = (v: string) => {
  const parts = v.split('.').map(Number);
  parts[parts.length - 1] = (parts[parts.length - 1] ?? 0) + 1;
  return parts.join('.');
};

export const useLegalStore = create<LegalState>()(
  persist(
    (set) => ({
      docs: DEFAULT_LEGAL_DOCS,
      seo: DEFAULT_SEO_CONFIG,

      saveDraft: (id, content) =>
        set((s) => ({
          docs: {
            ...s.docs,
            [id]: { ...s.docs[id], draftContent: content, draftUpdatedAt: new Date().toISOString() },
          },
        })),

      publish: (id) =>
        set((s) => {
          const doc = s.docs[id];
          if (!doc.draftContent) return s;
          return {
            docs: {
              ...s.docs,
              [id]: {
                ...doc,
                content: doc.draftContent,
                version: bumpVersion(doc.version),
                publishedAt: new Date().toISOString(),
                draftContent: undefined,
                draftUpdatedAt: undefined,
              },
            },
          };
        }),

      discardDraft: (id) =>
        set((s) => ({
          docs: {
            ...s.docs,
            [id]: { ...s.docs[id], draftContent: undefined, draftUpdatedAt: undefined },
          },
        })),

      resetDoc: (id) =>
        set((s) => ({ docs: { ...s.docs, [id]: DEFAULT_LEGAL_DOCS[id] } })),

      updateSeo: (patch) => set((s) => ({ seo: { ...s.seo, ...patch } })),
      resetSeo: () => set({ seo: DEFAULT_SEO_CONFIG }),
    }),
    { name: 'naqla:legal-config' },
  ),
);
