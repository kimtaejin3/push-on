import React from 'react';
import {act, create} from 'react-test-renderer';
import {useReminderSync} from '../../src/hooks/useReminderSync';
import {loadReminderSettings} from '../../src/utils/reminder';
import {syncWorkoutReminders} from '../../src/services/workoutReminder';

jest.mock('../../src/utils/reminder', () => ({loadReminderSettings: jest.fn()}));
jest.mock('../../src/services/workoutReminder', () => ({syncWorkoutReminders: jest.fn()}));

const mockLoad = loadReminderSettings as jest.Mock;
const mockSync = syncWorkoutReminders as jest.Mock;

const enabled = {enabled: true, days: [1, 3, 5], hour: 20, minute: 0};

async function renderHook() {
  function Probe() {
    useReminderSync();
    return null;
  }
  await act(async () => {
    create(<Probe />);
  });
}

describe('useReminderSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSync.mockResolvedValue(undefined);
  });

  it('알림이 켜져 있으면 앱 시작 시 예약을 다시 건다', async () => {
    mockLoad.mockResolvedValue(enabled);
    await renderHook();
    expect(mockSync).toHaveBeenCalledWith(enabled);
  });

  it('꺼져 있으면 아무것도 하지 않는다', async () => {
    mockLoad.mockResolvedValue({...enabled, enabled: false});
    await renderHook();
    expect(mockSync).not.toHaveBeenCalled();
  });

  it('재등록에 실패해도 앱은 계속 동작한다', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockLoad.mockResolvedValue(enabled);
    mockSync.mockRejectedValue(new Error('notifee 없음'));
    await expect(renderHook()).resolves.toBeUndefined();
  });
});
