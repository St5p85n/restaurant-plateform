import { openDB, type IDBPDatabase } from 'idb';
import type { Restaurant, MenuItem, MenuCategory } from '@/types';

const DB_NAME = 'restaumanager-offline';
const DB_VERSION = 1;

export interface CachedRestaurant extends Restaurant {
  cachedAt: number;
}

export interface CachedMenu {
  restaurantId: string;
  categories: MenuCategory[];
  items: MenuItem[];
  cachedAt: number;
}

// Durée de validité du cache : 7 jours
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < CACHE_TTL;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('restaurants')) {
          db.createObjectStore('restaurants', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('menus')) {
          db.createObjectStore('menus', { keyPath: 'restaurantId' });
        }
      },
    });
  }
  return dbPromise;
}

// ── Restaurants ──────────────────────────────────────────────

export async function saveRestaurants(restaurants: Restaurant[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('restaurants', 'readwrite');
  const now = Date.now();
  await Promise.all(
    restaurants.map((r) => tx.store.put({ ...r, cachedAt: now }))
  );
  await tx.done;
}

export async function getCachedRestaurants(): Promise<CachedRestaurant[]> {
  const db = await getDB();
  const all = await db.getAll('restaurants') as CachedRestaurant[];
  return all.filter((r) => isFresh(r.cachedAt));
}

export async function getCachedRestaurantById(id: string): Promise<CachedRestaurant | null> {
  const db = await getDB();
  const r = await db.get('restaurants', id) as CachedRestaurant | undefined;
  if (!r || !isFresh(r.cachedAt)) return null;
  return r;
}

// ── Menus ─────────────────────────────────────────────────────

export async function saveMenu(
  restaurantId: string,
  categories: MenuCategory[],
  items: MenuItem[]
): Promise<void> {
  const db = await getDB();
  const entry: CachedMenu = {
    restaurantId,
    categories,
    items,
    cachedAt: Date.now(),
  };
  await db.put('menus', entry);
}

export async function getCachedMenu(restaurantId: string): Promise<CachedMenu | null> {
  const db = await getDB();
  const m = await db.get('menus', restaurantId) as CachedMenu | undefined;
  if (!m || !isFresh(m.cachedAt)) return null;
  return m;
}

// ── Stats du cache ─────────────────────────────────────────────

export async function getCacheStats(): Promise<{ restaurants: number; menus: number }> {
  const db = await getDB();
  const [rAll, mAll] = await Promise.all([
    db.getAll('restaurants') as Promise<CachedRestaurant[]>,
    db.getAll('menus') as Promise<CachedMenu[]>,
  ]);
  return {
    restaurants: rAll.filter((r) => isFresh(r.cachedAt)).length,
    menus: mAll.filter((m) => isFresh(m.cachedAt)).length,
  };
}

// ── Nettoyage des entrées expirées ─────────────────────────────

export async function pruneExpired(): Promise<void> {
  const db = await getDB();

  const rTx = db.transaction('restaurants', 'readwrite');
  const allR = await rTx.store.getAll() as CachedRestaurant[];
  await Promise.all(
    allR.filter((r) => !isFresh(r.cachedAt)).map((r) => rTx.store.delete(r.id))
  );
  await rTx.done;

  const mTx = db.transaction('menus', 'readwrite');
  const allM = await mTx.store.getAll() as CachedMenu[];
  await Promise.all(
    allM.filter((m) => !isFresh(m.cachedAt)).map((m) => mTx.store.delete(m.restaurantId))
  );
  await mTx.done;
}
