import React from 'react';
import {Modal, Platform} from 'react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {
  StreakCelebrationProvider,
  useStreakCelebration,
} from '../../src/components/features/streak/StreakCelebrationProvider';

jest.mock('../../src/hooks/useStreak', () => ({useWorkoutDates: () => []}));
jest.mock('../../src/services/workoutReminder', () => ({
  requestNotificationPermission: jest.fn(),
}));
jest.mock('../../src/components/ui/Icon', () => ({Icon: () => null}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
}));

it('iOS에서 축하 모달이 닫힌 뒤 다음 화면을 열 수 있다', async () => {
  const originalOS = Platform.OS;
  Platform.OS = 'ios';
  const client = new QueryClient();
  let renderer: ReactTestRenderer | undefined;
  let celebrateThen!: ReturnType<typeof useStreakCelebration>['celebrateThen'];
  const next = jest.fn();

  function Probe() {
    ({celebrateThen} = useStreakCelebration());
    return null;
  }

  try {
    act(() => {
      renderer = create(
        <QueryClientProvider client={client}>
          <StreakCelebrationProvider>
            <Probe />
          </StreakCelebrationProvider>
        </QueryClientProvider>,
      );
    });
    await act(async () => celebrateThen(next));

    const modal = renderer!.root.findByType(Modal);
    expect(modal.props.visible).toBe(true);

    act(() => modal.props.onRequestClose());
    expect(modal.props.visible).toBe(false);
    expect(next).not.toHaveBeenCalled();

    act(() => modal.props.onDismiss());
    expect(next).toHaveBeenCalledTimes(1);
  } finally {
    act(() => renderer?.unmount());
    client.clear();
    Platform.OS = originalOS;
  }
});
