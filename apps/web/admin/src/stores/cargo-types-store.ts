'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CARGO_TYPES, type CargoTypeDef } from '@naqla/shared-utils';

interface CargoTypesState {
  cargoTypes: CargoTypeDef[];
  addType: (input: Omit<CargoTypeDef, 'id'>) => void;
  updateType: (id: string, patch: Partial<Omit<CargoTypeDef, 'id'>>) => void;
  removeType: (id: string) => void;
  toggleActive: (id: string) => void;
  resetToDefaults: () => void;
}

const nextId = () =>
  `CT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

export const useCargoTypesStore = create<CargoTypesState>()(
  persist(
    (set) => ({
      cargoTypes: DEFAULT_CARGO_TYPES,

      addType: (input) =>
        set((s) => ({ cargoTypes: [...s.cargoTypes, { id: nextId(), ...input }] })),

      updateType: (id, patch) =>
        set((s) => ({ cargoTypes: s.cargoTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      removeType: (id) =>
        set((s) => ({ cargoTypes: s.cargoTypes.filter((t) => t.id !== id) })),

      toggleActive: (id) =>
        set((s) => ({
          cargoTypes: s.cargoTypes.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
        })),

      resetToDefaults: () => set({ cargoTypes: DEFAULT_CARGO_TYPES }),
    }),
    { name: 'nitaq-admin-cargo-types' },
  ),
);
