import AsyncStorage from '@react-native-async-storage/async-storage';
import type {SavePushupSessionData} from '../remote/pushup';

/**
 * 서버 저장에 실패해 폰에 보관 중인 운동 하나.
 * 다시 보낼 때 원래 운동한 날짜·시각을 그대로 써야 스트릭 하루를 잃지 않고,
 * created_at 으로 "첫 시도가 사실은 성공했는지"를 확인해 중복 기록을 막는다.
 */
export type PendingSave = {
  userId: string; // 다른 계정으로 로그인했을 때 남의 계정으로 보내지 않도록
  workout_date: string;
  created_at: string;
  data: SavePushupSessionData;
};

const STORAGE_KEY = 'pending-workout-saves';

export const loadPendingSaves = async (): Promise<PendingSave[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// 읽고-고쳐-쓰기가 겹치면(세트 저장 실패와 재전송 정리가 동시에) 한쪽 변경이 사라지므로 차례로 실행한다
let queue: Promise<unknown> = Promise.resolve();
const update = (change: (items: PendingSave[]) => PendingSave[]): Promise<void> => {
  const next = queue.then(async () => {
    const items = await loadPendingSaves();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(change(items)));
  });
  queue = next.catch(() => {});
  return next;
};

export const addPendingSave = (item: PendingSave): Promise<void> =>
  update(items => [...items, item]);

export const removePendingSave = (createdAt: string): Promise<void> =>
  update(items => items.filter(i => i.created_at !== createdAt));
