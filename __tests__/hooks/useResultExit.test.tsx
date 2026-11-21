import React from 'react';
import {Modal, Platform} from 'react-native';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {StackActions} from '@react-navigation/native';
import {
  AdExitFlowProvider,
  useResultExit,
  useTrackingPrePrompt,
  type ResultExit,
} from '../../src/components/features/ads/AdExitFlowProvider';
import {Button} from '../../src/components/ui/Button';
import {Text} from '../../src/components/ui/Text';
import {navigationRef} from '../../src/navigations/navigationRef';

const mockCelebrateThen = jest.fn((next: () => void) => next());
const mockToast = jest.fn();
const mockRecordWorkout = jest.fn<Promise<void>, []>();
const mockRecordTestDay = jest.fn<Promise<void>, []>();
const mockPrepare = jest.fn();
const mockWait = jest.fn<Promise<boolean>, [number]>();
const mockShow = jest.fn<Promise<void>, [unknown]>();
const mockConsent = jest.fn<Promise<void>, [() => Promise<void>]>();
const mockConsentDone = jest.fn();
const mockConfig = jest.fn();

jest.mock('../../src/components/features/streak/StreakCelebrationProvider', () => ({
  useStreakCelebration: () => ({celebrateThen: mockCelebrateThen}),
}));
jest.mock('../../src/components/ui/feedback/ToastProvider', () => ({
  useToast: () => ({show: mockToast}),
}));
jest.mock('../../src/components/ui/Icon', () => ({Icon: () => null}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));
jest.mock('../../src/hooks/useAds', () => ({
  useAds: () => ({recordWorkout: mockRecordWorkout, recordTestDay: mockRecordTestDay}),
  getLatestAdConfig: () => mockConfig(),
  prepareInterstitial: (...args: unknown[]) => mockPrepare(...args),
  waitInterstitialReady: (timeout: number) => mockWait(timeout),
  showPreparedInterstitial: (getConfig: unknown) => mockShow(getConfig),
}));
jest.mock('../../src/utils/adsConsent', () => ({
  isConsentFlowDone: () => mockConsentDone(),
  runConsentFlow: (prePrompt: () => Promise<void>) => mockConsent(prePrompt),
}));
jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: () => ({isReady: () => true, dispatch: jest.fn()}),
  StackActions: {popTo: (name: string, params: object) => ({type: 'POP_TO', name, params})},
}));

let renderer: ReactTestRenderer;
let exit: ReturnType<typeof useResultExit>;
let showPrePrompt: ReturnType<typeof useTrackingPrePrompt>;
const go = jest.fn();

function Probe() {
  exit = useResultExit();
  showPrePrompt = useTrackingPrePrompt();
  return null;
}

function leave(overrides: Partial<ResultExit> = {}) {
  exit({reps: 64, destination: 'Home', go, ...overrides});
}

const tick = (ms: number) => act(async () => jest.advanceTimersByTimeAsync(ms));
const savingText = (title: string) =>
  renderer.root.findAllByType(Text).find(node => node.props.children === title);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockConfig.mockReturnValue({adsEnabled: true});
  mockConsentDone.mockReturnValue(true);
  mockRecordWorkout.mockResolvedValue(undefined);
  mockRecordTestDay.mockResolvedValue(undefined);
  mockWait.mockResolvedValue(false);
  mockShow.mockResolvedValue(undefined);
  act(() => {
    renderer = create(
      <AdExitFlowProvider>
        <Probe />
      </AdExitFlowProvider>,
    );
  });
});

afterEach(() => {
  act(() => renderer.unmount());
  jest.useRealTimers();
});

it('광고 꺼짐이면 기다리지 않고 바로 이동하고 토스트를 띄운다', () => {
  mockConfig.mockReturnValue({adsEnabled: false});
  mockConsentDone.mockReturnValue(false);
  mockRecordWorkout.mockReturnValueOnce(new Promise(() => {}));

  act(() => leave());

  expect(go).toHaveBeenCalledTimes(1);
  expect(mockRecordWorkout).toHaveBeenCalledTimes(1);
  expect(mockConsent).not.toHaveBeenCalled();
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(savingText('오늘 기록 저장 중')).toBeUndefined();
  expect(mockToast).toHaveBeenCalledWith('64개 저장했어요 · 기록에서 볼 수 있어요', {
    action: {label: '보기', onPress: expect.any(Function)},
  });
  expect(go.mock.invocationCallOrder[0]).toBeLessThan(mockToast.mock.invocationCallOrder[0]);
  mockToast.mock.calls[0][1].action.onPress();
  expect(navigationRef.dispatch).toHaveBeenCalledWith(StackActions.popTo('Tabs', {screen: 'History'}));
});

