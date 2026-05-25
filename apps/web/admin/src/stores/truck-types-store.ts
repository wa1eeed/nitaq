'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_TRUCK_TYPES, type TruckTypeOption } from '@naqla/shared-utils';

interface TruckTypesState {
  types: TruckTypeOption[];

  addType: (input: Omit<TruckTypeOption, 'id'> & { id?: string }) => void;
  updateType: (id: string, patch: Partial<Omit<TruckTypeOption, 'id'>>) => void;
  removeType: (id: string) => void;
  toggleActive: (id: string, active: boolean) => void;
  resetToDefaults: () => void;
}

const slug = (s: string) =>
  s.toUpperCase().replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)
  + '_' + Math.random().toString(36).slice(2, 6).toUpperCase();

export const useTruckTypesStore = create<TruckTypesState>()(
  persist(
    (set) => ({
      types: DEFAULT_TRUCK_TYPES,

      addType: ({ id, nameAr, nameEn, capacityKg, description, imageUrl, icon, active }) =>
        set((s) => ({
          types: [
            ...s.types,
            {
              id: id ?? slug(nameEn || nameAr),
              nameAr, nameEn, capacityKg, description, imageUrl, icon, active,
            },
          ],
        })),

      updateType: (id, patch) =>
        set((s) => ({
          types: s.types.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeType: (id) =>
        set((s) => ({ types: s.types.filter((t) => t.id !== id) })),

      toggleActive: (id, active) =>
        set((s) => ({ types: s.types.map((t) => (t.id === id ? { ...t, active } : t)) })),

      resetToDefaults: () => set({ types: DEFAULT_TRUCK_TYPES }),
    }),
    {
      name: 'naqla:truck-types',
      // Bump version when default seed changes so users get fresh images
      version: 2,
      migrate: (_persisted, _v) => ({ types: DEFAULT_TRUCK_TYPES }),
    },
  ),
);
