import * as SQLite from 'expo-sqlite';
import { CompressedImage } from './imageCompression';

interface OfflinePOD {
  id?: number;
  booking_id: number;
  miles_ref: string;
  photos: CompressedImage[];
  client_name: string;
  id_card: string;
  signature_base64: string;
  delivered_date: string;
  delivered_time: string;
  status_id: number;
  created_at: string;
}

let db: SQLite.SQLiteDatabase | null = null;

const getDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('offline_pods.db');
  }
  return db;
};

export const initOfflineQueue = async () => {
  const database = await getDatabase();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_pods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      miles_ref TEXT NOT NULL,
      photos TEXT NOT NULL,
      client_name TEXT NOT NULL,
      id_card TEXT NOT NULL,
      signature_base64 TEXT NOT NULL,
      delivered_date TEXT NOT NULL,
      delivered_time TEXT NOT NULL,
      status_id INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
};

export const addToOfflineQueue = async (pod: OfflinePOD): Promise<number> => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO offline_pods 
    (booking_id, miles_ref, photos, client_name, id_card, signature_base64, delivered_date, delivered_time, status_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pod.booking_id,
      pod.miles_ref,
      JSON.stringify(pod.photos),
      pod.client_name,
      pod.id_card,
      pod.signature_base64,
      pod.delivered_date,
      pod.delivered_time,
      pod.status_id,
      pod.created_at
    ]
  );
  return result.lastInsertRowId;
};

export const getOfflineQueue = async (): Promise<OfflinePOD[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM offline_pods ORDER BY created_at ASC');
  return rows.map(row => ({
    ...row,
    photos: JSON.parse(row.photos)
  }));
};

export const removeFromOfflineQueue = async (id: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM offline_pods WHERE id = ?', [id]);
};

export const clearOfflineQueue = async (): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM offline_pods');
};

export const getOfflineQueueCount = async (): Promise<number> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM offline_pods');
  return result?.count || 0;
};