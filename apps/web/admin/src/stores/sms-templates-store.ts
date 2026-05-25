'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SMS_TEMPLATES, type SmsTemplate } from '@naqla/shared-utils';

interface SmsTemplatesState {
  templates: SmsTemplate[];
  addTemplate: (input: Omit<SmsTemplate, 'id'>) => void;
  updateTemplate: (id: string, patch: Partial<Omit<SmsTemplate, 'id'>>) => void;
  removeTemplate: (id: string) => void;
  toggleActive: (id: string) => void;
  resetToDefaults: () => void;
}

const nextId = () =>
  `TMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

export const useSmsTemplatesStore = create<SmsTemplatesState>()(
  persist(
    (set) => ({
      templates: DEFAULT_SMS_TEMPLATES,

      addTemplate: (input) =>
        set((s) => ({ templates: [...s.templates, { id: nextId(), ...input }] })),

      updateTemplate: (id, patch) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      removeTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      toggleActive: (id) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
        })),

      resetToDefaults: () => set({ templates: DEFAULT_SMS_TEMPLATES }),
    }),
    { name: 'naqla-admin-sms-templates' },
  ),
);
