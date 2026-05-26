'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CITIES, type City } from '@naqla/shared-utils';

interface CitiesState {
  cities: City[];
  addCity: (input: Omit<City, 'id'>) => void;
  updateCity: (id: string, patch: Partial<Omit<City, 'id'>>) => void;
  removeCity: (id: string) => void;
  toggleActive: (id: string) => void;
  resetToDefaults: () => void;
}

const nextId = () =>
  `CITY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

export const useCitiesStore = create<CitiesState>()(
  persist(
    (set) => ({
      cities: DEFAULT_CITIES,

      addCity: (input) =>
        set((s) => ({ cities: [...s.cities, { id: nextId(), ...input }] })),

      updateCity: (id, patch) =>
        set((s) => ({ cities: s.cities.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      removeCity: (id) =>
        set((s) => ({ cities: s.cities.filter((c) => c.id !== id) })),

      toggleActive: (id) =>
        set((s) => ({
          cities: s.cities.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
        })),

      resetToDefaults: () => set({ cities: DEFAULT_CITIES }),
    }),
    { name: 'nitaq-admin-cities' },
  ),
);
