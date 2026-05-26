/**
 * Adapters between the live API response shape (mirroring `Prisma.Order` etc.)
 * and the mock-data shape that the UI was written against. The mock shape is
 * the SoT for components — backend responses are normalized into it so pages
 * don't crash when a field is named differently or returned as a relation.
 *
 * Why a normalizer here (not a backend rename)?
 *   • The Prisma schema is mature and aligns with SQL conventions (e.g.
 *     `weight` not `weightKg`).
 *   • Mock data + a dozen pages already standardized on shorter names.
 *   • A thin frontend adapter is cheaper than refactoring 30+ files.
 */

import type { Order, Bid } from './mock-data';

/**
 * Live API order — a superset/variant of the mock `Order` with Prisma-style
 * field names and embedded relations from `findById()`'s `include` clause.
 * Kept loose (`Partial<...> & Record<...>`) so we accept whatever the
 * backend returns without TS noise.
 */
interface ApiOrder {
  // Prisma-style field names that differ from the mock:
  weight?: number;
  requiredTruckType?: string;
  // API still uses carrier* field names — mapped to provider* in normalized shape
  carrierId?: string;
  carrierAmount?: number;
  carrierRating?: number;
  carrier?: unknown;
  // Optional relations / aggregations:
  _count?: { bids?: number };
  bids?: Bid[];
  // Pass-through fields (same name in mock + API):
  [key: string]: unknown;
}

/**
 * Maps a single live API order into the mock Order shape. Idempotent — if you
 * pass it an already-normalized object, the aliased keys are simply re-set.
 *
 * Also normalizes the embedded `bids` relation (Prisma field `amount` →
 * mock `price`) so the bid comparison UI doesn't need to know whether the
 * data came from API or mock.
 *
 * Returns `null` (not undefined) for falsy input so the caller can write
 * `normalizeOrder(data) ?? fallback` without an extra guard.
 */
export function normalizeOrder(input: ApiOrder | Order | null | undefined): Order | null {
  if (!input) return null;
  const o = input as ApiOrder & Partial<Order>;
  const bids = Array.isArray(o.bids)
    ? (o.bids as unknown[]).map((b) => normalizeBid(b as Record<string, unknown>))
    : undefined;
  return {
    ...(o as object),
    weightKg: (o.weight ?? o.weightKg ?? 0) as number,
    truckType: (o.requiredTruckType ?? o.truckType ?? '') as string,
    bidCount: (o._count?.bids ?? o.bidCount ?? (Array.isArray(o.bids) ? o.bids.length : 0)) as number,
    // Normalize carrier* → provider* (API uses old names; UI uses new names)
    carrierId: (o.carrierId ?? o.providerId ?? null) as string | null,
    providerId: (o.providerId ?? o.carrierId ?? null) as string | null,
    carrierAmount: (o.carrierAmount ?? o.providerAmount ?? null) as number | null,
    providerAmount: (o.providerAmount ?? o.carrierAmount ?? null) as number | null,
    carrierRating: (o.carrierRating ?? o.providerRating ?? null) as number | null,
    providerRating: (o.providerRating ?? o.carrierRating ?? null) as number | null,
    carrier: (o.carrier ?? o.provider ?? null) as unknown,
    provider: (o.provider ?? o.carrier ?? null) as unknown,
    ...(bids ? { bids } : {}),
  } as unknown as Order;
}

/**
 * Maps an API Bid (Prisma shape: `amount`, etc.) into the mock Bid shape
 * (`price`). Other field names already align between API + mock.
 */
export function normalizeBid<T extends Record<string, unknown>>(input: T): T & { price: number; amount: number } {
  const b = input as Record<string, unknown>;
  const amount = (b.amount as number | undefined) ?? (b.price as number | undefined) ?? 0;
  return {
    ...b,
    price: amount,
    amount,
  } as T & { price: number; amount: number };
}

/**
 * Maps a list-API response into an array of normalized orders. Handles all
 * the response wrappers the API returns:
 *   • plain array `[...]`
 *   • paginated `{ items: [...], total }`
 *   • envelope `{ success, data: [...] }` (the SWR fetcher unwraps this layer
 *     already, but we accept it here for safety)
 */