it('첫 결과면 동의 흐름 → 저장 중 → 이동 순서', async () => {
  mockConsentDone.mockReturnValue(false);
  let finishConsent!: () => void;
  mockConsent.mockReturnValueOnce(new Promise(resolve => {finishConsent = resolve;}));

  await act(async () => leave({queued: true, detail: '3주차 Day 2'}));
  expect(mockConsent).toHaveBeenCalledWith(showPrePrompt);
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(savingText('오늘 기록 저장 대기')).toBeUndefined();
  expect(go).not.toHaveBeenCalled();

  await act(async () => finishConsent());
  expect(savingText('오늘 기록 저장 대기')).toBeDefined();
  expect(savingText('64개 · 3주차 Day 2')).toBeDefined();
  await tick(500);
  expect(go).toHaveBeenCalledTimes(1);
});

it('저장 중은 최소 500ms 동안 표시한다', async () => {
  await act(async () => leave());
  expect(savingText('오늘 기록 저장 중')).toBeDefined();
  await tick(499);
  expect(go).not.toHaveBeenCalled();
  await tick(1);
  expect(go).toHaveBeenCalledTimes(1);
  expect(savingText('오늘 기록 저장 중')).toBeUndefined();
});

it('준비가 늦으면 저장 중에서 최대 1000ms 기다린다', async () => {
  mockWait.mockImplementationOnce(timeout =>
    new Promise(resolve => setTimeout(() => resolve(false), timeout)),
  );
  await act(async () => leave());
  await tick(999);
  expect(go).not.toHaveBeenCalled();
  await tick(1);
  expect(go).toHaveBeenCalledTimes(1);
  expect(mockShow).not.toHaveBeenCalled();
});

it('준비됐으면 오버레이를 내리고 전면이 닫힌 뒤 이동한다', async () => {
  let closeAd!: () => void;
  mockWait.mockResolvedValueOnce(true);
  mockShow.mockReturnValueOnce(new Promise(resolve => {closeAd = resolve;}));

  await act(async () => leave());
  await tick(500);
  expect(savingText('오늘 기록 저장 중')).toBeUndefined();
  expect(mockShow).toHaveBeenCalledTimes(1);
  const configChanged = {adsEnabled: false};
  mockConfig.mockReturnValue(configChanged);
  const getConfig = mockShow.mock.calls[0][0] as () => unknown;
  expect(getConfig()).toBe(configChanged);
  expect(go).not.toHaveBeenCalled();
  await act(async () => closeAd());
  expect(go).toHaveBeenCalledTimes(1);
});

it('목적지가 기록이면 토스트를 띄우지 않는다', () => {
  mockConfig.mockReturnValue({adsEnabled: false});
  act(() => leave({destination: 'History'}));
  expect(go).toHaveBeenCalledTimes(1);
  expect(mockToast).not.toHaveBeenCalled();
});

it('test 면 전면 준비 전에 그날 테스트를 기록한다', async () => {
  await act(async () => leave({test: true}));
  expect(mockRecordTestDay).toHaveBeenCalledTimes(1);
  expect(mockRecordTestDay.mock.invocationCallOrder[0]).toBeLessThan(
    mockPrepare.mock.invocationCallOrder[0],
  );
  await tick(500);
});

it('축하 화면 대기 중이나 전면을 준비하는 동안 다시 부르면 무시한다', async () => {
  let continueCelebration!: () => void;
  mockCelebrateThen.mockImplementationOnce(next => {continueCelebration = next;});
  const secondGo = jest.fn();
  act(() => {
    leave();
    leave({destination: 'History', go: secondGo});
  });
  expect(mockCelebrateThen).toHaveBeenCalledTimes(1);
  expect(mockRecordWorkout).not.toHaveBeenCalled();

  await act(async () => {
    continueCelebration();
  });
  act(() => leave({destination: 'History', go: secondGo}));
  await tick(500);
  expect(mockRecordWorkout).toHaveBeenCalledTimes(1);
  expect(go).toHaveBeenCalledTimes(1);
  expect(secondGo).not.toHaveBeenCalled();
});

it('전면 오류가 나도 한 번 이동한다', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    mockWait.mockResolvedValueOnce(true);
    mockShow.mockRejectedValueOnce(new Error('광고 표시 오류'));
    await act(async () => leave());
    await tick(500);
    expect(go).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledTimes(1);
  } finally {
    warning.mockRestore();
  }
});

it('사전 안내는 뒤로가기를 무시하고 iOS 모달이 닫힌 뒤 ATT 요청을 이어간다', async () => {
  const originalOS = Platform.OS;
  Platform.OS = 'ios';
  try {
    const continued = jest.fn();
    act(() => {
      showPrePrompt().then(continued);
    });
    const modal = renderer.root.findByType(Modal);
    act(() => modal.props.onRequestClose());
    expect(modal.props.visible).toBe(true);
    expect(continued).not.toHaveBeenCalled();
    const button = renderer.root.findByType(Button);
    expect(button.props.title).toBe('계속');
    await act(async () => button.props.onPress());
    expect(modal.props.visible).toBe(false);
    expect(continued).not.toHaveBeenCalled();
    await act(async () => modal.props.onDismiss());
    expect(continued).toHaveBeenCalledTimes(1);
  } finally {
    Platform.OS = originalOS;
  }
});
