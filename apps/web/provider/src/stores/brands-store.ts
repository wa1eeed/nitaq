'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_BRANDS, type TruckBrand, type TruckModel } from '@naqla/shared-utils';

interface BrandsState {
  brands: TruckBrand[];
  // Brand CRUD
  addBrand: (input: { nameAr: string; nameEn?: string }) => void;
  updateBrand: (id: string, patch: Partial<Pick<TruckBrand, 'nameAr' | 'nameEn'>>) => void;
  removeBrand: (id: string) => void;
  // Model CRUD (scoped under a brand)
  addModel: (brandId: string, name: string) => void;
  updateModel: (brandId: string, modelId: string, name: string) => void;
  removeModel: (brandId: string, modelId: string) => void;
  // Reset seed
  resetToDefaults: () => void;
}

const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const useBrandsStore = create<BrandsState>()(
  persist(
    (set) => ({
      brands: DEFAULT_BRANDS,

      addBrand: ({ nameAr, nameEn }) =>
        set((s) => ({
          brands: [...s.brands, { id: nextId('BR'), nameAr, nameEn, models: [] }],
        })),

      updateBrand: (id, patch) =>
        set((s) => ({
          brands: s.brands.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      removeBrand: (id) =>
        set((s) => ({ brands: s.brands.filter((b) => b.id !== id) })),

      addModel: (brandId, name) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId
              ? { ...b, models: [...b.models, { id: nextId('M'), name }] }
              : b,
          ),
        })),

      updateModel: (brandId, modelId, name) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  models: b.models.map((m: TruckModel) =>
                    m.id === modelId ? { ...m, name } : m,
                  ),
                }
              : b,
          ),
        })),

      removeModel: (brandId, modelId) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === brandId
              ? { ...b, models: b.models.filter((m) => m.id !== modelId) }
              : b,
          ),
        })),

      resetToDefaults: () => set({ brands: DEFAULT_BRANDS }),
    }),
    { name: 'nitaq:truck-brands' },
  ),
);
