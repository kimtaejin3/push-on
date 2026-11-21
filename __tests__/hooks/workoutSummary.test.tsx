import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import ReactTestRenderer from 'react-test-renderer';
import WorkoutSummary from '../../src/components/features/workout/WorkoutSummary';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
jest.mock('../../src/hooks/useSession', () => ({
  useSession: () => ({user: {id: 'athlete'}}),
}));
const mockPrevious = jest.fn();
const mockBest = jest.fn();
jest.mock('../../src/remote/workoutHistory', () => ({
  getPreviousWorkoutTotal: (...args: unknown[]) => mockPrevious(...args),
  getBestSetBefore: (...args: unknown[]) => mockBest(...args),
}));
jest.mock('../../src/components/ui/Icon', () => ({
  Icon: () => null,
}));
// 결과 화면의 광고 자리는 네이티브 모듈이 필요하다 → 이 테스트에서는 비운다
jest.mock('../../src/constants/ads', () => ({NATIVE_RESULT_AD_UNIT_ID: 'test'}));
jest.mock('../../src/hooks/useAds', () => ({
  useAds: () => ({prepareInterstitial: () => {}}),
}));
jest.mock('../../src/components/ads/NativeAdCard', () => ({
  NativeAdCard: () => null,
}));

const BEFORE = '2026-11-21T11:00:00.000Z';

const render = async (onHistory = jest.fn()) => {
  const client = new QueryClient({defaultOptions: {queries: {gcTime: Infinity, retry: false}}});
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <QueryClientProvider client={client}>
        <WorkoutSummary
          plan={{sets: [14, 16, 12, 12, 8], restSeconds: 60, lastIsMax: true}}
          results={[14, 16, 12, 12, 10]}
          totalSeconds={32}
          beforeIso={BEFORE}
          onDone={jest.fn()}
          onHistory={onHistory}
        />
      </QueryClientProvider>,
    );
  });
  // 지난번·한 세트 최고 조회가 끝날 때까지 기다린다
  await ReactTestRenderer.act(() => new Promise<void>(resolve => setTimeout(resolve, 0)));
  const text = tree.root
    .findAll(node => typeof node.type === 'string' && typeof node.props.children !== 'object')
    .map(node => String(node.props.children ?? ''))
    .join('|');
  const cleanup = async () => {
    await ReactTestRenderer.act(() => tree.unmount());
    client.clear();
  };
  return {tree, text, cleanup};
};

beforeEach(() => {
  mockPrevious.mockReset();
  mockBest.mockReset();
});

it('지난번 대비·마지막 세트·한 세트 최고를 보여주고 기록으로 이동할 수 있다', async () => {
  mockPrevious.mockResolvedValue(58);
  mockBest.mockResolvedValue(15);
  const onHistory = jest.fn();
  const {tree, text, cleanup} = await render(onHistory);
  // 운동을 시작한 시각 이전 기록과 비교한다
  expect(mockPrevious).toHaveBeenCalledWith('sets', BEFORE);
  expect(mockBest).toHaveBeenCalledWith(BEFORE, undefined);
  expect(text).toContain('목표 62개보다 2개 더 했어요');
  expect(text).toContain('58개 → +6');
  expect(text).toContain('10개 · +2');
  expect(text).toContain('16개 · 이전 15');
  const history = tree.root
    .findAll(node => typeof node.type === 'string' && node.props.accessibilityLabel === '기록에서 보기')
    .at(-1);
  expect(history).toBeDefined();
  await ReactTestRenderer.act(() => history?.props.onClick({}));
  expect(onHistory).toHaveBeenCalledTimes(1);
  await cleanup();
});

it('첫 기록이면 지난번 행을 빼고 첫 기록 칩을 보여준다', async () => {
  mockPrevious.mockResolvedValue(null);
  mockBest.mockResolvedValue(null);
  const {text, cleanup} = await render();
  expect(text).toContain('첫 기록');
  expect(text).not.toContain('지난번 대비');
  expect(text).toContain('한 세트 최고');
  await cleanup();
});

it('조회에 실패하면 그 행을 뺀다', async () => {
  mockPrevious.mockRejectedValue(new Error('offline'));
  mockBest.mockRejectedValue(new Error('offline'));
  const {text, cleanup} = await render();
  expect(text).not.toContain('지난번 대비');
  expect(text).not.toContain('한 세트 최고');
  expect(text).not.toContain('첫 기록');
  expect(text).toContain('걸린 시간');
  await cleanup();
});
