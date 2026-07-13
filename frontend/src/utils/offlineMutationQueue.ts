import AsyncStorage from '@react-native-async-storage/async-storage';
import { jaapApi } from '../api/services';

const QUEUE_KEY = '@offline_mutation_queue';

export interface RecordSessionPayload {
  category: string;
  rounds: number;
  totalBeads: number;
  duration: number;
  coinsEarned?: number;
  mantraId?: string;
  deityId?: string;
  completedAt?: string; // ISO timestamp of when session completed
}


export interface PendingMutation {
  id: string;
  type: 'recordSession';
  data: RecordSessionPayload;
  createdAt: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function addToQueue(data: RecordSessionPayload): Promise<PendingMutation> {
  const mutation: PendingMutation = {
    id: generateId(),
    type: 'recordSession',
    data,
    createdAt: new Date().toISOString(),
  };
  const queue = await getQueue();
  queue.push(mutation);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return mutation;
}

export async function getQueue(): Promise<PendingMutation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingMutation[];
  } catch {
    return [];
  }
}

async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((m) => m.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

/**
 * Process all pending mutations in the queue.
 * Returns { success: boolean, flushed: number } where flushed is the count
 * of mutations that were successfully sent to the server.
 */
export async function processQueue(): Promise<{ success: boolean; flushed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { success: true, flushed: 0 };

  let flushed = 0;
  for (const mutation of queue) {
    try {
      if (mutation.type === 'recordSession') {
        await jaapApi.recordSession(mutation.data);
      }
      await removeFromQueue(mutation.id);
      flushed++;
    } catch {
      // Stop processing on first failure — network likely still down
      return { success: false, flushed };
    }
  }
  return { success: true, flushed };
}

export async function getQueueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
