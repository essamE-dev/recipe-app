import { openDB } from "idb";
import type { Meal } from "@/lib/api";

const DB_NAME = "recipes-pwa-db";
const STORE_NAME = "favorites";
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "idMeal" });
    }
  }
});

export const saveFavorite = async (meal: Meal): Promise<void> => {
  const db = await dbPromise;
  await db.put(STORE_NAME, { ...meal, savedAt: String(Date.now()) });
};

export const removeFavorite = async (id: string): Promise<void> => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
};

export const getFavorite = async (id: string): Promise<Meal | undefined> => {
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
};

export const getAllFavorites = async (): Promise<Meal[]> => {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
};
