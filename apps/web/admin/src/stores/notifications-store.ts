'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_NOTIFICATION_TEMPLATES, DEFAULT_PROVIDERS_CONFIG,
  type NotificationTemplate, type ProvidersConfig,
} from '@naqla/shared-utils';

interface NotificationsState {
  providers: ProvidersConfig;
  templates: NotificationTemplate[];

  // Provider config
  updateEmailProvider: (patch: Partial<ProvidersConfig['email']>) => void;
  updateSmsProvider: (patch: Partial<ProvidersConfig['sms']>) => void;
  updateGeneral: (patch: Partial<ProvidersConfig['general']>) => void;
  resetProviders: () => void;

  // Templates
  updateTemplate: (id: string, patch: Partial<NotificationTemplate>) => void;
  toggleTemplate: (id: string, enabled: boolean) => void;
  toggleChannel: (id: string, channel: 'email' | 'sms' | 'inApp', enabled: boolean) => void;
  updateChannelContent: (
    id: string,
    channel: 'email' | 'sms' | 'inApp',
    patch: { subject?: string; body?: string },
  ) => void;
  resetTemplate: (id: string) => void;
  resetAllTemplates: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      providers: DEFAULT_PROVIDERS_CONFIG,
      templates: DEFAULT_NOTIFICATION_TEMPLATES,

      updateEmailProvider: (patch) =>
        set((s) => ({ providers: { ...s.providers, email: { ...s.providers.email, ...patch } } })),
      updateSmsProvider: (patch) =>
        set((s) => ({ providers: { ...s.providers, sms: { ...s.providers.sms, ...patch } } })),
      updateGeneral: (patch) =>
        set((s) => ({ providers: { ...s.providers, general: { ...s.providers.general, ...patch } } })),
      resetProviders: () => set({ providers: DEFAULT_PROVIDERS_CONFIG }),

      updateTemplate: (id, patch) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      toggleTemplate: (id, enabled) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, enabled } : t)),
        })),
      toggleChannel: (id, channel, enabled) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id
              ? { ...t, channels: { ...t.channels, [channel]: { ...t.channels[channel], enabled } } }
              : t,
          ),
        })),
      updateChannelContent: (id, channel, patch) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id
              ? { ...t, channels: { ...t.channels, [channel]: { ...t.channels[channel], ...patch } } }
              : t,
          ),
        })),
      resetTemplate: (id) =>
        set((s) => {
          const original = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.id === id);
          if (!original) return s;
          return { templates: s.templates.map((t) => (t.id === id ? original : t)) };
        }),
      resetAllTemplates: () => set({ templates: DEFAULT_NOTIFICATION_TEMPLATES }),
    }),
    { name: 'nitaq:notifications-config' },
  ),
);