export function normalizeOrderList(input: unknown): Order[] {
  if (!input) return [];
  const arr = Array.isArray(input)
    ? input
    : Array.isArray((input as { items?: unknown[] }).items)
      ? (input as { items: unknown[] }).items
      : Array.isArray((input as { data?: unknown[] }).data)
        ? (input as { data: unknown[] }).data
        : [];
  return (arr as ApiOrder[])
    .map((o) => normalizeOrder(o))
    .filter((o): o is Order => o !== null);
}

/**
 * Unwrap whatever envelope the list endpoint chose (plain array, `{items}`,
 * or `{data}`). Used by the truck + payment normalizers (same wrappers).
 */
function unwrapList(input: unknown): unknown[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  const items = (input as { items?: unknown[] }).items;
  if (Array.isArray(items)) return items;
  const data = (input as { data?: unknown[] }).data;
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Maps an API Service (Prisma fields: `type` / `capacity` / `year`) into the
 * mock Service shape used by the provider fleet UI (`serviceType` / `capacityKg` /
 * `modelYear`). Capacity unit: backend stores tons in `capacity`, but the
 * mock + UI assume kg via `capacityKg`. We compute both so the UI works
 * regardless of which field it reads.
 *
 * Idempotent — re-running on an already-normalized object keeps the mock keys.
 */
export function normalizeService<T extends object>(input: T | null | undefined): T | null {
  if (!input) return null;
  const t = input as Record<string, unknown>;
  const capacityTons = (t.capacity as number | undefined)
    ?? ((t.capacityKg as number | undefined) ? ((t.capacityKg as number) / 1000) : undefined);
  const capacityKg = (t.capacityKg as number | undefined)
    ?? ((t.capacity as number | undefined) != null ? ((t.capacity as number) * 1000) : 0);
  return {
    ...t,
    serviceType: (t.serviceType as string | undefined) ?? (t.truckType as string | undefined) ?? (t.type as string | undefined) ?? '',
    truckType: (t.truckType as string | undefined) ?? (t.type as string | undefined) ?? '',
    serviceCode: (t.serviceCode as string | undefined) ?? (t.plateNumber as string | undefined) ?? '',
    capacityKg,
    capacity: capacityTons ?? 0,
    modelYear: (t.modelYear as number | undefined) ?? (t.year as number | undefined) ?? 0,
    status: (t.status as string | undefined) ?? 'AVAILABLE',
  } as unknown as T;
}
/** @deprecated use normalizeService */
export const normalizeTruck = normalizeService;

export function normalizeServiceList<T extends object>(input: unknown): T[] {
  return unwrapList(input)
    .map((t) => normalizeService(t as T))
    .filter((t): t is T => t !== null);
}
/** @deprecated use normalizeServiceList */
export const normalizeTruckList = normalizeServiceList;

/**
 * Maps an API Payment (Prisma fields: `status` / `totalAmount` /
 * `commissionAmount` / `carrierAmount`) into the normalized Payment shape (`state`
 * / `amount` / `commission` / `vat` / `providerAmount`). API has no VAT field —
 * we default to 0 to prevent `NaN` in `.toLocaleString()` math downstream.
 */
export function normalizePayment<T extends object>(input: T | null | undefined): T | null {
  if (!input) return null;
  const p = input as Record<string, unknown>;
  const amount = (p.amount as number | undefined) ?? (p.totalAmount as number | undefined) ?? 0;
  const commission =
    (p.commission as number | undefined) ?? (p.commissionAmount as number | undefined) ?? 0;
  const providerAmount = (p.providerAmount as number | undefined) ?? (p.carrierAmount as number | undefined) ?? (amount - commission);
  return {
    ...p,
    state: (p.state as string | undefined) ?? (p.status as string | undefined) ?? 'PENDING',
    amount,
    totalAmount: amount,
    commission,
    commissionAmount: commission,
    vat: (p.vat as number | undefined) ?? 0,
    providerAmount,
    carrierAmount: providerAmount,
    paidAt: p.paidAt ?? p.heldAt ?? p.createdAt ?? null,
  } as unknown as T;
}

export function normalizePaymentList<T extends object>(input: unknown): T[] {
  return unwrapList(input)
    .map((p) => normalizePayment(p as T))
    .filter((p): p is T => p !== null);
}
